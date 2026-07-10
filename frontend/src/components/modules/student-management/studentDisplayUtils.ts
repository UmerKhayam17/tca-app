import type { AcademyClass, AcademyStudent, AcademySubject } from "@/lib/studentManagementApi";

export function classLabel(classId: AcademyStudent["classId"]): string {
  return typeof classId === "object" && classId && "className" in classId ? classId.className : "—";
}

export function sessionLabelFromClass(classId: AcademyStudent["classId"]): string {
  if (!classId || typeof classId === "string") return "";
  const session = classId.sessionId;
  if (!session || typeof session === "string") return "";
  return session.name || "";
}

export function sessionLabelFromAcademyClass(cls: AcademyClass | undefined): string {
  if (!cls?.sessionId) return "";
  if (typeof cls.sessionId === "string") return "";
  return cls.sessionId.name || "";
}

export function subjectList(subjects: AcademyStudent["selectedSubjects"], isFullPackage: boolean): string {
  if (isFullPackage) return "Full package (all subjects)";
  if (!Array.isArray(subjects) || subjects.length === 0) return "—";
  return subjects
    .map((s) => (typeof s === "object" && s && "subjectName" in s ? s.subjectName : String(s)))
    .join(", ");
}

export function formatPkr(n?: number) {
  if (n == null || Number.isNaN(n)) return "—";
  return `₨ ${n.toLocaleString()}`;
}

export function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export function resolveClassId(classId: AcademyStudent["classId"]): string {
  if (!classId) return "";
  return typeof classId === "string" ? classId : classId._id;
}

export function resolveSubjectIds(subjects: AcademyStudent["selectedSubjects"]): string[] {
  if (!Array.isArray(subjects)) return [];
  return subjects.map((s) => (typeof s === "string" ? s : (s as AcademySubject)._id));
}

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function subjectName(sub: { subjectName?: string } | string | undefined): string {
  if (!sub) return "—";
  if (typeof sub === "string") return sub;
  return sub.subjectName || "—";
}

export function subjectCode(sub: { subjectCode?: string; subjectName?: string } | string | undefined): string {
  if (!sub || typeof sub === "string") return "";
  return sub.subjectCode || "";
}

export function examPercentage(obtained: number, total: number): string {
  if (!total) return "—";
  return `${Math.round((obtained / total) * 100)}%`;
}
