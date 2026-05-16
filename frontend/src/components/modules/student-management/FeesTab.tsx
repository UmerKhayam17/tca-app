import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { ModuleActionCaps } from "@/lib/permissions";
import {
  fetchAcademyClasses, fetchAcademyFees, generateMonthlyFees, payAcademyFee, type AcademyFeeRecord,
} from "@/lib/studentManagementApi";

function studentName(rec: AcademyFeeRecord) {
  const s = rec.studentId;
  if (typeof s === "object" && s && "studentName" in s) return s.studentName;
  return "—";
}

function studentIdLabel(rec: AcademyFeeRecord) {
  const s = rec.studentId;
  if (typeof s === "object" && s && "studentId" in s) return s.studentId;
  return "";
}

export default function FeesTab({ caps }: { caps: ModuleActionCaps }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: classes = [] } = useQuery({
    queryKey: ["academy-classes"],
    queryFn: () => fetchAcademyClasses(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["academy-fees", page, month, year, statusFilter, classFilter],
    queryFn: () =>
      fetchAcademyFees({
        page,
        month: Number(month),
        year: Number(year),
        status: statusFilter || undefined,
        classId: classFilter || undefined,
      }),
  });

  const genMut = useMutation({
    mutationFn: () =>
      generateMonthlyFees({
        month: Number(month),
        year: Number(year),
        classId: classFilter || undefined,
      }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["academy-fees"] });
      toast({ title: "Vouchers generated", description: `Created: ${r.created}, skipped: ${r.skipped}` });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const payMut = useMutation({
    mutationFn: (id: string) => payAcademyFee(id, { paymentMethod: "cash" }),
    onSuccess: (rec) => {
      qc.invalidateQueries({ queryKey: ["academy-fees"] });
      toast({ title: "Payment recorded", description: rec.receiptNumber ? `Receipt: ${rec.receiptNumber}` : undefined });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const records = data?.records ?? [];
  const pagination = data?.pagination;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <Card className="p-4 flex flex-wrap gap-3 items-end">
        <div>
          <Label>Month</Label>
          <Input type="number" min={1} max={12} className="w-20" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <div>
          <Label>Year</Label>
          <Input type="number" className="w-24" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div>
          <Label>Class</Label>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">All</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.className}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Status</Label>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        {(caps.canCreate || caps.canEdit) && (
          <Button variant="secondary" disabled={genMut.isPending} onClick={() => genMut.mutate()}>
            Generate monthly fees
          </Button>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3">Receipt</th>
                <th className="text-left p-3">Student</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Period</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!isLoading && records.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No fee records</td></tr>
              )}
              {records.map((r) => (
                <tr key={r._id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{r.receiptNumber || "—"}</td>
                  <td className="p-3">
                    <div className="font-medium">{studentName(r)}</div>
                    <p className="text-xs text-muted-foreground">{studentIdLabel(r)}</p>
                  </td>
                  <td className="p-3 capitalize">{r.feeType}</td>
                  <td className="p-3">{r.month}/{r.year}</td>
                  <td className="p-3">₨ {r.amount.toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                      r.status === "paid" ? "bg-accent/15 text-accent" : "bg-amber-500/15 text-amber-700"
                    }`}>{r.status}</span>
                  </td>
                  <td className="p-3 text-right">
                    {r.status === "pending" && (caps.canEdit || caps.canCreate) && (
                      <Button size="sm" disabled={payMut.isPending} onClick={() => payMut.mutate(r._id)}>
                        Record payment
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <span className="text-sm self-center">{page} / {pagination.pages}</span>
            <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
