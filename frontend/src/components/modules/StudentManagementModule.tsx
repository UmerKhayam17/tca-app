import { Navigate } from "react-router-dom";
import type { ModuleActionCaps, PermLevel } from "@/lib/permissions";
import {
  DEFAULT_STUDENT_MANAGEMENT_SECTION,
  findStudentManagementSection,
  type StudentManagementSection,
} from "@/lib/studentManagementMenus";
import ClassesTab from "@/components/modules/student-management/ClassesTab";
import SubjectsTab from "@/components/modules/student-management/SubjectsTab";
import FeeStructureTab from "@/components/modules/student-management/FeeStructureTab";
import RegistrationTab from "@/components/modules/student-management/RegistrationTab";
import FeesTab from "@/components/modules/student-management/FeesTab";

const StudentManagementModule = ({
  caps,
  section: sectionParam,
}: {
  perm: PermLevel;
  caps: ModuleActionCaps;
  section?: string;
}) => {
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
