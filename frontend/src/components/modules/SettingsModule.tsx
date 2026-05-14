import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  loadPermissions, savePermissions, resetPermissions,
  MODULES, PERM_OPTIONS, PERM_LABELS, PermLevel, ModuleKey,
} from "@/lib/permissions";
import { Role } from "@/lib/auth";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";

const ROLES: Role[] = ["admin", "accountant", "teacher", "parent", "student"];

const SettingsModule = () => {
  const { perms } = usePermissions();
  const { toast } = useToast();

  const update = (role: Role, mod: ModuleKey, value: PermLevel) => {
    const next = loadPermissions();
    next[role][mod] = value;
    savePermissions(next);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-semibold text-primary">Permission Matrix</div>
          <div className="text-xs text-muted-foreground">Changes apply instantly — sidebars and pages re-render.</div>
        </div>
        <Button variant="outline" onClick={() => { resetPermissions(); toast({ title: "Permissions reset to defaults" }); }}>
          Reset to defaults
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Module</th>
                {ROLES.map((r) => <th key={r} className="text-left px-4 py-3 font-medium capitalize">{r}</th>)}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => (
                <tr key={m.key} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-primary">{m.label}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-4 py-3">
                      <select
                        className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                        value={perms[r][m.key]}
                        onChange={(e) => update(r, m.key, e.target.value as PermLevel)}
                      >
                        {PERM_OPTIONS.map((o) => <option key={o} value={o}>{PERM_LABELS[o]}</option>)}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default SettingsModule;
