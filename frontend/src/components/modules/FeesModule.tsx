import { useState } from "react";
import type { ModuleActionCaps, PermLevel } from "@/lib/permissions";
import AcademyFeesManagement from "@/components/modules/student-management/AcademyFeesManagement";
import FeeDefaultersTab from "@/components/modules/student-management/FeeDefaultersTab";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type FeesView = "records" | "defaulters";

/** Panel Fee Management — live academy tuition fees from the API */
const FeesModule = ({ perm: _perm, caps }: { perm: PermLevel; caps: ModuleActionCaps }) => {
  const { user } = useAuth();
  const isParent = user?.role === "parent";
  const [view, setView] = useState<FeesView>("records");

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      <div className="flex gap-1 p-1 rounded-lg bg-muted/50 w-fit">
        <button
          type="button"
          onClick={() => setView("records")}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            view === "records"
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-primary"
          )}
        >
          Fee records
        </button>
        {!isParent && (
          <button
            type="button"
            onClick={() => setView("defaulters")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              view === "defaulters"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            Defaulters
          </button>
        )}
      </div>
      {view === "records" || isParent ? <AcademyFeesManagement caps={caps} /> : <FeeDefaultersTab caps={caps} />}
    </div>
  );
};

export default FeesModule;
