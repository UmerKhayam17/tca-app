import { Navigate } from "react-router-dom";
import type { ModuleActionCaps, PermLevel } from "@/lib/permissions";
import {
  academyStudentRoutes,
  isAcademyStudentId,
} from "@/lib/studentManagementMenus";
import { useAuth } from "@/hooks/useAuth";
import RegistrationTab from "@/components/modules/student-management/RegistrationTab";
import RegisterStudentPage from "@/components/modules/student-management/RegisterStudentPage";
import StudentDetailPage from "@/components/modules/student-management/StudentDetailPage";

/** Student Records module — same academy enrollment UI as Registration, under `/panel/:role/students`. */
const StudentsRecordsModule = ({
  caps,
  section,
  action,
}: {
  perm: PermLevel;
  caps: ModuleActionCaps;
  section?: string;
  action?: string;
}) => {
  const { user } = useAuth();
  const routes = user?.role ? academyStudentRoutes(user.role, "records") : null;
  const listHref = routes?.list ?? "..";

  if (section === "new") {
    if (!caps.canCreate) return <Navigate to={listHref} replace />;
    return <RegisterStudentPage caps={caps} routes={routes ?? undefined} />;
  }

  if (section && isAcademyStudentId(section)) {
    if (action === "edit") {
      if (!caps.canEdit) return <Navigate to={routes?.detail(section) ?? listHref} replace />;
      return <RegisterStudentPage caps={caps} studentId={section} routes={routes ?? undefined} />;
    }
    if (action) return <Navigate to={routes?.detail(section) ?? listHref} replace />;
    return <StudentDetailPage caps={caps} studentId={section} routes={routes ?? undefined} />;
  }

  if (section) return <Navigate to={listHref} replace />;

  return (
    <RegistrationTab
      caps={caps}
      routes={routes ?? undefined}
      showHeading={false}
      registerLabel="Register student"
      emptyHint="No students on record yet."
    />
  );
};

export default StudentsRecordsModule;
