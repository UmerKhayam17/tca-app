import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ShieldCheck, Calculator, GraduationCap, Users, LogOut, Home, School, ChevronDown,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Role, SessionUser, logout, panelPathFor } from "@/lib/auth";
import { buildGroupedMenu, moduleHref, type MenuItem } from "@/lib/panelMenus";
import { SYSTEM_CONFIG_SECTIONS, systemConfigHref } from "@/lib/systemConfigMenus";
import { STUDENT_MANAGEMENT_SECTIONS, studentManagementHref } from "@/lib/studentManagementMenus";
import { TEST_EXAMS_SECTIONS, testExamsHref } from "@/lib/testExamsMenus";
import { getTimetableSections, timetableHref } from "@/lib/timetableMenus";
import { usePermissions } from "@/hooks/usePermissions";
import { applyBackendModulePermissions, resolveModuleCaps, type ModuleKey } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

const roleHeader: Record<Role, { title: string; Icon: React.ComponentType<{ className?: string }> }> = {
  admin: { title: "Administrator", Icon: ShieldCheck },
  accountant: { title: "Accountant", Icon: Calculator },
  teacher: { title: "Teacher", Icon: GraduationCap },
  parent: { title: "Parent", Icon: Users },
  student: { title: "Student", Icon: School },
};

const COLLAPSIBLE_MODULE_KEYS = new Set<ModuleKey>([
  "system-config",
  "student-management",
  "timetable",
  "exams",
]);

const PanelSidebar = ({ user }: { user: SessionUser }) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const head = roleHeader[user.role];
  const HeadIcon = head.Icon;
  const { perms } = usePermissions();
  const rolePerms = applyBackendModulePermissions(perms[user.role], user.modulePermissions);
  const groups = buildGroupedMenu(rolePerms, user.modulePermissions);
  const rootPath = panelPathFor(user.role);
  const systemConfigBase = `/panel/${user.role}/system-config`;
  const systemConfigOpen = pathname.startsWith(systemConfigBase);
  const studentMgmtBase = `/panel/${user.role}/student-management`;
  const studentMgmtOpen = pathname.startsWith(studentMgmtBase);
  const timetableBase = `/panel/${user.role}/timetable`;
  const timetableOpen = pathname.startsWith(timetableBase);
  const testExamsBase = `/panel/${user.role}/exams`;
  const testExamsOpen = pathname.startsWith(testExamsBase);
  const timetableCaps = resolveModuleCaps("timetable", rolePerms.timetable, user.modulePermissions);
  const timetableSections = getTimetableSections({ caps: timetableCaps, role: user.role });

  const collapsibleTriggerClass =
    "!h-8 min-h-8 py-1.5 items-center overflow-hidden [&>span]:truncate [&>span]:text-sm";

  const renderCollapsibleModule = (m: MenuItem) => {
    const isSystemConfig = m.key === "system-config";
    const isStudentMgmt = m.key === "student-management";
    const isTestExams = m.key === "exams";
    const open = isSystemConfig
      ? systemConfigOpen
      : isStudentMgmt
        ? studentMgmtOpen
        : isTestExams
          ? testExamsOpen
          : timetableOpen;
    const sections = isSystemConfig
      ? SYSTEM_CONFIG_SECTIONS
      : isStudentMgmt
        ? STUDENT_MANAGEMENT_SECTIONS
        : isTestExams
          ? TEST_EXAMS_SECTIONS
          : timetableSections;
    const hrefFor = isSystemConfig
      ? systemConfigHref
      : isStudentMgmt
        ? studentManagementHref
        : isTestExams
          ? testExamsHref
          : timetableHref;

    return (
      <Collapsible key={m.key} defaultOpen={open} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={m.label}
              isActive={open}
              className={cn(
                collapsibleTriggerClass,
                "group-data-[state=open]/collapsible:bg-sidebar-accent/50"
              )}
            >
              <m.Icon className="h-4 w-4 shrink-0" />
              <span>{m.shortLabel ?? m.label}</span>
              <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="mx-0 border-l border-sidebar-border pl-2">
              {sections.map((sub) => {
                const subHref = hrefFor(user.role, sub.key);
                const subActive =
                  pathname === subHref ||
                  pathname.startsWith(`${subHref}/`) ||
                  (isTestExams &&
                    sub.key === "enter-tests" &&
                    /^\/panel\/[^/]+\/exams\/enter-tests\/[a-f0-9]{24}/i.test(pathname));
                const SubIcon = sub.icon;
                return (
                  <SidebarMenuSubItem key={sub.key}>
                    <SidebarMenuSubButton asChild isActive={subActive} className="h-7 text-xs">
                      <NavLink to={subHref}>
                        <SubIcon className="h-3.5 w-3.5" />
                        <span>{sub.label}</span>
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  };

  const renderFlatModule = (m: MenuItem) => {
    const href = moduleHref(
      user.role,
      m.key,
      m.key === "timetable" ? { caps: timetableCaps } : undefined,
    );
    const active =
      m.key === "dashboard"
        ? pathname === rootPath
        : pathname === href || pathname.startsWith(`${href}/`);

    return (
      <SidebarMenuItem key={m.key}>
        <SidebarMenuButton asChild isActive={active} tooltip={m.label} className="h-8">
          <NavLink to={href} end={m.key === "dashboard"}>
            <m.Icon className="h-4 w-4" />
            <span className="text-sm">{m.shortLabel ?? m.label}</span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-0">
        <Link to={rootPath} className="flex items-center gap-2.5 px-2 py-2.5">
          <img src={logo} alt="The Concept" className="h-8 w-8 rounded bg-background p-0.5 shrink-0" />
          {!collapsed && (
            <div className="leading-tight min-w-0">
              <div className="font-display text-sm font-bold truncate">The Concept</div>
              <div className="text-[10px] uppercase tracking-wide text-sidebar-foreground/60 truncate">{head.title}</div>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 py-1">
        {groups.map((group, index) => (
          <div key={group.id}>
            {index > 0 && <SidebarSeparator className="mx-2 my-1" />}
            <SidebarGroup className="p-1">
              <SidebarGroupLabel className="h-6 px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/55">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.items.map((m) =>
                    COLLAPSIBLE_MODULE_KEYS.has(m.key)
                      ? renderCollapsibleModule(m)
                      : renderFlatModule(m)
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        ))}

        <SidebarSeparator className="mx-2 my-1" />
        <SidebarGroup className="p-1">
          <SidebarGroupLabel className="h-6 px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/55">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Back to website" className="h-8">
                  <Link to="/"><Home className="h-4 w-4" /><span className="text-sm">Public Website</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => void logout()} tooltip="Sign out" className="h-8">
                  <LogOut className="h-4 w-4" /><span className="text-sm">Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-0">
        <div className="flex items-center gap-2.5 px-2 py-2 min-w-0">
          <div className="h-7 w-7 rounded-full bg-accent/20 grid place-items-center shrink-0">
            <HeadIcon className="h-3.5 w-3.5 text-accent" />
          </div>
          {!collapsed && (
            <div className="leading-tight min-w-0">
              <div className="text-xs font-semibold truncate">{user.name}</div>
              <div className="text-[10px] text-sidebar-foreground/60 truncate">{user.email}</div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default PanelSidebar;
