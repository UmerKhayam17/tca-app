import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Copy, GripVertical, Plus, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { ModuleActionCaps } from "@/lib/permissions";
import type { Weekday } from "@/lib/configApi";
import { fetchClasses, fetchSections, fetchSubjects } from "@/lib/configApi";
import { fetchUsers } from "@/lib/usersApi";
import {
  createTimetableVersion,
  deleteScheduleSlot,
  duplicateTimetableVersion,
  fetchPeriodTemplates,
  fetchTeacherProfiles,
  fetchTimetableGrid,
  fetchTimetableVersions,
  moveScheduleSlot,
  publishTimetableVersion,
  upsertScheduleSlot,
  validateTimetableVersion,
  type PeriodSlot,
  type ScheduleSlot,
} from "@/lib/timetableApi";
import { DAY_LABELS, DAY_ORDER, normalizeWorkingDays, slotMatchesPeriod } from "./constants";
import TimetableSlotCard from "./TimetableSlotCard";

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
  const [draggingSlotId, setDraggingSlotId] = useState<string | null>(null);
  const [dropOver, setDropOver] = useState<{ day: Weekday; periodId: string } | null>(null);
  const skipClickRef = useRef(false);

  useEffect(() => {
    setClassId("");
    setSectionId("");
    setVersionId("");
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
  const publishedVersion = versions.find((v) => v.status === "published");
  const defaultVersion = draftVersion || publishedVersion;
  const activeVersionId = versionId || defaultVersion?._id || "";
  const activeVersion = versions.find((v) => v._id === activeVersionId);

  const { data: grid, isLoading } = useQuery({
    queryKey: ["timetable-grid", activeVersionId],
    queryFn: () => fetchTimetableGrid(activeVersionId),
    enabled: !!activeVersionId,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["config-subjects", classId],
    queryFn: () => fetchSubjects(classId),
    enabled: !!classId,
  });

  const { data: teacherProfiles = [] } = useQuery({
    queryKey: ["timetable-teacher-profiles", sessionId],
    queryFn: () => fetchTeacherProfiles(sessionId),
    enabled: !!sessionId,
  });

  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  const createVersionMut = useMutation({
    mutationFn: () => {
      const tpl = templates.find((t) => t.isDefault) || templates[0];
      if (!tpl) throw new Error("Create an academy time configuration in Setup first");
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
    onError: (e: Error) =>
      toast({ title: "Could not save slot", description: e.message, variant: "destructive" }),
  });

  const deleteSlotMut = useMutation({
    mutationFn: (id: string) => deleteScheduleSlot(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timetable-grid", activeVersionId] }),
  });

  const moveSlotMut = useMutation({
    mutationFn: ({ slotId, day, periodId }: { slotId: string; day: Weekday; periodId: string }) =>
      moveScheduleSlot(slotId, { day, periodId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timetable-grid", activeVersionId] });
      toast({ title: "Lesson moved" });
    },
    onError: (e: Error) =>
      toast({ title: "Could not move lesson", description: e.message, variant: "destructive" }),
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
      qc.invalidateQueries({ queryKey: ["timetable-grid", activeVersionId] });
      qc.invalidateQueries({ queryKey: ["section-schedule", sessionId, sectionId] });
      qc.invalidateQueries({ queryKey: ["my-teacher-schedule", sessionId] });
      setVersionId("");
      toast({
        title: "Timetable published",
        description: "Open Class view in the sidebar to see the live schedule.",
      });
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

  const workingDays = normalizeWorkingDays(grid?.workingDays);
  const lecturePeriods = (grid?.periods || []).filter((p) => p.type === "lecture");

  const getSlot = (day: Weekday, periodId: string) =>
    grid?.slots.find((s) => s.day === day && slotMatchesPeriod(s, periodId));

  const subjectOptions = useMemo(
    () => [...subjects].sort((a, b) => a.name.localeCompare(b.name)),
    [subjects]
  );

  const panelTeachers = useMemo(
    () =>
      users
        .filter((u) => {
          const rn = typeof u.role === "object" && u.role?.name ? u.role.name : "";
          return rn === "teacher" || rn === "admin";
        })
        .map((u) => ({ _id: u._id, name: u.name })),
    [users]
  );

  /** All teachers — same pool for every class/section (multi-section teaching). */
  const teachersForSubject = (subjectId: string) => {
    if (!subjectId) return panelTeachers;
    const seen = new Set<string>();
    const suggested: { _id: string; name: string }[] = [];
    const add = (t?: { _id: string; name: string } | null, front = false) => {
      if (!t?._id || seen.has(t._id)) return;
      seen.add(t._id);
      const entry = { _id: t._id, name: t.name };
      if (front) suggested.push(entry);
    };

    add(subjects.find((s) => s._id === subjectId)?.teacher, true);
    for (const profile of teacherProfiles) {
      if (profile.subjects?.some((s) => s._id === subjectId)) {
        add(profile.user, true);
      }
    }
    const rest = panelTeachers.filter((t) => !seen.has(t._id));
    return [...suggested, ...rest];
  };

  const defaultTeacherForSubject = (subjectId: string, existing?: ScheduleSlot) => {
    if (existing?.teacher._id) return existing.teacher._id;
    return teachersForSubject(subjectId)[0]?._id || "";
  };

  const canEditGrid = caps.canEdit && activeVersion?.status === "draft" && grid?.version.status === "draft";
  const canPublishVersion =
    caps.canEdit &&
    activeVersion &&
    (activeVersion.status === "draft" || activeVersion.status === "archived");

  const handleCellClick = (day: Weekday, period: PeriodSlot) => {
    if (skipClickRef.current) {
      skipClickRef.current = false;
      return;
    }
    openCell(day, period);
  };

  const handleDrop = (e: React.DragEvent, day: Weekday, periodId: string) => {
    e.preventDefault();
    setDropOver(null);
    if (!canEditGrid) return;
    const slotId = e.dataTransfer.getData("application/timetable-slot-id") || draggingSlotId;
    if (!slotId) return;
    skipClickRef.current = true;
    setDraggingSlotId(null);
    moveSlotMut.mutate({ slotId, day, periodId });
  };

  const openCell = (day: Weekday, period: PeriodSlot) => {
    if (!canEditGrid) return;
    const existing = getSlot(day, period._id);
    const subjectId = existing?.subject._id || "";
    setForm({
      subjectId,
      teacherId: defaultTeacherForSubject(subjectId, existing),
      roomId: existing?.room?._id || "",
    });
    setSlotDialog({ day, period, existing });
  };

  const sectionLabel = sections.find((s) => s._id === sectionId);
  const classLabel = classes.find((c) => c._id === classId);

  if (!sessionId) {
    return null;
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
        {sectionId && versions.length > 0 && (
          <div className="min-w-[180px]">
            <Label className="text-xs text-muted-foreground">Version</Label>
            <select
              className="mt-1 w-full h-10 rounded-md border px-3 text-sm"
              value={activeVersionId}
              onChange={(e) => setVersionId(e.target.value)}
            >
              {versions.map((v) => (
                <option key={v._id} value={v._id}>
                  v{v.version} · {v.status}
                </option>
              ))}
            </select>
          </div>
        )}
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
            {canPublishVersion && grid && (
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
                      const isDropTarget =
                        dropOver?.day === day && dropOver?.periodId === period._id;
                      return (
                        <td
                          key={day}
                          className={cn(
                            "p-2 align-top min-w-[100px] transition-colors",
                            canEditGrid && "hover:bg-muted/40",
                            isDropTarget && "bg-accent/15 ring-2 ring-inset ring-accent/50",
                            moveSlotMut.isPending && "pointer-events-none opacity-60"
                          )}
                          onClick={() => handleCellClick(day, period)}
                          onDragOver={(e) => {
                            if (!canEditGrid || !draggingSlotId) return;
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            setDropOver({ day, periodId: period._id });
                          }}
                          onDragLeave={() => {
                            setDropOver((prev) =>
                              prev?.day === day && prev?.periodId === period._id ? null : prev
                            );
                          }}
                          onDrop={(e) => handleDrop(e, day, period._id)}
                        >
                          {slot ? (
                            <TimetableSlotCard
                              slot={slot}
                              draggable={canEditGrid && !slot.locked}
                              isDragging={draggingSlotId === slot._id}
                              onDragStart={(e) => {
                                if (!canEditGrid || slot.locked) {
                                  e.preventDefault();
                                  return;
                                }
                                setDraggingSlotId(slot._id);
                                e.dataTransfer.setData("application/timetable-slot-id", slot._id);
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => {
                                setDraggingSlotId(null);
                                setDropOver(null);
                              }}
                            />
                          ) : (
                            <span
                              className={cn(
                                "block min-h-[52px] text-muted-foreground",
                                isDropTarget && "font-medium text-accent"
                              )}
                            >
                              {isDropTarget ? "Drop here" : "—"}
                            </span>
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
                  setForm({
                    subjectId: sub,
                    teacherId: defaultTeacherForSubject(sub),
                    roomId: "",
                  });
                }}
              >
                <option value="">Select subject</option>
                {subjectOptions.map((s) => (
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
                disabled={!form.subjectId}
              >
                <option value="">Select teacher</option>
                {teachersForSubject(form.subjectId).map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
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


