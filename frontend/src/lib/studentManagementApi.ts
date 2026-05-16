import { getApiRoot, parseJson } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const url = `${getApiRoot()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(init.body instanceof FormData) && init.method !== "GET" && init.method !== "HEAD") {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  return fetch(url, { ...init, credentials: "include", headers });
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AcademyClass {
  _id: string;
  className: string;
  totalSubjects: number;
  status: "active" | "inactive";
  createdAt?: string;
}

export interface AcademySubject {
  _id: string;
  subjectName: string;
  subjectCode: string;
  classId: string;
  status: "active" | "inactive";
}

export interface AcademyFeeStructure {
  _id: string;
  classId: string | AcademyClass;
  perSubjectFee: number;
  fullPackageFee: number;
  admissionFee: number;
  status: string;
  effectiveDate?: string;
}

export interface AcademyStudent {
  _id: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  phone: string;
  gender: "male" | "female" | "other";
  address?: string;
  classId: string | AcademyClass;
  selectedSubjects: AcademySubject[] | string[];
  isFullPackage: boolean;
  monthlyFee: number;
  admissionFee: number;
  totalFee: number;
  status: string;
}

export interface FeePreview {
  monthlyFee: number;
  admissionFee: number;
  totalFee: number;
  perSubjectFee?: number;
  fullPackageFee?: number;
}

export interface AcademyFeeRecord {
  _id: string;
  studentId: AcademyStudent | string;
  month: number;
  year: number;
  amount: number;
  feeType: "admission" | "monthly";
  status: "pending" | "paid" | "overdue" | "waived";
  receiptNumber?: string;
  paidAt?: string;
  paymentMethod?: string;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authedFetch(`/student-management${path}`, init);
  const body = await parseJson<{ success?: boolean; data?: T; message?: string; pagination?: Pagination }>(res);
  if (!res.ok) throw new Error(body.message || `Request failed (${res.status})`);
  return body.data as T;
}

// Classes
export const fetchAcademyClasses = (params?: { search?: string; status?: string }) => {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.status) q.set("status", params.status);
  const qs = q.toString();
  return api<AcademyClass[]>(`/classes${qs ? `?${qs}` : ""}`);
};

export const createAcademyClass = (body: { className: string; totalSubjects?: number; status?: string }) =>
  api<AcademyClass>("/classes", { method: "POST", body: JSON.stringify(body) });

export const updateAcademyClass = (id: string, body: Partial<AcademyClass>) =>
  api<AcademyClass>(`/classes/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteAcademyClass = (id: string) =>
  api<{ deleted: boolean }>(`/classes/${id}`, { method: "DELETE" });

// Subjects
export const fetchSubjectsByClass = (classId: string) =>
  api<AcademySubject[]>(`/classes/${classId}/subjects`);

export const createAcademySubject = (body: {
  subjectName: string;
  classId: string;
  subjectCode: string;
  status?: string;
}) => api<AcademySubject>("/subjects", { method: "POST", body: JSON.stringify(body) });

export const updateAcademySubject = (id: string, body: Partial<AcademySubject>) =>
  api<AcademySubject>(`/subjects/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteAcademySubject = (id: string) =>
  api<{ deleted: boolean }>(`/subjects/${id}`, { method: "DELETE" });

// Fee structure
export const fetchFeeStructureByClass = (classId: string) =>
  api<AcademyFeeStructure | null>(`/fee-structures/class/${classId}`);

export const createFeeStructure = (body: {
  classId: string;
  perSubjectFee: number;
  fullPackageFee: number;
  admissionFee: number;
}) => api<AcademyFeeStructure>("/fee-structures", { method: "POST", body: JSON.stringify(body) });

export const updateFeeStructure = (id: string, body: Partial<AcademyFeeStructure>) =>
  api<AcademyFeeStructure>(`/fee-structures/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const previewFees = (body: {
  classId: string;
  selectedSubjects: string[];
  isFullPackage: boolean;
}) =>
  api<FeePreview>("/fee-structures/preview", { method: "POST", body: JSON.stringify(body) });

// Students
export const fetchAcademyStudents = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  status?: string;
}) => {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.search) q.set("search", params.search);
  if (params?.classId) q.set("classId", params.classId);
  if (params?.status) q.set("status", params.status);
  const res = await authedFetch(`/student-management/students?${q}`);
  const body = await parseJson<{
    success?: boolean;
    data?: AcademyStudent[];
    pagination?: Pagination;
    message?: string;
  }>(res);
  if (!res.ok) throw new Error(body.message || "Failed to load students");
  return { students: body.data || [], pagination: body.pagination };
};

export const registerAcademyStudent = (body: {
  studentName: string;
  fatherName: string;
  phone: string;
  gender: string;
  address?: string;
  classId: string;
  selectedSubjects: string[];
  isFullPackage: boolean;
}) => api<AcademyStudent>("/students", { method: "POST", body: JSON.stringify(body) });

export const updateAcademyStudent = (id: string, body: Record<string, unknown>) =>
  api<AcademyStudent>(`/students/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const getAcademyStudent = (id: string) => api<AcademyStudent>(`/students/${id}`);

export const exportStudentsCsv = async (params?: { search?: string; classId?: string }) => {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.classId) q.set("classId", params.classId);
  const token = getAccessToken();
  const url = `${getApiRoot()}/student-management/students/export?${q}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
};

// Fees
export const fetchAcademyFees = async (params?: {
  page?: number;
  status?: string;
  classId?: string;
  month?: number;
  year?: number;
}) => {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.status) q.set("status", params.status);
  if (params?.classId) q.set("classId", params.classId);
  if (params?.month) q.set("month", String(params.month));
  if (params?.year) q.set("year", String(params.year));
  const res = await authedFetch(`/student-management/fees?${q}`);
  const body = await parseJson<{
    success?: boolean;
    data?: AcademyFeeRecord[];
    pagination?: Pagination;
    message?: string;
  }>(res);
  if (!res.ok) throw new Error(body.message || "Failed to load fees");
  return { records: body.data || [], pagination: body.pagination };
};

export const generateMonthlyFees = (body: { month: number; year: number; classId?: string }) =>
  api<{ created: number; skipped: number }>("/fees/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const payAcademyFee = (id: string, body?: { paymentMethod?: string; notes?: string }) =>
  api<AcademyFeeRecord>(`/fees/${id}/pay`, { method: "PATCH", body: JSON.stringify(body || {}) });

export const fetchStudentFeeHistory = (studentId: string) =>
  api<{ student: AcademyStudent; records: AcademyFeeRecord[] }>(`/fees/student/${studentId}`);
