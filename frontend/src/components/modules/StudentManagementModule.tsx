import { Navigate } from "react-router-dom";
import type { ModuleActionCaps, PermLevel } from "@/lib/permissions";
import {
  academyStudentRoutes,
  DEFAULT_STUDENT_MANAGEMENT_SECTION,
  findStudentManagementSection,
  isAcademyStudentId,
  type StudentManagementSection,
} from "@/lib/studentManagementMenus";
import { useAuth } from "@/hooks/useAuth";
import ClassesTab from "@/components/modules/student-management/ClassesTab";
import SubjectsTab from "@/components/modules/student-management/SubjectsTab";
import FeeStructureTab from "@/components/modules/student-management/FeeStructureTab";
import RegistrationTab from "@/components/modules/student-management/RegistrationTab";
import RegisterStudentPage from "@/components/modules/student-management/RegisterStudentPage";
import StudentDetailPage from "@/components/modules/student-management/StudentDetailPage";
import FeesTab from "@/components/modules/student-management/FeesTab";

const StudentManagementModule = ({
  caps,
  section: sectionParam,
  action,
  subAction,
}: {
  perm: PermLevel;
  caps: ModuleActionCaps;
  section?: string;
  action?: string;
  subAction?: string;
}) => {
  const { user } = useAuth();
  const registrationRoutes = user?.role ? academyStudentRoutes(user.role, "registration") : null;
  const registrationList = registrationRoutes?.list ?? "../registration";

  if (sectionParam === "registration") {
    if (action === "new") {
      if (!caps.canCreate) return <Navigate to={registrationList} replace />;
      return <RegisterStudentPage caps={caps} routes={registrationRoutes ?? undefined} />;
    }
    if (action && isAcademyStudentId(action)) {
      if (subAction === "edit") {
        if (!caps.canEdit) return <Navigate to={`../${action}`} replace />;
        return (
          <RegisterStudentPage
            caps={caps}
            studentId={action}
            routes={registrationRoutes ?? undefined}
          />
        );
      }
      if (subAction) return <Navigate to={`../${action}`} replace />;
      return (
        <StudentDetailPage
          caps={caps}
          studentId={action}
          routes={registrationRoutes ?? undefined}
        />
      );
    }
    if (action) return <Navigate to={registrationList} replace />;
    return <RegistrationTab caps={caps} routes={registrationRoutes ?? undefined} />;
  }

  const section: StudentManagementSection = sectionParam
    ? findStudentManagementSection(sectionParam)
    : DEFAULT_STUDENT_MANAGEMENT_SECTION;

  if (sectionParam && sectionParam !== section) {
    return <Navigate to={`../${section}`} replace />;
  }

  return (
    <>
      {section === "classes" && <ClassesTab caps={caps} />}
      {section === "subjects" && <SubjectsTab caps={caps} />}
      {section === "fees-structure" && <FeeStructureTab caps={caps} />}
      {section === "registration" && <RegistrationTab caps={caps} />}
      {section === "fees" && <FeesTab caps={caps} />}
    </>
  );
};

export default StudentManagementModule;
