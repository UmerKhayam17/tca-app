import {
  ShieldCheck, Calculator, GraduationCap, Users, LayoutDashboard,
  BookOpen, DollarSign, Calendar, Bell, BarChart3, UserCog, ClipboardList,
  Wallet, MessageSquare, Award, Settings as SettingsIcon, FileText, School, KeyRound, ListTree,
  SlidersHorizontal,
} from "lucide-react";
import { Role } from "./auth";
import { systemConfigHref } from "./systemConfigMenus";
import { studentManagementHref } from "./studentManagementMenus";
import { defaultTimetableSection, timetableHref } from "./timetableMenus";
import {
  MODULES, ModuleKey, ModuleDef, ModuleActionCaps, PermLevel, resolveModuleCaps,
} from "./permissions";

export const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, UserCog, GraduationCap, ClipboardList, Calendar,
  BookOpen, Award, Wallet, DollarSign, MessageSquare, Bell, BarChart3,
  Settings: SettingsIcon, FileText, KeyRound, ListTree, School, SlidersHorizontal,
};

export type MenuItem = ModuleDef & {
  Icon: React.ComponentType<{ className?: string }>;
};

export const roleMeta: Record<Role, {
  title: string;
  accentLabel: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = {
  admin:      { title: "Administrator Panel", accentLabel: "System Overview",   Icon: ShieldCheck },
  accountant: { title: "Accountant Panel",    accentLabel: "Finance Overview",  Icon: Calculator },
  teacher:    { title: "Teacher Panel",       accentLabel: "Today's Classroom", Icon: GraduationCap },
  parent:     { title: "Parent Panel",        accentLabel: "Child's Progress",  Icon: Users },
  student:    { title: "Student Panel",       accentLabel: "My Learning",       Icon: School },
};

/** Build the visible menu for a role given its current permission map and optional session module actions. */
export const buildMenu = (
  rolePerms: Record<ModuleKey, PermLevel>,
  backendModulePerms?: Record<string, string[]>,
): MenuItem[] =>
  MODULES.filter((m) => {
    if (m.key === "dashboard") return true;
    return resolveModuleCaps(m.key, rolePerms[m.key], backendModulePerms).canView;
  })
    .map((m) => ({ ...m, Icon: ICONS[m.icon] || LayoutDashboard }));

export const findModule = (slug: string | undefined): ModuleDef | undefined =>
  MODULES.find((m) => (slug ? m.key === slug : m.key === "dashboard"));

export const moduleHref = (
  role: Role,
  key: ModuleKey,
  opts?: { caps?: ModuleActionCaps },
) =>
  key === "dashboard"
    ? `/panel/${role}`
    : key === "system-config"
      ? systemConfigHref(role)
      : key === "student-management"
        ? studentManagementHref(role)
        : key === "timetable" && opts?.caps
          ? timetableHref(role, defaultTimetableSection({ caps: opts.caps, role }))
          : `/panel/${role}/${key}`;
