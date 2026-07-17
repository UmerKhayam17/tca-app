import type { ComponentType } from "react";
import {
  Clock,
  DoorOpen,
  GraduationCap,
  History,
  Layers,
  Link2,
  SlidersHorizontal,
  UserCircle,
} from "lucide-react";
import type { Role } from "./auth";
import { buildSidebarSubmenuGroups } from "./sidebarSubmenu";

export type SystemConfigSection =
  | "academic"
  | "sections"
  | "periods"
  | "rooms"
  | "teachers"
  | "teacher-assignments"
  | "timetable-rules"
  | "history";

export const SYSTEM_CONFIG_SECTIONS: {
  key: SystemConfigSection;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
    { key: "academic", label: "Sessions", icon: GraduationCap },
    { key: "sections", label: "Timetable sections", icon: Layers },
    { key: "periods", label: "Academy time configuration", icon: Clock },
    { key: "rooms", label: "Rooms", icon: DoorOpen },
    { key: "teachers", label: "Teachers", icon: UserCircle },
    { key: "teacher-assignments", label: "Teacher assignments", icon: Link2 },
    { key: "timetable-rules", label: "Timetable rules", icon: SlidersHorizontal },
    { key: "history", label: "Session history", icon: History },
  ];

export const SYSTEM_CONFIG_SIDEBAR_GROUPS = buildSidebarSubmenuGroups(SYSTEM_CONFIG_SECTIONS, [
  { label: "Academic year", keys: ["academic", "history"] },
  {
    label: "Timetable setup",
    keys: ["sections", "periods", "rooms", "teachers", "teacher-assignments", "timetable-rules"],
  },
]);

export const DEFAULT_SYSTEM_CONFIG_SECTION: SystemConfigSection = "academic";

export function isSystemConfigSection(value: string | undefined): value is SystemConfigSection {
  return SYSTEM_CONFIG_SECTIONS.some((s) => s.key === value);
}

export function systemConfigHref(role: Role, section: SystemConfigSection = DEFAULT_SYSTEM_CONFIG_SECTION) {
  return `/panel/${role}/system-config/${section}`;
}

const SESSION_MONGO_ID = /^[a-f0-9]{24}$/i;

export function isSessionMongoId(value: string | undefined): value is string {
  return Boolean(value && SESSION_MONGO_ID.test(value));
}

export function sessionDetailHref(role: Role, sessionId: string) {
  return `/panel/${role}/system-config/academic/${sessionId}`;
}

export function findSystemConfigSection(section: string | undefined): SystemConfigSection {
  return isSystemConfigSection(section) ? section : DEFAULT_SYSTEM_CONFIG_SECTION;
}
