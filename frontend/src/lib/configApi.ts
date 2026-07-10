import { getApiRoot, parseJson } from "@/lib/api";
import { authedFetch } from "@/lib/auth";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authedFetch(`/config${path}`, init);
  const body = await parseJson<{ success?: boolean; data?: T; message?: string; details?: unknown }>(res);
  if (!res.ok) {
    const msg =
      body.message ||
      (Array.isArray(body.details) ? (body.details as { message?: string }[]).map((d) => d.message).join(", ") : null) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body.data as T;
}

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type SessionStatus = "active" | "completed" | "archived";

export interface AcademicSession {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status?: SessionStatus;
  isActive: boolean;
  isClosed?: boolean;
  workingDays?: Weekday[];
  timezone?: string;
  completedAt?: string;
  archivedAt?: string;
  clonedFrom?: string;
  notes?: string;
  writable?: boolean;
}

export interface SessionHistory {
  session: AcademicSession;
  summary: {
    classCount: number;
    sectionCount: number;
    studentCount: number;
    timetableVersions: number;
    scheduleSlots: number;
    versionsByStatus: Record<string, number>;
  };
  academy: {
    classCount: number;
    sectionCount: number;
    studentCount: number;
    classes: {
      _id: string;
      className: string;
      status: string;
      sections: { _id: string; sectionName: string; status: string }[];
    }[];
  };
  classes: { _id: string; name: string; sections: { _id: string; name: string }[]; subjects: { _id: string; name: string; code: string }[] }[];
  timetableVersions: {
    _id: string;
    version: number;
    status: string;
    class?: { name: string };
    section?: { name: string };
    publishedAt?: string;
    createdAt?: string;
  }[];
  auditLogs: {
    _id: string;
    action: string;
    details?: Record<string, unknown>;
    createdAt: string;
    user?: { name: string; email?: string };
  }[];
}

export interface SchoolClass {
  _id: string;
  name: string;
  session: string | AcademicSession;
  sections?: SchoolSection[];
  subjects?: SchoolSubject[];
  classTeacher?: { _id: string; name: string };
  order?: number;
}

export interface SchoolSection {
  _id: string;
  name: string;
  class: string | { _id: string; name: string; session?: string };
  teacher?: { _id: string; name: string; email?: string } | null;
  maxStudents?: number;
  studentCount?: number;
}

export interface SchoolSubject {
  _id: string;
  name: string;
  code: string;
  class: string | { _id: string; name: string };
  teacher?: { _id: string; name: string };
}

const SESSION_STATUSES: SessionStatus[] = ["active", "completed", "archived"];

export function sessionStatus(s: AcademicSession): SessionStatus {
  if (s.status && SESSION_STATUSES.includes(s.status)) return s.status;
  if (s.isClosed) return "completed";
  if (s.isActive) return "active";
  return "active";
}

export function isSessionWritable(s: AcademicSession): boolean {
  return s.writable ?? sessionStatus(s) === "active";
}

/** Completed and archived sessions cannot be made active again. */
export function canActivateSession(s: AcademicSession): boolean {
  const st = sessionStatus(s);
  return st !== "active" && st !== "completed" && st !== "archived";
}

/** Sentinel for the session bar “All sessions” option (not persisted across refresh). */
export const ALL_SESSIONS_ID = "__all__";

export function isAllSessions(sessionId: string | undefined | null): boolean {
  return sessionId === ALL_SESSIONS_ID;
}

/** Mongo session id for API queries, or undefined when browsing all sessions. */
export function sessionQueryId(sessionId: string | undefined | null): string | undefined {
  if (!sessionId || isAllSessions(sessionId)) return undefined;
  return sessionId;
}

export function isSessionScopeWritable(
  sessionId: string | undefined | null,
  sessions: AcademicSession[]
): boolean {
  if (!sessionId || isAllSessions(sessionId)) return false;
  const selected = sessions.find((s) => s._id === sessionId);
  return selected ? isSessionWritable(selected) : false;
}

export const fetchSessions = (status?: SessionStatus) => {
  const q =
    status && typeof status === "string" && SESSION_STATUSES.includes(status as SessionStatus)
      ? `?status=${status}`
      : "";
  return api<AcademicSession[]>(`/sessions${q}`);
};

