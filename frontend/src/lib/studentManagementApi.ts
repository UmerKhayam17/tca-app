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

export interface AcademicRecord {
  institutionName?: string;
  className?: string;
  totalMarks?: number;
  obtainedMarks?: number;
  percentage?: number;
  year?: string;
}

export interface AcademyStudentRegisterBody {
  studentName: string;
  fatherName: string;
  dateOfBirth: string;
  nationality?: string;
  guardianName?: string;
  guardianRelation?: string;
  fatherGuardianCnic?: string;
  guardianOccupation?: string;
  guardianWorkAddress?: string;
  guardianEmail?: string;
  studentEmail?: string;
  postalAddress?: string;
  contactPhoneRes?: string;
  phone?: string;
  mobileNo?: string;
  permanentAddress?: string;
  currentSchoolCollege?: string;
  academicHistory?: AcademicRecord[];
  gender: string;
  classId: string;
  selectedSubjects: string[];
  isFullPackage: boolean;
  discountAmount?: number;
}

export interface AcademyStudent {
  _id: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  dateOfBirth?: string;
  nationality?: string;
  guardianName?: string;
  guardianRelation?: string;
  fatherGuardianCnic?: string;
  guardianOccupation?: string;
  guardianWorkAddress?: string;
  guardianEmail?: string;
  studentEmail?: string;
  postalAddress?: string;
  contactPhoneRes?: string;
  phone: string;
  permanentAddress?: string;
  currentSchoolCollege?: string;
  academicHistory?: AcademicRecord[];
  gender: "male" | "female" | "other";
  address?: string;
  classId: string | AcademyClass;
  selectedSubjects: AcademySubject[] | string[];
  isFullPackage: boolean;
  monthlyFee: number;
  admissionFee: number;
  discountAmount?: number;
  totalFee: number;
  status: string;
}

export interface FeePreview {
  monthlyFee: number;
  admissionFee: number;
  subtotal?: number;
  discountAmount?: number;
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
  dueDate?: string;
  receiptNumber?: string;
  paidAt?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface AcademyTimetableSlot {
  _id: string;
  classId: string;
  subjectId: AcademySubject | string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
}

export interface AcademyAttendanceRecord {
  _id: string;
  studentId: string;
  date: string;
  status: "present" | "absent" | "late" | "leave";
  subjectId?: AcademySubject | string;
  notes?: string;
}

export interface AcademyAssessmentRecord {
  _id: string;
  studentId: string;
  subjectId?: AcademySubject | string;
  title: string;
  assessmentType: string;
  examDate: string;
  totalMarks: number;
  obtainedMarks: number;
  remarks?: string;
}

export interface AcademyStudentRecord {
  student: AcademyStudent;
  enrollment: {
    isFullPackage: boolean;
    subjectCount: number;
    classSubjectsTotal: number;
    subjects: AcademySubject[];
  };
  timetable: AcademyTimetableSlot[];
  attendance: {
    summary: {
      present: number;
      absent: number;
      late: number;
      leave: number;
      total: number;
      attendanceRate: number | null;
    };
    records: AcademyAttendanceRecord[];
  };
  fees: {
    summary: {
      recordsCount: number;
      totalPaid: number;
      totalPending: number;
      byStatus: Record<string, number>;
    };
    records: AcademyFeeRecord[];
  };
  assessments: {
    summary: {
      count: number;
      averagePercentage: number | null;
      highestPercentage: number | null;
      lowestPercentage: number | null;
    };
    records: AcademyAssessmentRecord[];
  };
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
export const fetchSubjectsByClass = (classId: string, params?: { status?: string }) => {
  const q = params?.status ? `?status=${params.status}` : "";
  return api<AcademySubject[]>(`/classes/${classId}/subjects${q}`);
};

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
export const fetchAllFeeStructures = (params?: { status?: string; classId?: string }) => {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.classId) q.set("classId", params.classId);
  const qs = q.toString();
  return api<AcademyFeeStructure[]>(`/fee-structures${qs ? `?${qs}` : ""}`);
};

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
  discountAmount?: number;
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

export const registerAcademyStudent = (body: AcademyStudentRegisterBody) =>
  api<AcademyStudent>("/students", { method: "POST", body: JSON.stringify(body) });

export const updateAcademyStudent = (id: string, body: Record<string, unknown>) =>
  api<AcademyStudent>(`/students/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const getAcademyStudent = (id: string) => api<AcademyStudent>(`/students/${id}`);

export const getAcademyStudentRecord = (id: string) =>
  api<AcademyStudentRecord>(`/students/${id}/record`);

export const deleteAcademyStudent = (id: string) =>
  api<{ deleted: boolean; studentId?: string }>(`/students/${id}`, { method: "DELETE" });

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
