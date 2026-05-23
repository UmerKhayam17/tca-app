import { Navigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/lib/auth";
import { roleMeta, findModule, buildMenu, moduleHref } from "@/lib/panelMenus";
import { systemConfigHref } from "@/lib/systemConfigMenus";
import { studentManagementHref } from "@/lib/studentManagementMenus";
import { defaultTimetableSection, timetableHref } from "@/lib/timetableMenus";
import { testExamsHref } from "@/lib/testExamsMenus";
import { usePermissions } from "@/hooks/usePermissions";
import {
  applyBackendModulePermissions, ModuleKey, resolveModuleCaps,
} from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import SEO from "@/components/SEO";
import ModuleHeader from "@/components/modules/ModuleHeader";
import StudentsRecordsModule from "@/components/modules/StudentsRecordsModule";
import UsersModule from "@/components/modules/UsersModule";
import AttendanceModule from "@/components/modules/AttendanceModule";
import TimetableModule from "@/components/modules/TimetableModule";
import SystemConfigModule from "@/components/modules/SystemConfigModule";
import AssignmentsModule from "@/components/modules/AssignmentsModule";
import ExamsModule from "@/components/modules/ExamsModule";
import FeesModule from "@/components/modules/FeesModule";
import SalaryModule from "@/components/modules/SalaryModule";
import LibraryModule from "@/components/modules/LibraryModule";
import ChatModule from "@/components/modules/ChatModule";
import AnnouncementsModule from "@/components/modules/AnnouncementsModule";
import ReportsModule from "@/components/modules/ReportsModule";
import SettingsModule from "@/components/modules/SettingsModule";
import DatasheetsModule from "@/components/modules/DatasheetsModule";
import PermissionsModule from "@/components/modules/PermissionsModule";
import StudentManagementModule from "@/components/modules/StudentManagementModule";
import PermissionCatalogModule from "@/components/modules/PermissionCatalogModule";
import { Store, useStore } from "@/lib/store";
import { fetchExams } from "@/lib/examApi";

const Dashboard = ({
  role,
  name,
  modulePermissions,
}: {
  role: Role;
  name: string;
  modulePermissions?: Record<string, string[]>;
}) => {
  const cfg = roleMeta[role];
  const HeaderIcon = cfg.Icon;
  const { perms } = usePermissions();
  const rolePerms = applyBackendModulePermissions(perms[role], modulePermissions);
  const items = buildMenu(rolePerms, modulePermissions).filter((m) => m.key !== "dashboard");

  // Live stats from real store data
  const students = useStore(() => Store.listStudents());
  const fees = useStore(() => Store.listFees());
  const attendance = useStore(() => Store.listAttendance());
  const salary = useStore(() => Store.listSalary());
  const { data: termExams = [] } = useQuery({
    queryKey: ["dashboard-term-exams"],
    queryFn: () => fetchExams(),
    retry: false,
  });

  const today = new Date().toISOString().slice(0, 10);
  const present = attendance.filter((a) => a.date === today && a.status === "present").length;
  const collected = fees.filter((f) => f.status === "paid").reduce((s, f) => s + f.amount, 0);
  const due = fees.filter((f) => f.status === "due").reduce((s, f) => s + f.amount, 0);
  const termExamCount = termExams.length;
  const pendingSalary = salary.filter((s) => s.status === "pending").length;

  const statsByRole: Record<Role, { label: string; value: string; hint: string }[]> = {
    admin: [
      { label: "Total Students", value: String(students.length), hint: "All institutions" },
      { label: "Fees Collected", value: `₨ ${collected.toLocaleString()}`, hint: "All time" },
      { label: "Outstanding",    value: `₨ ${due.toLocaleString()}`, hint: "Due fees" },
      { label: "Term exams",     value: String(termExamCount), hint: "Formal result events" },
    ],
    accountant: [
      { label: "Collected",       value: `₨ ${collected.toLocaleString()}`, hint: "Fees received" },
      { label: "Pending Dues",    value: `₨ ${due.toLocaleString()}`, hint: "Awaiting" },
      { label: "Pending Salary",  value: String(pendingSalary), hint: "To process" },
      { label: "Records",         value: String(fees.length), hint: "Fee entries" },
    ],
    teacher: [
      { label: "My Students", value: String(students.length), hint: "Across sections" },
      { label: "Present Today", value: String(present), hint: today },
      { label: "Term exams",  value: String(termExamCount), hint: "Mid / final terms" },
      { label: "Assignments", value: String(Store.listAssignments().length), hint: "Active" },
    ],
    parent: [
      { label: "Children", value: "1", hint: "Linked profile" },
      { label: "Attendance", value: present ? "Present" : "Absent", hint: today },
      { label: "Term exams", value: String(termExamCount), hint: "Published results in Exams" },
      { label: "Fee Status", value: due ? "Due" : "Paid", hint: "Current month" },
    ],
    student: [
      { label: "Attendance", value: present ? "Present" : "Absent", hint: today },
      { label: "Term exams", value: String(termExamCount), hint: "See student profile" },
      { label: "Assignments", value: String(Store.listAssignments().length), hint: "Active" },
      { label: "Fee Status", value: due ? "Due" : "Paid", hint: "Current month" },
    ],
  };

  return (
    <section>
      <div className="bg-[image:var(--gradient-hero)] text-primary-foreground">
        <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex items-center gap-4">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-accent/20 border border-accent/40 grid place-items-center shrink-0">
            <HeaderIcon className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-accent">{cfg.accentLabel}</div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">{cfg.title}</h1>
            <p className="text-primary-foreground/80 text-xs sm:text-sm mt-1 truncate">
              Welcome back, <span className="font-semibold">{name}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-10">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {statsByRole[role].map((s) => (
            <Card key={s.label} className="p-4 sm:p-5 hover:shadow-elegant transition-smooth">
              <div className="text-xs sm:text-sm text-muted-foreground">{s.label}</div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-primary mt-2 break-words">{s.value}</div>
              <div className="text-[11px] sm:text-xs text-accent mt-1">{s.hint}</div>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-primary mb-4">Modules</h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {items.map((m) => (
              <Link key={m.key} to={moduleHref(role, m.key)}>
                <Card className="p-4 sm:p-5 group cursor-pointer hover:border-accent hover:shadow-elegant transition-smooth h-full">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg bg-accent/10 grid place-items-center group-hover:bg-accent transition-smooth shrink-0">
                      <m.Icon className="h-5 w-5 text-accent group-hover:text-accent-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-primary">{m.label}</div>
                      <div className="text-sm text-muted-foreground mt-1">{m.desc}</div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Panel = () => {
  const { role, slug, section, action, subAction } = useParams<{
    role: Role; slug?: string; section?: string; action?: string; subAction?: string;
  }>();
  const { user: session, loading } = useAuth();
  const { perms } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  if (!role || !roleMeta[role as Role]) return <Navigate to={`/panel/${session.role}`} replace />;
  if (session.role !== role) return <Navigate to={`/panel/${session.role}`} replace />;

  const r = role as Role;

  // Dashboard
  if (!slug) {
    return (
      <>
        <SEO title={`${roleMeta[r].title} | The Concept`} description={`${roleMeta[r].title} dashboard.`} />
        <Dashboard role={r} name={session.name} modulePermissions={session.modulePermissions} />
      </>
    );
  }

  const mod = findModule(slug);
  if (!mod) return <Navigate to={`/panel/${r}`} replace />;

  const rolePerms = applyBackendModulePermissions(perms[r], session.modulePermissions);
  const perm = rolePerms[mod.key as ModuleKey];
  const caps = resolveModuleCaps(mod.key as ModuleKey, perm, session.modulePermissions);

  if (mod.key === "system-config" && !section) {
    return <Navigate to={systemConfigHref(r)} replace />;
  }

  if (mod.key === "timetable" && !section) {
    return (
      <Navigate
        to={timetableHref(r, defaultTimetableSection({ caps, role: r }))}
        replace
      />
    );
  }

  if (mod.key === "exams" && !section) {
    return <Navigate to={testExamsHref(r)} replace />;
  }
  if (!caps.canView) {
    return (
      <div className="px-6 py-12 text-center">
        <h2 className="font-display text-2xl font-bold text-primary">Access denied</h2>
        <p className="text-muted-foreground mt-2">Your role does not have access to {mod.label}.</p>
      </div>
    );
  }

  const renderModule = () => {
    switch (mod.key) {
      case "users":         return <UsersModule perm={perm} caps={caps} />;
      case "student-management": return (
        <StudentManagementModule perm={perm} caps={caps} section={section} action={action} subAction={subAction} />
      );
      case "students":      return (
        <StudentsRecordsModule perm={perm} caps={caps} section={section} action={action} />
      );
      case "attendance":    return <AttendanceModule perm={perm} caps={caps} />;
      case "system-config": return <SystemConfigModule caps={caps} section={section} />;
      case "timetable":     return <TimetableModule caps={caps} section={section} role={r} />;
      case "assignments":   return <AssignmentsModule perm={perm} caps={caps} />;
      case "exams":         return <ExamsModule perm={perm} caps={caps} section={section} action={action} subAction={subAction} />;
      case "fees":          return <FeesModule perm={perm} caps={caps} />;
      case "salary":        return <SalaryModule perm={perm} caps={caps} />;
      case "library":       return <LibraryModule perm={perm} caps={caps} />;
      case "chat":          return <ChatModule user={session} perm={perm} caps={caps} />;
      case "announcements": return <AnnouncementsModule perm={perm} caps={caps} />;
      case "reports":       return <ReportsModule />;
      case "datasheets":    return <DatasheetsModule perm={perm} caps={caps} />;
      case "permissions":   return <PermissionsModule perm={perm} caps={caps} />;
      case "permission-catalog": return <PermissionCatalogModule role={r} />;
      case "settings":      return <SettingsModule />;
      default:              return <div className="p-6 text-muted-foreground">Module coming soon.</div>;
    }
  };

  return (
    <>
      <SEO title={`${mod.label} | ${roleMeta[r].title}`} description={mod.desc} />
      <ModuleHeader module={mod} role={r} />
      {renderModule()}
    </>
  );
};

export default Panel;