export const createSession = (body: {
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  status?: SessionStatus;
  workingDays?: Weekday[];
  timezone?: string;
  notes?: string;
}) => api<AcademicSession>("/sessions", { method: "POST", body: JSON.stringify(body) });

export const patchSession = (id: string, body: Partial<AcademicSession>) =>
  api<AcademicSession>(`/sessions/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const fetchSessionHistory = (sessionId: string) =>
  api<SessionHistory>(`/sessions/${sessionId}/history`);

export const completeSession = (sessionId: string) =>
  api<AcademicSession>(`/sessions/${sessionId}/complete`, { method: "POST" });

export const archiveSession = (sessionId: string) =>
  api<AcademicSession>(`/sessions/${sessionId}/archive`, { method: "POST" });

export const activateSession = (sessionId: string) =>
  api<AcademicSession>(`/sessions/${sessionId}/activate`, { method: "POST" });

export const cloneSessionStructure = (
  sourceSessionId: string,
  body: {
    name: string;
    startDate: string;
    endDate: string;
    activate?: boolean;
    workingDays?: Weekday[];
    timezone?: string;
    notes?: string;
  }
) =>
  api<{ session: AcademicSession; maps: Record<string, number> }>(
    `/sessions/${sourceSessionId}/clone-structure`,
    { method: "POST", body: JSON.stringify(body) }
  );

export type SessionEnrollmentImportInput = {
  sourceSessionId: string;
  classIds?: string[];
  includeFeeStructure?: boolean;
};

export type SessionEnrollmentImportResult = {
  classes: number;
  sections: number;
  subjects: number;
  feeStructures: number;
  skipped: { className: string; reason: string }[];
  importedClassNames: string[];
};

export type SessionShiftResult = {
  defaults: { classesCreated: number; subjectsCreated: number };
  enrollment: SessionEnrollmentImportResult;
  timetable: {
    periodTemplates: number;
    classes: number;
    sections: number;
    subjects: number;
  };
  sourceSession: { _id: string; name: string };
  targetSession: { _id: string; name: string };
};

export const importSessionEnrollment = (targetSessionId: string, body: SessionEnrollmentImportInput) =>
  api<SessionEnrollmentImportResult>(`/sessions/${targetSessionId}/import-enrollment`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const shiftSessionConfiguration = (targetSessionId: string, body: SessionEnrollmentImportInput) =>
  api<SessionShiftResult>(`/sessions/${targetSessionId}/shift-configuration`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const fetchClasses = (sessionId?: string) => {
  const q = sessionId ? `?sessionId=${sessionId}` : "";
  return api<SchoolClass[]>(`/classes${q}`);
};

export const createClass = (body: { name: string; session: string; classTeacher?: string; order?: number }) =>
  api<SchoolClass>("/classes", { method: "POST", body: JSON.stringify(body) });

export const patchClass = (id: string, body: Partial<{ name: string; classTeacher: string; order: number }>) =>
  api<SchoolClass>(`/classes/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const fetchSections = (params?: { classId?: string; sessionId?: string }) => {
  const q = new URLSearchParams();
  if (params?.classId) q.set("classId", params.classId);
  if (params?.sessionId) q.set("sessionId", params.sessionId);
  const qs = q.toString();
  return api<SchoolSection[]>(`/sections${qs ? `?${qs}` : ""}`);
};

export const createSection = (body: { name: string; class: string; teacher?: string; maxStudents?: number }) =>
  api<SchoolSection>("/sections", { method: "POST", body: JSON.stringify(body) });

export const patchSection = (id: string, body: Partial<{ name: string; teacher: string | null; maxStudents: number }>) =>
  api<SchoolSection>(`/sections/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteSection = (id: string) =>
  api<{ deleted: boolean }>(`/sections/${id}`, { method: "DELETE" });

export const fetchSubjects = (classId?: string) => {
  const q = classId ? `?classId=${classId}` : "";
  return api<SchoolSubject[]>(`/subjects${q}`);
};

export const createSubject = (body: {
  name: string;
  code: string;
  class: string;
  teacher?: string;
  totalMarks?: number;
  passingMarks?: number;
}) => api<SchoolSubject>("/subjects", { method: "POST", body: JSON.stringify(body) });

export const patchSubject = (id: string, body: Partial<SchoolSubject & { class: string }>) =>
  api<SchoolSubject>(`/subjects/${id}`, { method: "PATCH", body: JSON.stringify(body) });
