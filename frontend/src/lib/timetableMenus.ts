import type { ComponentType } from "react";
import { Calendar, CalendarDays, LayoutGrid } from "lucide-react";
import type { Role } from "./auth";
import type { ModuleActionCaps } from "./permissions";

export type TimetableSection = "builder" | "view" | "mine";

export type TimetableSectionItem = {
  key: TimetableSection;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const SECTION_META: Record<TimetableSection, Omit<TimetableSectionItem, "key">> = {
  builder: { label: "Timetable builder", icon: LayoutGrid },
  view: { label: "Class view", icon: CalendarDays },
  mine: { label: "My schedule", icon: Calendar },
};

export function getTimetableSections(opts: {
  caps: ModuleActionCaps;
  role: Role;
}): TimetableSectionItem[] {
  const { caps, role } = opts;
  const canManage = caps.canEdit || caps.canCreate;
  const isTeacher = role === "teacher";
  const isStudentOrParent = role === "student" || role === "parent";

  if (isStudentOrParent) {
    return [{ key: "view", ...SECTION_META.view, label: "Schedule" }];
  }

  if (isTeacher && !canManage) {
    return [
      { key: "mine", ...SECTION_META.mine },
      { key: "view", ...SECTION_META.view, label: "Class timetable" },
    ];
  }

  const sections: TimetableSectionItem[] = [];
  if (canManage) sections.push({ key: "builder", ...SECTION_META.builder });
  sections.push({ key: "view", ...SECTION_META.view });
  if (isTeacher || canManage) sections.push({ key: "mine", ...SECTION_META.mine });
  return sections;
}

export function defaultTimetableSection(opts: {
  caps: ModuleActionCaps;
  role: Role;
}): TimetableSection {
  return getTimetableSections(opts)[0]?.key ?? "view";
}

export function timetableHref(role: Role, section: TimetableSection) {
  return `/panel/${role}/timetable/${section}`;
}

export function findTimetableSection(
  section: string | undefined,
  opts: { caps: ModuleActionCaps; role: Role }
): TimetableSection {
  const allowed = getTimetableSections(opts).map((s) => s.key);
  if (section && allowed.includes(section as TimetableSection)) {
    return section as TimetableSection;
  }
  return defaultTimetableSection(opts);
}
