import type { ModuleActionCaps } from "@/lib/permissions";
import AcademyFeesManagement from "./AcademyFeesManagement";

export default function FeesTab({ caps }: { caps: ModuleActionCaps }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4">
      <AcademyFeesManagement caps={caps} />
    </div>
  );
}
