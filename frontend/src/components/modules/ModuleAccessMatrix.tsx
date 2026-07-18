import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ModuleRegistryEntry } from "@/lib/staffApi";

function allActionsSelected(mod: ModuleRegistryEntry, value: Record<string, string[]>): boolean {
  const cur = value[mod.key] || [];
  return mod.actions.length > 0 && mod.actions.every((a) => cur.includes(a));
}

function anyActionSelected(mod: ModuleRegistryEntry, value: Record<string, string[]>): boolean {
  const cur = value[mod.key] || [];
  return mod.actions.some((a) => cur.includes(a));
}

export default function ModuleAccessMatrix({
  modules,
  value,
  onChange,
}: {
  modules: ModuleRegistryEntry[];
  value: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
}) {
  const toggle = (modKey: string, action: string, checked: boolean) => {
    const next = { ...value };
    const cur = new Set(next[modKey] || []);
    if (checked) cur.add(action);
    else cur.delete(action);
    const arr = [...cur].sort();
    if (arr.length === 0) delete next[modKey];
    else next[modKey] = arr;
    onChange(next);
  };

  const selectAllForModule = (mod: ModuleRegistryEntry, checked: boolean) => {
    const next = { ...value };
    if (checked) next[mod.key] = [...mod.actions].sort();
    else delete next[mod.key];
    onChange(next);
  };

  const allSelected =
    modules.length > 0 && modules.every((mod) => allActionsSelected(mod, value));

  const selectAllPermissions = () => {
    const next: Record<string, string[]> = {};
    modules.forEach((mod) => {
      if (mod.actions.length > 0) next[mod.key] = [...mod.actions].sort();
    });
    onChange(next);
  };

  const clearAllPermissions = () => onChange({});

  return (
    <div className="col-span-2 space-y-3 rounded-lg border border-border bg-secondary/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-primary">Module permissions</div>
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            className="font-medium text-primary underline-offset-2 hover:underline disabled:opacity-50"
            onClick={selectAllPermissions}
            disabled={allSelected || modules.length === 0}
          >
            Select all
          </button>
          <button
            type="button"
            className="font-medium text-muted-foreground underline-offset-2 hover:underline disabled:opacity-50"
            onClick={clearAllPermissions}
            disabled={Object.keys(value).length === 0}
          >
            Clear all
          </button>
        </div>
      </div>
      <ScrollArea className="h-[min(320px,45vh)] pr-3">
        <div className="space-y-4">
          {modules.map((mod) => {
            const moduleAll = allActionsSelected(mod, value);
            const moduleSome = !moduleAll && anyActionSelected(mod, value);
            return (
              <div key={mod.key} className="rounded-md border border-border bg-background/80 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-sm text-primary">{mod.name}</div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <Checkbox
                      checked={moduleAll ? true : moduleSome ? "indeterminate" : false}
                      onCheckedChange={(v) => selectAllForModule(mod, v === true)}
                    />
                    <span>Select all</span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {mod.actions.map((action) => {
                    const checked = Boolean(value[mod.key]?.includes(action));
                    return (
                      <label key={action} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => toggle(mod.key, action, v === true)}
                        />
                        <span className="capitalize">{action}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
