import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ModuleActionCaps } from "@/lib/permissions";
import { fetchClasses, fetchSections, fetchSubjects } from "@/lib/configApi";
import { createSubjectRequirement, deleteSubjectRequirement, fetchSubjectRequirements } from "@/lib/timetableApi";
import PanelSearchBar from "@/components/modules/PanelSearchBar";
import { usePanelListSearch } from "@/hooks/usePanelListSearch";

export default function RequirementsTab({ sessionId, caps }: { sessionId: string; caps: ModuleActionCaps }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [weekly, setWeekly] = useState(5);
  const [maxConsec, setMaxConsec] = useState(2);

  useEffect(() => {
    setClassId("");
    setSectionId("");
    setSubjectId("");
  }, [sessionId]);

  const { data: classes = [] } = useQuery({
    queryKey: ["config-classes", sessionId],
    queryFn: () => fetchClasses(sessionId),
    enabled: !!sessionId,
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["config-sections", classId, sessionId],
    queryFn: () => fetchSections({ classId, sessionId }),
    enabled: !!classId,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["config-subjects", classId],
    queryFn: () => fetchSubjects(classId),
    enabled: !!classId,
  });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["timetable-requirements", sessionId],
    queryFn: () => fetchSubjectRequirements({ sessionId }),
    enabled: !!sessionId,
  });

  const saveMut = useMutation({
    mutationFn: () =>
      createSubjectRequirement({
        session: sessionId,
        class: classId,
        section: sectionId,
        subject: subjectId,
        weeklyPeriods: weekly,
        maxConsecutive: maxConsec,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timetable-requirements", sessionId] });
      setOpen(false);
      toast({ title: "Requirement saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const delMut = useMutation({
    mutationFn: deleteSubjectRequirement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timetable-requirements", sessionId] }),
  });

  const { search, setSearch, filtered: rowsFiltered } = usePanelListSearch(rows, (r) => [
    r.section.name,
    r.subject.name,
    r.weeklyPeriods,
    r.maxConsecutive,
  ]);

  if (!sessionId) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <PanelSearchBar value={search} onChange={setSearch} placeholder="Search section, subject…" className="max-w-md" />
        {caps.canCreate && (
          <Button className="gap-2 shrink-0" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add weekly requirement
          </Button>
        )}
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left p-3">Section</th>
              <th className="text-left p-3">Subject</th>
              <th className="text-left p-3">Periods/week</th>
              <th className="text-left p-3">Max consecutive</th>
              {caps.canDelete && <th className="p-3" />}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && rowsFiltered.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{rows.length === 0 ? "No requirements yet." : "No requirements match your search."}</td></tr>
            )}
            {rowsFiltered.map((r) => (
              <tr key={r._id} className="border-b">
                <td className="p-3">{r.section.name}</td>
                <td className="p-3">{r.subject.name}</td>
                <td className="p-3">{r.weeklyPeriods}</td>
                <td className="p-3">{r.maxConsecutive}</td>
                {caps.canDelete && (
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => delMut.mutate(r._id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Subject weekly requirement</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Class</Label>
              <select className="w-full h-10 rounded-md border px-3 text-sm" value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); setSubjectId(""); }}>
                <option value="">Select class</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Section</Label>
              <select className="w-full h-10 rounded-md border px-3 text-sm" value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!classId}>
                <option value="">Select section</option>
                {sections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Subject</Label>
              <select className="w-full h-10 rounded-md border px-3 text-sm" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!classId}>
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Periods / week</Label>
                <Input type="number" min={1} value={weekly} onChange={(e) => setWeekly(Number(e.target.value))} />
              </div>
              <div>
                <Label>Max consecutive</Label>
                <Input type="number" min={1} value={maxConsec} onChange={(e) => setMaxConsec(Number(e.target.value))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!sectionId || !subjectId || saveMut.isPending} onClick={() => saveMut.mutate()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


