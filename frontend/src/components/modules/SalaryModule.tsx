import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, useStore } from "@/lib/store";
import { ModuleActionCaps, PermLevel } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import PanelToolbar from "@/components/modules/PanelToolbar";
import { matchesPanelSearch } from "@/lib/panelSearch";

const SalaryModule = ({ perm: _perm, caps }: { perm: PermLevel; caps: ModuleActionCaps }) => {
  const salary = useStore(() => Store.listSalary());
  const staff = useStore(() => Store.listStaff());
  const canProcess = caps.canEdit;
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const staffName = (id: string) => staff.find((s) => s.id === id)?.name ?? "—";

  const salaryFiltered = useMemo(() => {
    if (!search.trim()) return salary;
    return salary.filter((s) =>
      matchesPanelSearch(search, staffName(s.staffId), s.month, s.status, s.amount, s.paidOn)
    );
  }, [salary, search, staff]);

  const process = (id: string) => {
    Store.saveSalary(Store.listSalary().map((s) =>
      s.id === id ? { ...s, status: "paid", paidOn: new Date().toISOString().slice(0, 10) } : s,
    ));
    toast({ title: "Salary processed" });
  };

  const totalPaid = salary.filter((s) => s.status === "paid").reduce((a, b) => a + b.amount, 0);
  const totalPending = salary.filter((s) => s.status === "pending").reduce((a, b) => a + b.amount, 0);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Paid</div><div className="font-display text-2xl font-bold text-accent">₨ {totalPaid.toLocaleString()}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Pending</div><div className="font-display text-2xl font-bold text-destructive">₨ {totalPending.toLocaleString()}</div></Card>
      </div>

      <PanelToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search staff, month, status…" />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Staff</th>
                <th className="text-left px-4 py-3">Month</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Status</th>
                {canProcess && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {salaryFiltered.length === 0 && (
                <tr>
                  <td colSpan={canProcess ? 5 : 4} className="px-4 py-8 text-center text-muted-foreground">
                    No salary records match your search.
                  </td>
                </tr>
              )}
              {salaryFiltered.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-primary">{staffName(s.staffId)}</td>
                  <td className="px-4 py-3">{s.month}</td>
                  <td className="px-4 py-3">₨ {s.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${s.status === "paid" ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"}`}>{s.status}</span>
                  </td>
                  {canProcess && (
                    <td className="px-4 py-3 text-right">
                      {s.status === "pending" && <Button size="sm" variant="hero" onClick={() => process(s.id)}>Process</Button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default SalaryModule;
