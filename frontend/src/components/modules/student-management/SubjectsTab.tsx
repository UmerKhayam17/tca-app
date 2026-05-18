import { useState } from "react";
import { Link } from "react-router-dom";
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
import { useAuth } from "@/hooks/useAuth";
import type { ModuleActionCaps } from "@/lib/permissions";
import { studentManagementHref } from "@/lib/studentManagementMenus";
import {
  createAcademySubject, deleteAcademySubject, fetchAcademyClasses,
  fetchSubjectsByClass, updateAcademySubject, type AcademySubject,
} from "@/lib/studentManagementApi";

export default function SubjectsTab({ caps }: { caps: ModuleActionCaps }) {
  const { toast } = useToast();
  const { user: session } = useAuth();
  const qc = useQueryClient();
  const [classId, setClassId] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<AcademySubject | null>(null);
  const [form, setForm] = useState({ subjectName: "", subjectCode: "", status: "active" as "active" | "inactive" });

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["academy-classes"],
    queryFn: () => fetchAcademyClasses(),
  });

  const selectedClass = classes.find((c) => c._id === classId);

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ["academy-subjects", classId],
    queryFn: () => fetchSubjectsByClass(classId),
    enabled: Boolean(classId),
  });

  const openCreate = () => {
    if (!classId) {
      toast({ title: "Select a class first", description: "Choose a class before adding a subject.", variant: "destructive" });
      return;
    }
    setEdit(null);
    setForm({ subjectName: "", subjectCode: "", status: "active" });
    setOpen(true);
  };

  const openEditSubject = (s: AcademySubject) => {
    setEdit(s);
    setForm({ subjectName: s.subjectName, subjectCode: s.subjectCode, status: s.status });
    setOpen(true);
  };

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

  const classesHref = session?.role ? studentManagementHref(session.role, "classes") : "#";

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="max-w-sm space-y-1">
          <Label htmlFor="subject-class-select">Select class</Label>
          <select
            id="subject-class-select"
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            disabled={classesLoading}
          >
            <option value="">Choose class…</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.className}</option>
            ))}
          </select>
          {!classesLoading && classes.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No classes yet.{" "}
              {caps.canCreate ? (
                <Link to={classesHref} className="text-primary underline-offset-2 hover:underline">
                  Add a class first
                </Link>
              ) : (
                "Ask an administrator to create classes."
              )}
            </p>
          )}
      </div>

      <Card className="overflow-hidden">
        {classId && selectedClass && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b bg-muted/30">
            <p className="text-sm">
              Subjects for <span className="font-semibold">{selectedClass.className}</span>
            </p>
            {caps.canCreate && (
              <Button className="gap-2 shrink-0 self-start sm:self-auto" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Add Subject
              </Button>
            )}
          </div>
        )}

        {!classId ? (
          <p className="p-8 text-center text-muted-foreground">
            Select a class above to view and add subjects.
          </p>
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
                {subjectsLoading && (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
                )}
                {!subjectsLoading && subjects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No subjects for this class yet.
                    </td>
                  </tr>
                )}
                {subjects.map((s) => (
                  <tr key={s._id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{s.subjectName}</td>
                    <td className="p-3">{s.subjectCode}</td>
                    <td className="p-3">{s.status}</td>
                    {(caps.canEdit || caps.canDelete) && (
                      <td className="p-3 text-right">
                        {caps.canEdit && (
                          <Button variant="ghost" size="icon" onClick={() => openEditSubject(s)} aria-label="Edit subject">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {caps.canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { if (confirm("Delete subject?")) delMut.mutate(s._id); }}
                            aria-label="Delete subject"
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
          <DialogHeader>
            <DialogTitle>{edit ? "Edit Subject" : "New Subject"}</DialogTitle>
            {selectedClass && !edit && (
              <p className="text-sm text-muted-foreground">
                Adding to class: <span className="font-medium text-foreground">{selectedClass.className}</span>
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="subject-name">Subject name</Label>
              <Input
                id="subject-name"
                value={form.subjectName}
                onChange={(e) => setForm((f) => ({ ...f, subjectName: e.target.value }))}
                placeholder="e.g. Mathematics"
              />
            </div>
            <div>
              <Label htmlFor="subject-code">Subject code</Label>
              <Input
                id="subject-code"
                value={form.subjectCode}
                onChange={(e) => setForm((f) => ({ ...f, subjectCode: e.target.value.toUpperCase() }))}
                placeholder="e.g. MATH-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={saveMut.isPending || !form.subjectName.trim() || !form.subjectCode.trim()}
              onClick={() => saveMut.mutate()}
            >
              {saveMut.isPending ? "Saving…" : edit ? "Save changes" : "Add subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
