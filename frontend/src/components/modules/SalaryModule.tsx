import type { ModuleActionCaps, PermLevel } from "@/lib/permissions";
import AcademySalaryManagement from "@/components/modules/student-management/AcademySalaryManagement";

/** Panel Teacher salary — live staff payroll from the API */
const SalaryModule = ({ perm: _perm, caps }: { perm: PermLevel; caps: ModuleActionCaps }) => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4">
      <AcademySalaryManagement caps={caps} />
    </div>
  );
};

export default SalaryModule;
