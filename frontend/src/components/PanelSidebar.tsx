import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ShieldCheck, Calculator, GraduationCap, Users, LogOut, Home, School, ChevronDown,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Role, SessionUser, logout, panelPathFor } from "@/lib/auth";
import { buildMenu, moduleHref } from "@/lib/panelMenus";
import { SYSTEM_CONFIG_SECTIONS, systemConfigHref } from "@/lib/systemConfigMenus";
import { usePermissions } from "@/hooks/usePermissions";
import { applyBackendModulePermissions } from "@/lib/permissions";
import logo from "@/assets/logo.png";

const roleHeader: Record<Role, { title: string; Icon: React.ComponentType<{ className?: string }> }> = {
  admin: { title: "Administrator", Icon: ShieldCheck },
  accountant: { title: "Accountant", Icon: Calculator },
  teacher: { title: "Teacher", Icon: GraduationCap },
  parent: { title: "Parent", Icon: Users },
  student: { title: "Student", Icon: School },
};

const PanelSidebar = ({ user }: { user: SessionUser }) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const head = roleHeader[user.role];
  const HeadIcon = head.Icon;
  const { perms } = usePermissions();
  const rolePerms = applyBackendModulePermissions(perms[user.role], user.modulePermissions);
  const items = buildMenu(rolePerms, user.modulePermissions);
  const rootPath = panelPathFor(user.role);
  const systemConfigBase = `/panel/${user.role}/system-config`;
  const systemConfigOpen = pathname.startsWith(systemConfigBase);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to={rootPath} className="flex items-center gap-3 px-2 py-3">
          <img src={logo} alt="The Concept" className="h-9 w-9 rounded bg-background p-0.5 shrink-0" />
          {!collapsed && (
            <div className="leading-tight min-w-0">
              <div className="font-display text-sm font-bold truncate">The Concept</div>
              <div className="text-[10px] tracking-widest uppercase text-sidebar-foreground/60 truncate">{head.title}</div>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((m) => {
                if (m.key === "system-config") {
                  return (
                    <Collapsible key={m.key} defaultOpen={systemConfigOpen} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={m.label}
                            isActive={systemConfigOpen}
                            className="group-data-[state=open]/collapsible:bg-sidebar-accent/50"
                          >
                            <m.Icon className="h-4 w-4" />
                            <span>{m.label}</span>
                            <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {SYSTEM_CONFIG_SECTIONS.map((sub) => {
                              const subHref = systemConfigHref(user.role, sub.key);
                              const subActive = pathname === subHref;
                              const SubIcon = sub.icon;
                              return (
                                <SidebarMenuSubItem key={sub.key}>
                                  <SidebarMenuSubButton asChild isActive={subActive}>
                                    <NavLink to={subHref}>
                                      <SubIcon className="h-4 w-4" />
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
                }

                const href = moduleHref(user.role, m.key);
                const active = m.key === "dashboard" ? pathname === rootPath : pathname === href;
                return (
                  <SidebarMenuItem key={m.key}>
                    <SidebarMenuButton asChild isActive={active} tooltip={m.label}>
                      <NavLink to={href} end={m.key === "dashboard"}>
                        <m.Icon className="h-4 w-4" />
                        <span>{m.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Back to website">
                  <Link to="/"><Home className="h-4 w-4" /><span>Public Website</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => void logout()} tooltip="Sign out">
                  <LogOut className="h-4 w-4" /><span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2 min-w-0">
          <div className="h-8 w-8 rounded-full bg-accent/20 grid place-items-center shrink-0">
            <HeadIcon className="h-4 w-4 text-accent" />
          </div>
          {!collapsed && (
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-[11px] text-sidebar-foreground/60 truncate">{user.email}</div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default PanelSidebar;
