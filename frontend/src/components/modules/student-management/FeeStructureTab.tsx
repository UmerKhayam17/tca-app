import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { ModuleActionCaps } from "@/lib/permissions";
import {
  createFeeStructure, fetchAcademyClasses, fetchFeeStructureByClass, updateFeeStructure,
} from "@/lib/studentManagementApi";

export default function FeeStructureTab({ caps }: { caps: ModuleActionCaps }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [classId, setClassId] = useState("");
  const [form, setForm] = useState({ perSubjectFee: "", fullPackageFee: "", admissionFee: "" });

  const { data: classes = [] } = useQuery({
    queryKey: ["academy-classes"],
    queryFn: () => fetchAcademyClasses({ status: "active" }),
  });

  const { data: structure, isLoading } = useQuery({
    queryKey: ["academy-fee-structure", classId],
    queryFn: () => fetchFeeStructureByClass(classId),
    enabled: Boolean(classId),
  });

  useEffect(() => {
    if (structure) {
      setForm({
        perSubjectFee: String(structure.perSubjectFee),
        fullPackageFee: String(structure.fullPackageFee),
        admissionFee: String(structure.admissionFee),
      });
    } else {
      setForm({ perSubjectFee: "", fullPackageFee: "", admissionFee: "" });
    }
  }, [structure, classId]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = {
        perSubjectFee: Number(form.perSubjectFee),
        fullPackageFee: Number(form.fullPackageFee),
        admissionFee: Number(form.admissionFee),
      };
      if (structure?._id) return updateFeeStructure(structure._id, body);
      return createFeeStructure({ classId, ...body });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy-fee-structure", classId] });
      toast({ title: "Fee structure saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const canSave = caps.canCreate || caps.canEdit;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4 max-w-xl">
      <div>
        <Label>Class</Label>
        <select
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
        >
          <option value="">Select class…</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>{c.className}</option>
          ))}
        </select>
      </div>

      {classId && (
        <Card className="p-6 space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {structure ? "Update active fee structure for this class." : "No fee structure yet — configure below."}
              </p>
              <div>
                <Label>Per subject fee (₨)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.perSubjectFee}
                  onChange={(e) => setForm((f) => ({ ...f, perSubjectFee: e.target.value }))}
                  disabled={!canSave}
                />
              </div>
              <div>
                <Label>Full package fee (₨)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.fullPackageFee}
                  onChange={(e) => setForm((f) => ({ ...f, fullPackageFee: e.target.value }))}
                  disabled={!canSave}
                />
              </div>
              <div>
                <Label>Admission fee (₨)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.admissionFee}
                  onChange={(e) => setForm((f) => ({ ...f, admissionFee: e.target.value }))}
                  disabled={!canSave}
                />
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1">
                <p className="font-medium text-primary">Example (3 subjects)</p>
                <p>Monthly = 3 × per subject fee</p>
                <p>First payment = monthly + admission fee</p>
              </div>
              {canSave && (
                <Button
                  disabled={saveMut.isPending || !form.perSubjectFee || !form.fullPackageFee || !form.admissionFee}
                  onClick={() => saveMut.mutate()}
                >
                  {saveMut.isPending ? "Saving…" : structure ? "Update structure" : "Create structure"}
                </Button>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}
