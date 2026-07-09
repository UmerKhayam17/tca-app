import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ModuleActionCaps } from "@/lib/permissions";
import {
  createAcademySection,
  deleteAcademySection,
  fetchAcademyClasses,
  fetchSectionsByClass,
  fetchSubjectsByClass,
  updateAcademySection,
  type AcademySection,
} from "@/lib/studentManagementApi";
import PanelSearchBar from "@/components/modules/PanelSearchBar";
import { matchesPanelSearch } from "@/lib/panelSearch";

export default function SectionsTab({ caps, sessionId }: { caps: ModuleActionCaps; sessionId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [classId, setClassId] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<AcademySection | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    sectionName: "",
    useClassSubjects: true,
    subjectIds: [] as string[],
    status: "active" as "active" | "inactive",
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["academy-classes", sessionId],
    queryFn: () => fetchAcademyClasses({ status: "active", sessionId }),
    enabled: Boolean(sessionId),
  });
  const selectedClass = classes.find((c) => c._id === classId);

  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ["academy-sections", classId],
    queryFn: () => fetchSectionsByClass(classId),
    enabled: Boolean(classId),
  });

  const { data: classSubjects = [] } = useQuery({
    queryKey: ["academy-subjects", classId],
    queryFn: () => fetchSubjectsByClass(classId, { status: "active" }),
    enabled: Boolean(classId),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return sections;
    return sections.filter((s) =>
      matchesPanelSearch(
        search,
        s.sectionName,
        s.status,
        s.useClassSubjects ? "class subjects" : "custom subjects",
        ...(s.subjectIds || []).map((sub) => (typeof sub === "string" ? sub : `${sub.subjectName} ${sub.subjectCode}`))
      )
    );
  }, [sections, search]);

  const openCreate = () => {
    if (!classId) {
      toast({ title: "Select a class first", variant: "destructive" });
      return;
    }
    setEdit(null);
    setForm({ sectionName: "", useClassSubjects: true, subjectIds: [], status: "active" });
    setOpen(true);
  };

  const openEdit = (section: AcademySection) => {
    setEdit(section);
    setForm({
      sectionName: section.sectionName,
      useClassSubjects: section.useClassSubjects,
      subjectIds: (section.subjectIds || []).map((s) => (typeof s === "string" ? s : s._id)),
      status: section.status,
    });
    setOpen(true);
  };

  const toggleSubject = (subjectId: string) => {
    setForm((f) => ({
      ...f,
      subjectIds: f.subjectIds.includes(subjectId)
        ? f.subjectIds.filter((id) => id !== subjectId)
        : [...f.subjectIds, subjectId],
    }));
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        sectionName: form.sectionName.trim(),
        classId,
        useClassSubjects: form.useClassSubjects,
        subjectIds: form.useClassSubjects ? [] : form.subjectIds,
        status: form.status,
      };
      if (edit) return updateAcademySection(edit._id, payload);
      return createAcademySection(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy-sections", classId] });
      setOpen(false);
      toast({ title: edit ? "Section updated" : "Section created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteAcademySection(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy-sections", classId] });
      toast({ title: "Section deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const hasActions = caps.canEdit || caps.canDelete;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="max-w-sm space-y-1">
        <Label>Select class</Label>
        <select
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          disabled={!sessionId || classes.length === 0}
        >
          <option value="">Choose class…</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>{c.className}</option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden">
        {classId && selectedClass && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b bg-muted/30">
            <p className="text-sm">
              Sections for <span className="font-semibold">{selectedClass.className}</span>
            </p>
            <div className="flex items-center gap-2">
              <PanelSearchBar value={search} onChange={setSearch} placeholder="Search sections…" className="max-w-xs" />
              {caps.canCreate && (
                <Button className="gap-2 shrink-0" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> Add Section
                </Button>
              )}
            </div>
          </div>
        )}

        {!classId ? (
          <div className="min-h-[8rem]" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3">Section</th>
                  <th className="text-left p-3">Subject source</th>
                  <th className="text-left p-3">Status</th>
                  {hasActions && <th className="text-right p-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {sectionsLoading && (
                  <tr><td colSpan={hasActions ? 4 : 3} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
                )}
                {!sectionsLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={hasActions ? 4 : 3} className="p-8 text-center text-muted-foreground">
                      {sections.length === 0 ? "No sections for this class yet." : "No sections match your search."}
                    </td>
                  </tr>
                )}
                {filtered.map((s) => (
                  <tr key={s._id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{s.sectionName}</td>
                    <td className="p-3">
                      {s.useClassSubjects ? "Default class subjects" : `${s.subjectIds?.length || 0} custom subject(s)`}
                    </td>
                    <td className="p-3">{s.status}</td>
                    {hasActions && (
                      <td className="p-3 text-right">
                        {caps.canEdit && (
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {caps.canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Delete section "${s.sectionName}"?`)) delMut.mutate(s._id);
                            }}
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
            <DialogTitle>{edit ? "Edit section" : "New section"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Section name</Label>
              <Input
                value={form.sectionName}
                onChange={(e) => setForm((f) => ({ ...f, sectionName: e.target.value }))}
                placeholder="e.g. A"
              />
            </div>
            <label className="flex items-center gap-3">
              <Checkbox
                checked={form.useClassSubjects}
                onCheckedChange={(v) => setForm((f) => ({ ...f, useClassSubjects: Boolean(v), subjectIds: [] }))}
              />
              <span className="text-sm">Use class default subjects</span>
            </label>

            {!form.useClassSubjects && (
              <div className="space-y-2">
                <Label>Custom subjects for this section</Label>
                <div className="max-h-40 overflow-auto border rounded-md p-2 space-y-2">
                  {classSubjects.map((sub) => (
                    <label key={sub._id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.subjectIds.includes(sub._id)}
                        onCheckedChange={() => toggleSubject(sub._id)}
                      />
                      <span>{sub.subjectName} ({sub.subjectCode})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={
                saveMut.isPending
                || !form.sectionName.trim()
                || (!form.useClassSubjects && form.subjectIds.length === 0)
              }
              onClick={() => saveMut.mutate()}
            >
              {saveMut.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
