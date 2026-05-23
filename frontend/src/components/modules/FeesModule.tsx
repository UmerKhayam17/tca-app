import type { ModuleActionCaps, PermLevel } from "@/lib/permissions";
import AcademyFeesManagement from "@/components/modules/student-management/AcademyFeesManagement";

/** Panel Fee Management — live academy tuition fees from the API */
const FeesModule = ({ perm: _perm, caps }: { perm: PermLevel; caps: ModuleActionCaps }) => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4">
      <AcademyFeesManagement caps={caps} />
    </div>
  );
};

export default FeesModule;
