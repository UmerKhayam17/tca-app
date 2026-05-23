import type { ModuleActionCaps, PermLevel } from "@/lib/permissions";
import AcademyExpensesManagement from "@/components/modules/student-management/AcademyExpensesManagement";

/** Panel Academy expenses — operating costs from the API */
const ExpensesModule = ({ perm: _perm, caps }: { perm: PermLevel; caps: ModuleActionCaps }) => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4">
      <AcademyExpensesManagement caps={caps} />
    </div>
  );
};

export default ExpensesModule;
