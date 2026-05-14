import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, useStore } from "@/lib/store";
import { ModuleActionCaps, PermLevel } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";

const FeesModule = ({ perm: _perm, caps }: { perm: PermLevel; caps: ModuleActionCaps }) => {
  const fees = useStore(() => Store.listFees());
  const students = useStore(() => Store.listStudents());
  const canCollect = caps.canEdit;
  const { toast } = useToast();
  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? "—";

  const collect = (id: string) => {
    Store.saveFees(Store.listFees().map((f) =>
      f.id === id ? { ...f, status: "paid", paidOn: new Date().toISOString().slice(0, 10) } : f,
    ));
    toast({ title: "Payment recorded" });
  };

  const total = fees.reduce((s, f) => s + (f.status === "paid" ? f.amount : 0), 0);
  const due   = fees.reduce((s, f) => s + (f.status === "due"  ? f.amount : 0), 0);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Collected</div><div className="font-display text-2xl font-bold text-accent">₨ {total.toLocaleString()}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Due</div><div className="font-display text-2xl font-bold text-destructive">₨ {due.toLocaleString()}</div></Card>
        <Card className="p-4 col-span-2 sm:col-span-1"><div className="text-xs text-muted-foreground">Records</div><div className="font-display text-2xl font-bold text-primary">{fees.length}</div></Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Student</th>
                <th className="text-left px-4 py-3">Month</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Paid On</th>
                {canCollect && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {fees.map((f) => (
                <tr key={f.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-primary">{studentName(f.studentId)}</td>
                  <td className="px-4 py-3">{f.month}</td>
                  <td className="px-4 py-3">₨ {f.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${f.status === "paid" ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"}`}>{f.status}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{f.paidOn || "—"}</td>
                  {canCollect && (
                    <td className="px-4 py-3 text-right">
                      {f.status === "due" && <Button size="sm" variant="hero" onClick={() => collect(f.id)}>Collect</Button>}
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

export default FeesModule;
