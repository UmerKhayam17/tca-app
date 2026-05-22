import type { AcademicRecord, AcademyStudent } from "@/lib/studentManagementApi";
import { resolveClassId, resolveSubjectIds } from "./studentDisplayUtils";

export type AcademicRow = {
  institutionName: string;
  className: string;
  totalMarks: string;
  obtainedMarks: string;
  percentage: string;
  year: string;
};

export const emptyAcademicRow = (): AcademicRow => ({
  institutionName: "",
  className: "",
  totalMarks: "",
  obtainedMarks: "",
  percentage: "",
  year: "",
});

export const defaultRegisterForm = () => ({
  studentName: "",
  fatherName: "",
  dateOfBirth: "",
  nationality: "Pakistan",
  guardianName: "",
  guardianRelation: "",
  fatherGuardianCnic: "",
  guardianOccupation: "",
  guardianWorkAddress: "",
  guardianEmail: "",
  studentEmail: "",
  postalAddress: "",
  contactPhoneRes: "",
  mobileNo: "",
  permanentAddress: "",
  currentSchoolCollege: "",
  academicHistory: [emptyAcademicRow()],
  gender: "male",
  classId: "",
  isFullPackage: false,
  selectedSubjects: [] as string[],
  discountAmount: "",
  status: "active" as "active" | "inactive" | "suspended",
});

export function mapStudentToForm(student: AcademyStudent) {
  const history =
    student.academicHistory?.length
      ? student.academicHistory.map((r) => ({
          institutionName: r.institutionName || "",
          className: r.className || "",
          totalMarks: r.totalMarks != null ? String(r.totalMarks) : "",
          obtainedMarks: r.obtainedMarks != null ? String(r.obtainedMarks) : "",
          percentage: r.percentage != null ? String(r.percentage) : "",
          year: r.year || "",
        }))
      : [emptyAcademicRow()];

  return {
    studentName: student.studentName || "",
    fatherName: student.fatherName || "",
    dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : "",
    nationality: student.nationality || "Pakistan",
    guardianName: student.guardianName || "",
    guardianRelation: student.guardianRelation || "",
    fatherGuardianCnic: student.fatherGuardianCnic || "",
    guardianOccupation: student.guardianOccupation || "",
    guardianWorkAddress: student.guardianWorkAddress || "",
    guardianEmail: student.guardianEmail || "",
    studentEmail: student.studentEmail || "",
    postalAddress: student.postalAddress || student.address || "",
    contactPhoneRes: student.contactPhoneRes || "",
    mobileNo: student.phone || "",
    permanentAddress: student.permanentAddress || "",
    currentSchoolCollege: student.currentSchoolCollege || "",
    academicHistory: history,
    gender: student.gender || "male",
    classId: resolveClassId(student.classId),
    isFullPackage: student.isFullPackage ?? false,
    selectedSubjects: resolveSubjectIds(student.selectedSubjects),
    discountAmount: String(student.discountAmount ?? 0),
    status: (student.status as "active" | "inactive" | "suspended") || "active",
  };
}

export function buildStudentPayload(form: ReturnType<typeof defaultRegisterForm>) {
  return {
    studentName: form.studentName.trim(),
    fatherName: form.fatherName.trim(),
    dateOfBirth: form.dateOfBirth,
    nationality: form.nationality.trim() || "Pakistan",
    guardianName: form.guardianName.trim(),
    guardianRelation: form.guardianRelation.trim(),
    fatherGuardianCnic: form.fatherGuardianCnic.trim(),
    guardianOccupation: form.guardianOccupation.trim(),
    guardianWorkAddress: form.guardianWorkAddress.trim(),
    guardianEmail: form.guardianEmail.trim(),
    studentEmail: form.studentEmail.trim(),
    postalAddress: form.postalAddress.trim(),
    contactPhoneRes: form.contactPhoneRes.trim(),
    mobileNo: form.mobileNo.trim(),
    permanentAddress: form.permanentAddress.trim(),
    currentSchoolCollege: form.currentSchoolCollege.trim(),
    academicHistory: toAcademicPayload(form.academicHistory),
    gender: form.gender,
    classId: form.classId,
    selectedSubjects: form.selectedSubjects,
    isFullPackage: form.isFullPackage,
    discountAmount: Number(form.discountAmount) || 0,
    status: form.status,
  };
}

export function toAcademicPayload(rows: AcademicRow[]): AcademicRecord[] {
  return rows
    .filter((r) => r.institutionName.trim() || r.className.trim() || r.year.trim())
    .map((r) => ({
      institutionName: r.institutionName.trim(),
      className: r.className.trim(),
      totalMarks: r.totalMarks ? Number(r.totalMarks) : undefined,
      obtainedMarks: r.obtainedMarks ? Number(r.obtainedMarks) : undefined,
      percentage: r.percentage ? Number(r.percentage) : undefined,
      year: r.year.trim(),
    }));
}
