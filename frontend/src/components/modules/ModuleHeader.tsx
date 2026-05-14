import { Role } from "@/lib/auth";
import { ModuleDef } from "@/lib/permissions";
import { ICONS } from "@/lib/panelMenus";

const ModuleHeader = ({ module, role, right }: { module: ModuleDef; role: Role; right?: React.ReactNode }) => {
  const Icon = ICONS[module.icon] || ICONS.LayoutDashboard;
  return (
    <div className="bg-[image:var(--gradient-hero)] text-primary-foreground">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex items-center gap-4">
        <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-accent/20 border border-accent/40 grid place-items-center shrink-0">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-accent capitalize">{role} Portal</div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">{module.label}</h1>
          <p className="text-primary-foreground/80 text-xs sm:text-sm mt-1">{module.desc}</p>
        </div>
        {right && <div className="hidden sm:block">{right}</div>}
      </div>
    </div>
  );
};

export default ModuleHeader;
