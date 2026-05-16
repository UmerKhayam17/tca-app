import type { ComponentType } from "react";
import {
  Clock,
  DoorOpen,
  GraduationCap,
  History,
  Layers,
  Link2,
  ListChecks,
  SlidersHorizontal,
  UserCircle,
} from "lucide-react";
import type { Role } from "./auth";

export type SystemConfigSection =
  | "academic"
  | "sections"
  | "periods"
  | "rooms"
  | "teachers"
  | "teacher-assignments"
  | "requirements"
  | "timetable-rules"
  | "history";

export const SYSTEM_CONFIG_SECTIONS: {
  key: SystemConfigSection;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { key: "academic", label: "Academic", icon: GraduationCap },
  { key: "sections", label: "Sections", icon: Layers },
  { key: "periods", label: "Periods & breaks", icon: Clock },
  { key: "rooms", label: "Rooms", icon: DoorOpen },
  { key: "teachers", label: "Teachers", icon: UserCircle },
  { key: "teacher-assignments", label: "Assignments", icon: Link2 },
  { key: "requirements", label: "Weekly requirements", icon: ListChecks },
  { key: "timetable-rules", label: "Timetable rules", icon: SlidersHorizontal },
  { key: "history", label: "Session history", icon: History },
];

export const DEFAULT_SYSTEM_CONFIG_SECTION: SystemConfigSection = "academic";

export function isSystemConfigSection(value: string | undefined): value is SystemConfigSection {
  return SYSTEM_CONFIG_SECTIONS.some((s) => s.key === value);
}

export function systemConfigHref(role: Role, section: SystemConfigSection = DEFAULT_SYSTEM_CONFIG_SECTION) {
  return `/panel/${role}/system-config/${section}`;
}

export function findSystemConfigSection(section: string | undefined): SystemConfigSection {
  return isSystemConfigSection(section) ? section : DEFAULT_SYSTEM_CONFIG_SECTION;
}
