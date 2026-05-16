import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Copy, Plus, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ModuleActionCaps } from "@/lib/permissions";
import type { Weekday } from "@/lib/configApi";
import { fetchClasses, fetchSections } from "@/lib/configApi";
import {
  createTimetableVersion,
  deleteScheduleSlot,
  duplicateTimetableVersion,
  fetchPeriodTemplates,
  fetchTeacherAssignments,
  fetchTimetableGrid,
  fetchTimetableVersions,
  publishTimetableVersion,
  upsertScheduleSlot,
  validateTimetableVersion,
  type PeriodSlot,
  type ScheduleSlot,
} from "@/lib/timetableApi";
import { DAY_LABELS, DAY_ORDER, subjectColor } from "./constants";

export default function GridTab({
  sessionId,
  caps,
}: {
  sessionId: string;
  caps: ModuleActionCaps;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [versionId, setVersionId] = useState("");
  const [slotDialog, setSlotDialog] = useState<{
    day: Weekday;
    period: PeriodSlot;
    existing?: ScheduleSlot;
  } | null>(null);
  const [form, setForm] = useState({ subjectId: "", teacherId: "", roomId: "" });

  const { data: classes = [] } = useQuery({
    queryKey: ["config-classes", sessionId],
    queryFn: () => fetchClasses(sessionId),
    enabled: !!sessionId,
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["config-sections", classId],
    queryFn: () => fetchSections({ classId }),
    enabled: !!classId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["timetable-periods", sessionId],
    queryFn: () => fetchPeriodTemplates(sessionId),
    enabled: !!sessionId,
  });

  const { data: versions = [] } = useQuery({
    queryKey: ["timetable-versions", sessionId, sectionId],
    queryFn: () => fetchTimetableVersions({ sessionId, sectionId }),
    enabled: !!sessionId && !!sectionId,
  });

  const draftVersion = versions.find((v) => v.status === "draft");
  const activeVersionId = versionId || draftVersion?._id || "";

  const { data: grid, isLoading } = useQuery({
    queryKey: ["timetable-grid", activeVersionId],
    queryFn: () => fetchTimetableGrid(activeVersionId),
    enabled: !!activeVersionId,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["timetable-assignments", sessionId, sectionId],
    queryFn: () => fetchTeacherAssignments({ sessionId, sectionId }),
    enabled: !!sessionId && !!sectionId,
  });

  const createVersionMut = useMutation({
    mutationFn: () => {
      const tpl = templates.find((t) => t.isDefault) || templates[0];
      if (!tpl) throw new Error("Create a period template in Setup first");
      return createTimetableVersion({
        session: sessionId,
        class: classId,
        section: sectionId,
        periodTemplate: tpl._id,
      });
    },
    onSuccess: (v) => {
      setVersionId(v._id);
      qc.invalidateQueries({ queryKey: ["timetable-versions", sessionId, sectionId] });
      toast({ title: "Draft timetable created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveSlotMut = useMutation({
    mutationFn: () => {
      if (!slotDialog || !activeVersionId) throw new Error("No slot selected");
      return upsertScheduleSlot(activeVersionId, {
        day: slotDialog.day,
        periodId: slotDialog.period._id,
        subject: form.subjectId,
        teacher: form.teacherId,
        room: form.roomId || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timetable-grid", activeVersionId] });
      setSlotDialog(null);
      toast({ title: "Slot saved" });
    },
    onError: (e: Error) => toast({ title: "Conflict", description: e.message, variant: "destructive" }),
  });

  const deleteSlotMut = useMutation({
    mutationFn: (id: string) => deleteScheduleSlot(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timetable-grid", activeVersionId] }),
  });

  const validateMut = useMutation({
    mutationFn: () => validateTimetableVersion(activeVersionId, false),
    onSuccess: (r) => {
      if (r.valid) toast({ title: "Validation passed", description: `${r.warnings.length} warnings` });
      else toast({ title: "Validation failed", description: `${r.errors.length} errors`, variant: "destructive" });
    },
  });

  const publishMut = useMutation({
    mutationFn: () => publishTimetableVersion(activeVersionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timetable-versions", sessionId, sectionId] });
      toast({ title: "Timetable published" });
    },
    onError: (e: Error) => toast({ title: "Cannot publish", description: e.message, variant: "destructive" }),
  });

  const duplicateMut = useMutation({
    mutationFn: () => duplicateTimetableVersion(activeVersionId),
    onSuccess: (v) => {
      setVersionId(v._id);
      qc.invalidateQueries({ queryKey: ["timetable-versions", sessionId, sectionId] });
      toast({ title: "Draft duplicated" });
    },
  });

  const workingDays = (grid?.workingDays?.length ? grid.workingDays : DAY_ORDER.slice(0, 5)) as Weekday[];
  const lecturePeriods = (grid?.periods || []).filter((p) => p.type === "lecture");

  const getSlot = (day: Weekday, periodId: string) =>
    grid?.slots.find((s) => s.day === day && s.periodId === periodId);

  const openCell = (day: Weekday, period: PeriodSlot) => {
    if (!caps.canEdit || grid?.version.status !== "draft") return;
    const existing = getSlot(day, period._id);
    const assign = assignments.find((a) => a.subject._id === existing?.subject._id);
    setForm({
      subjectId: existing?.subject._id || "",
      teacherId: existing?.teacher._id || assign?.teacher._id || "",
      roomId: existing?.room?._id || "",
    });
    setSlotDialog({ day, period, existing });
  };

  const sectionLabel = sections.find((s) => s._id === sectionId);
  const classLabel = classes.find((c) => c._id === classId);

  if (!sessionId) {
    return <p className="p-6 text-muted-foreground text-sm">Select a session above.</p>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="min-w-[140px]">
          <Label className="text-xs text-muted-foreground">Class</Label>
          <select
            className="mt-1 w-full h-10 rounded-md border px-3 text-sm"
            value={classId}
            onChange={(e) => { setClassId(e.target.value); setSectionId(""); setVersionId(""); }}
          >
            <option value="">Select class</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div className="min-w-[120px]">
          <Label className="text-xs text-muted-foreground">Section</Label>
          <select
            className="mt-1 w-full h-10 rounded-md border px-3 text-sm"
            value={sectionId}
            onChange={(e) => { setSectionId(e.target.value); setVersionId(""); }}
            disabled={!classId}
          >
            <option value="">Select section</option>
            {sections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        {sectionId && caps.canCreate && !draftVersion && (
          <Button className="gap-2" onClick={() => createVersionMut.mutate()} disabled={createVersionMut.isPending}>
            <Plus className="h-4 w-4" /> New draft
          </Button>
        )}
        {activeVersionId && caps.canEdit && (
          <>
            <Button variant="outline" className="gap-2" onClick={() => validateMut.mutate()}>
              <AlertCircle className="h-4 w-4" /> Validate
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => duplicateMut.mutate()}>
              <Copy className="h-4 w-4" /> Duplicate
            </Button>
            {grid?.version.status === "draft" && (
              <Button className="gap-2" onClick={() => publishMut.mutate()} disabled={publishMut.isPending}>
                <Send className="h-4 w-4" /> Publish
              </Button>
            )}
          </>
        )}
      </div>

      {sectionId && grid && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-primary">
              {classLabel?.name} — {sectionLabel?.name}
            </h2>
            <Badge variant={grid.version.status === "published" ? "default" : "secondary"}>
              v{grid.version.version} · {grid.version.status}
            </Badge>
            {grid.quotaProgress.map((q) => (
              <Badge
                key={q.subject._id}
                variant="outline"
                className={q.complete ? "border-emerald-400 text-emerald-700" : "border-amber-400 text-amber-700"}
              >
                {q.subject.name}: {q.actual}/{q.required}
              </Badge>
            ))}
          </div>

          <Card className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 w-28">Time</th>
                  {workingDays.map((d) => (
                    <th key={d} className="text-left p-3">{DAY_LABELS[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lecturePeriods.map((period) => (
                  <tr key={period._id} className="border-t">
                    <td className="p-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {period.startTime}
                      <br />
                      {period.endTime}
                    </td>
                    {workingDays.map((day) => {
                      const slot = getSlot(day, period._id);
                      return (
                        <td
                          key={day}
                          className={`p-2 align-top min-w-[100px] ${caps.canEdit && grid.version.status === "draft" ? "cursor-pointer hover:bg-muted/40" : ""}`}
                          onClick={() => openCell(day, period)}
                        >
                          {slot ? (
                            <div className={`rounded-md border p-2 ${subjectColor(slot.subject._id)}`}>
                              <div className="font-semibold text-sm">{slot.subject.name}</div>
                              <div className="text-xs opacity-80">{slot.teacher.name}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {sectionId && !activeVersionId && !isLoading && (
        <p className="text-sm text-muted-foreground">No timetable for this section. Create a draft to start.</p>
      )}

      <Dialog open={!!slotDialog} onOpenChange={(o) => !o && setSlotDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {slotDialog ? `${DAY_LABELS[slotDialog.day]} · ${slotDialog.period.label}` : "Edit slot"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Subject</Label>
              <select
                className="w-full h-10 rounded-md border px-3 text-sm"
                value={form.subjectId}
                onChange={(e) => {
                  const sub = e.target.value;
                  const a = assignments.find((x) => x.subject._id === sub);
                  setForm({ subjectId: sub, teacherId: a?.teacher._id || "", roomId: "" });
                }}
              >
                <option value="">Select subject</option>
                {[...new Map(assignments.map((a) => [a.subject._id, a.subject])).values()].map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Teacher</Label>
              <select
                className="w-full h-10 rounded-md border px-3 text-sm"
                value={form.teacherId}
                onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
              >
                <option value="">Select teacher</option>
                {assignments
                  .filter((a) => a.subject._id === form.subjectId)
                  .map((a) => (
                    <option key={a.teacher._id} value={a.teacher._id}>{a.teacher.name}</option>
                  ))}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {slotDialog?.existing && (
              <Button
                variant="destructive"
                onClick={() => {
                  deleteSlotMut.mutate(slotDialog.existing!._id);
                  setSlotDialog(null);
                }}
              >
                Clear
              </Button>
            )}
            <Button variant="outline" onClick={() => setSlotDialog(null)}>Cancel</Button>
            <Button disabled={!form.subjectId || !form.teacherId || saveSlotMut.isPending} onClick={() => saveSlotMut.mutate()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


