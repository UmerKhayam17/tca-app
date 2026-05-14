import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ModuleRegistryEntry } from "@/lib/staffApi";

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

  return (
    <div className="col-span-2 space-y-3 rounded-lg border border-border bg-secondary/20 p-3">
      <div>
        <div className="text-sm font-semibold text-primary">Module permissions</div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Choose which academy modules this user can use and which operations apply (saved on the user record).
        </p>
      </div>
      <ScrollArea className="h-[min(320px,45vh)] pr-3">
        <div className="space-y-4">
          {modules.map((mod) => (
            <div key={mod.key} className="rounded-md border border-border bg-background/80 p-3">
              <div className="font-medium text-sm text-primary">{mod.name}</div>
              <p className="text-[11px] text-muted-foreground mb-2">{mod.description}</p>
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
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
