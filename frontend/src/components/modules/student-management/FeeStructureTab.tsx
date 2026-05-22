import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ModuleActionCaps } from "@/lib/permissions";
import {
  createFeeStructure,
  fetchAcademyClasses,
  fetchAllFeeStructures,
  updateFeeStructure,
  type AcademyClass,
  type AcademyFeeStructure,
} from "@/lib/studentManagementApi";
import PanelSearchBar from "@/components/modules/PanelSearchBar";
import { matchesPanelSearch } from "@/lib/panelSearch";

const FEE_STRUCTURES_KEY = ["academy-fee-structures"] as const;

const emptyModalForm = () => ({
  classId: "",
  perSubjectFee: "",
  fullPackageFee: "",
  admissionFee: "",
});

function classLabel(classId: AcademyFeeStructure["classId"]): string {
  if (!classId) return "—";
  if (typeof classId === "string") return classId;
  return classId.className || "—";
}

function formatFee(n: number) {
  return `₨ ${n.toLocaleString()}`;
}

function resolveClassId(classId: AcademyFeeStructure["classId"]): string {
  if (!classId) return "";
  return typeof classId === "string" ? classId : classId._id || "";
}

export default function FeeStructureTab({ caps }: { caps: ModuleActionCaps }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<AcademyFeeStructure | null>(null);
  const [modalForm, setModalForm] = useState(emptyModalForm);
  const [search, setSearch] = useState("");

  const { data: classes = [] } = useQuery({
    queryKey: ["academy-classes"],
    queryFn: () => fetchAcademyClasses({ status: "active" }),
  });

  const { data: allStructures = [], isLoading: listLoading } = useQuery({
    queryKey: FEE_STRUCTURES_KEY,
    queryFn: () => fetchAllFeeStructures(),
  });

  const structuresFiltered = useMemo(() => {
    if (!search.trim()) return allStructures;
    return allStructures.filter((row) =>
      matchesPanelSearch(
        search,
        classLabel(row.classId),
        row.perSubjectFee,
        row.fullPackageFee,
        row.admissionFee,
        row.status
      )
    );
  }, [allStructures, search]);

  const openCreate = () => {
    setEditRow(null);
    setModalForm(emptyModalForm());
    setOpen(true);
  };

  const openEdit = (row: AcademyFeeStructure) => {
    setEditRow(row);
    setModalForm({
      classId: resolveClassId(row.classId),
      perSubjectFee: String(row.perSubjectFee),
      fullPackageFee: String(row.fullPackageFee),
      admissionFee: String(row.admissionFee),
    });
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = {
        perSubjectFee: Number(modalForm.perSubjectFee),
        fullPackageFee: Number(modalForm.fullPackageFee),
        admissionFee: Number(modalForm.admissionFee),
      };
      if (editRow?._id) return updateFeeStructure(editRow._id, body);
      return createFeeStructure({ classId: modalForm.classId, ...body });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FEE_STRUCTURES_KEY });
      setOpen(false);
      setEditRow(null);
      toast({ title: editRow ? "Fee structure updated" : "Fee structure created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const canSave = caps.canCreate || caps.canEdit;
  const selectedClass = classes.find((c) => c._id === modalForm.classId);
  const isEdit = Boolean(editRow);

  const formValid =
    modalForm.perSubjectFee !== ""
    && modalForm.fullPackageFee !== ""
    && modalForm.admissionFee !== ""
    && (isEdit || Boolean(modalForm.classId));

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b bg-muted/30">
          <h3 className="font-medium text-sm">All fee structures</h3>
          <div className="flex flex-wrap items-center gap-2">
            <PanelSearchBar value={search} onChange={setSearch} placeholder="Search class or fees…" className="max-w-xs" />
            {caps.canCreate && (
              <Button className="gap-2 shrink-0" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Create fee structure
              </Button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Class</th>
                <th className="text-left p-3 font-medium">Per subject</th>
                <th className="text-left p-3 font-medium">Full package</th>
                <th className="text-left p-3 font-medium">Admission</th>
                <th className="text-left p-3 font-medium">Status</th>
                {canSave && <th className="text-right p-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {listLoading && (
                <tr>
                  <td colSpan={canSave ? 6 : 5} className="p-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!listLoading && allStructures.length === 0 && (
                <tr>
                  <td colSpan={canSave ? 6 : 5} className="p-8 text-center text-muted-foreground">
                    No fee structures yet.
                    {caps.canCreate && " Click Create fee structure to add one."}
                  </td>
                </tr>
              )}
              {!listLoading && allStructures.length > 0 && structuresFiltered.length === 0 && (
                <tr>
                  <td colSpan={canSave ? 6 : 5} className="p-8 text-center text-muted-foreground">
                    No fee structures match your search.
                  </td>
                </tr>
              )}
              {structuresFiltered.map((row) => (
                <tr key={row._id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{classLabel(row.classId)}</td>
                  <td className="p-3">{formatFee(row.perSubjectFee)}</td>
                  <td className="p-3">{formatFee(row.fullPackageFee)}</td>
                  <td className="p-3">{formatFee(row.admissionFee)}</td>
                  <td className="p-3">
                    <span
                      className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                        row.status === "active"
                          ? "bg-accent/15 text-accent"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  {canSave && (
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit fee structure"
                        onClick={() => openEdit(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditRow(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit fee structure" : "Create fee structure"}</DialogTitle>
            {selectedClass && (
              <p className="text-sm text-muted-foreground">
                {isEdit ? "Class: " : "For class: "}
                <span className="font-medium text-foreground">{selectedClass.className}</span>
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!isEdit && (
              <div>
                <Label htmlFor="fee-modal-class">Class</Label>
                <select
                  id="fee-modal-class"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1"
                  value={modalForm.classId}
                  onChange={(e) => setModalForm((f) => ({ ...f, classId: e.target.value }))}
                >
                  <option value="">Select class…</option>
                  {classes.map((c: AcademyClass) => (
                    <option key={c._id} value={c._id}>{c.className}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label htmlFor="fee-per-subject">Per subject fee (₨)</Label>
              <Input
                id="fee-per-subject"
                type="number"
                min={0}
                value={modalForm.perSubjectFee}
                onChange={(e) => setModalForm((f) => ({ ...f, perSubjectFee: e.target.value }))}
                disabled={!canSave}
              />
            </div>
            <div>
              <Label htmlFor="fee-full-package">Full package fee (₨)</Label>
              <Input
                id="fee-full-package"
                type="number"
                min={0}
                value={modalForm.fullPackageFee}
                onChange={(e) => setModalForm((f) => ({ ...f, fullPackageFee: e.target.value }))}
                disabled={!canSave}
              />
            </div>
            <div>
              <Label htmlFor="fee-admission">Admission fee (₨)</Label>
              <Input
                id="fee-admission"
                type="number"
                min={0}
                value={modalForm.admissionFee}
                onChange={(e) => setModalForm((f) => ({ ...f, admissionFee: e.target.value }))}
                disabled={!canSave}
              />
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <p className="font-medium text-primary">Example (3 subjects)</p>
              <p>Monthly = 3 × per subject fee</p>
              <p>First payment = monthly + admission fee</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            {canSave && (
              <Button disabled={saveMut.isPending || !formValid} onClick={() => saveMut.mutate()}>
                {saveMut.isPending ? "Saving…" : isEdit ? "Save changes" : "Create"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
