import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ModuleActionCaps } from "@/lib/permissions";
import {
  createAcademySubject, deleteAcademySubject, fetchAcademyClasses,
  fetchSubjectsByClass, updateAcademySubject, type AcademySubject,
} from "@/lib/studentManagementApi";

export default function SubjectsTab({ caps }: { caps: ModuleActionCaps }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [classId, setClassId] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<AcademySubject | null>(null);
  const [form, setForm] = useState({ subjectName: "", subjectCode: "", status: "active" as "active" | "inactive" });

  const { data: classes = [] } = useQuery({
    queryKey: ["academy-classes"],
    queryFn: () => fetchAcademyClasses(),
  });

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["academy-subjects", classId],
    queryFn: () => fetchSubjectsByClass(classId),
    enabled: Boolean(classId),
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (edit) return updateAcademySubject(edit._id, form);
      return createAcademySubject({ ...form, classId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy-subjects", classId] });
      qc.invalidateQueries({ queryKey: ["academy-classes"] });
      setOpen(false);
      toast({ title: edit ? "Subject updated" : "Subject added" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteAcademySubject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy-subjects", classId] });
      qc.invalidateQueries({ queryKey: ["academy-classes"] });
      toast({ title: "Subject deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1 max-w-xs">
          <Label>Select class</Label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">Choose class…</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.className}</option>
            ))}
          </select>
        </div>
        {caps.canCreate && classId && (
          <Button
            className="gap-2"
            onClick={() => {
              setEdit(null);
              setForm({ subjectName: "", subjectCode: "", status: "active" });
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add Subject
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        {!classId ? (
          <p className="p-8 text-center text-muted-foreground">Select a class to view subjects</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3">Subject</th>
                  <th className="text-left p-3">Code</th>
                  <th className="text-left p-3">Status</th>
                  {(caps.canEdit || caps.canDelete) && <th className="text-right p-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
                )}
                {!isLoading && subjects.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No subjects</td></tr>
                )}
                {subjects.map((s) => (
                  <tr key={s._id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{s.subjectName}</td>
                    <td className="p-3">{s.subjectCode}</td>
                    <td className="p-3">{s.status}</td>
                    {(caps.canEdit || caps.canDelete) && (
                      <td className="p-3 text-right">
                        {caps.canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEdit(s);
                              setForm({ subjectName: s.subjectName, subjectCode: s.subjectCode, status: s.status });
                              setOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {caps.canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { if (confirm("Delete subject?")) delMut.mutate(s._id); }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "Edit Subject" : "New Subject"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input value={form.subjectName} onChange={(e) => setForm((f) => ({ ...f, subjectName: e.target.value }))} />
            </div>
            <div>
              <Label>Code</Label>
              <Input value={form.subjectCode} onChange={(e) => setForm((f) => ({ ...f, subjectCode: e.target.value.toUpperCase() }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={saveMut.isPending || !form.subjectName || !form.subjectCode} onClick={() => saveMut.mutate()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
