import type { ComponentType } from "react";
import { BookOpen, ClipboardList, GraduationCap, Receipt, Wallet } from "lucide-react";
import type { Role } from "./auth";

export type StudentManagementSection =
  | "classes"
  | "subjects"
  | "fees-structure"
  | "registration"
  | "fees";

export const STUDENT_MANAGEMENT_SECTIONS: {
  key: StudentManagementSection;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { key: "classes", label: "Classes", icon: GraduationCap },
  { key: "subjects", label: "Subjects", icon: BookOpen },
  { key: "fees-structure", label: "Fee structure", icon: Wallet },
  { key: "registration", label: "Registration", icon: ClipboardList },
  { key: "fees", label: "Fee management", icon: Receipt },
];

export const DEFAULT_STUDENT_MANAGEMENT_SECTION: StudentManagementSection = "classes";

export function isStudentManagementSection(value: string | undefined): value is StudentManagementSection {
  return STUDENT_MANAGEMENT_SECTIONS.some((s) => s.key === value);
}

export function studentManagementHref(
  role: Role,
  section: StudentManagementSection = DEFAULT_STUDENT_MANAGEMENT_SECTION
) {
  return `/panel/${role}/student-management/${section}`;
}

export function findStudentManagementSection(section: string | undefined): StudentManagementSection {
  return isStudentManagementSection(section) ? section : DEFAULT_STUDENT_MANAGEMENT_SECTION;
}
