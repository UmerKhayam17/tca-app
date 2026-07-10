import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarClock, ChevronRight, ClipboardList, Plus, Repeat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { ModuleActionCaps } from "@/lib/permissions";
import { classTestMarksHref, classTestSeriesHref } from "@/lib/testExamsMenus";
import PanelToolbar from "@/components/modules/PanelToolbar";
import { matchesPanelSearch } from "@/lib/panelSearch";
import {
  ASSESSMENT_TYPE_LABELS,
  createClassTest,
  fetchAcademyClasses,
  fetchClassTests,
  fetchSubjectsByClass,
  formatClassTestSchedule,
  type AcademyClass,
  type AcademyClassTest,
  type AcademySubject,
  type AssessmentType,
  type ClassTestRecurrence,
} from "@/lib/studentManagementApi";

const TYPES = Object.keys(ASSESSMENT_TYPE_LABELS) as AssessmentType[];

const RECURRENCE_OPTIONS: { value: ClassTestRecurrence; label: string; hint: string }[] = [
  { value: "once", label: "One time", hint: "Single test on the chosen date" },
  { value: "daily", label: "Daily series", hint: "Auto-schedule each day from start date" },
  { value: "weekly", label: "Weekly series", hint: "Same test every week (e.g. weekly test)" },
  { value: "monthly", label: "Monthly series", hint: "Same test every month" },
];

const DEFAULT_SERIES_COUNT: Record<ClassTestRecurrence, number> = {
  once: 1,
  daily: 7,
  weekly: 12,
  monthly: 6,
};

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function emptyForm() {
  return {
    classId: "",
    subjectId: "",
    title: "",
    assessmentType: "quiz" as AssessmentType,
    examDate: tomorrowISO(),
    testTime: "09:00",
    totalMarks: "20",
    recurrence: "once" as ClassTestRecurrence,
    seriesCount: "12",
  };
}

function classNameOf(test: AcademyClassTest) {
  const c = test.classId;
  return typeof c === "object" && c ? c.className : "—";
}

function subjectNameOf(test: AcademyClassTest) {
  const s = test.subjectId;
  return typeof s === "object" && s ? s.subjectName : "—";
}

function recurrenceBadge(test: AcademyClassTest) {
  if (!test.recurrence || test.recurrence === "once") return null;
  const labels: Record<ClassTestRecurrence, string> = {
    once: "",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
  };
  return labels[test.recurrence];
}

export default function ClassTestsPanel({ caps }: { caps: ModuleActionCaps }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const canManage = caps.canCreate;
  const role = user?.role;

  const [classFilter, setClassFilter] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: classes = [] } = useQuery({
    queryKey: ["academy-classes"],
    queryFn: () => fetchAcademyClasses({ status: "active" }),
  });

  const { data: createSubjects = [] } = useQuery({
    queryKey: ["class-subjects", form.classId],
    queryFn: () => fetchSubjectsByClass(form.classId, { status: "active" }),
    enabled: !!form.classId && createOpen,
  });

  const { data: tests = [], isLoading: testsLoading } = useQuery({
    queryKey: ["class-tests", classFilter],
    queryFn: () => fetchClassTests(classFilter || undefined),
  });

  const createMut = useMutation({
    mutationFn: createClassTest,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["class-tests"] });
      setCreateOpen(false);
      const count = data.createdCount;
      toast({
        title: count > 1 ? `${count} tests scheduled` : "Test scheduled",
        description:
          count > 1 && data.seriesId
            ? "Series created. Open the schedule to enter marks per date."
            : "Opening marks entry…",
      });
      if (!role) return;
      if (count > 1 && data.seriesId) {
        navigate(classTestSeriesHref(role, data.seriesId));
      } else if (data.test?._id) {
        navigate(classTestMarksHref(role, data.test._id));
      }
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setForm(emptyForm());
    setCreateOpen(true);
  };

  const handleCreate = () => {
    if (!form.classId || !form.subjectId || !form.title.trim()) {
      toast({ title: "Enter class, subject, and test name", variant: "destructive" });
      return;
    }
    const payload: Parameters<typeof createClassTest>[0] = {
      classId: form.classId,
      subjectId: form.subjectId,
      title: form.title.trim(),
      assessmentType: form.assessmentType,
      examDate: form.examDate,
      testTime: form.testTime,
      totalMarks: Number(form.totalMarks) || 20,
      recurrence: form.recurrence,
    };
    if (form.recurrence !== "once") {
      payload.seriesCount = Math.min(52, Math.max(2, Number(form.seriesCount) || DEFAULT_SERIES_COUNT[form.recurrence]));
    }
    createMut.mutate(payload);
  };

  const testsFiltered = useMemo(() => {
    if (!search.trim()) return tests;
    return tests.filter((t) =>
      matchesPanelSearch(
        search,
        t.title,
        t.seriesLabel,
        classNameOf(t),
        subjectNameOf(t),
        ASSESSMENT_TYPE_LABELS[t.assessmentType as AssessmentType],
        t.examDate,
        t.testTime,
        recurrenceBadge(t)
      )
    );
  }, [tests, search]);

  const listGroups = useMemo(() => {
    const map = new Map<string, AcademyClassTest[]>();
    for (const t of testsFiltered) {
      const key = t.seriesId && t.recurrence && t.recurrence !== "once" ? String(t.seriesId) : t._id;
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return [...map.entries()].map(([key, items]) => {
      const sorted = [...items].sort((a, b) => (a.occurrenceIndex ?? 1) - (b.occurrenceIndex ?? 1));
      const first = sorted[0];
      const isSeries = Boolean(
        first.seriesId && first.recurrence && first.recurrence !== "once" && sorted.length > 0
      );
      const last = sorted[sorted.length - 1];
      return {
        key,
        seriesId: first.seriesId,
        label: first.seriesLabel || first.title,
        recurrence: first.recurrence,
        tests: sorted,
        isSeries,
        first,
        last,
        count: sorted.length,
      };
    });
  }, [testsFiltered]);

  const openGroup = (group: (typeof listGroups)[number]) => {
    if (!role) return;
    if (group.isSeries && group.seriesId) {
      navigate(classTestSeriesHref(role, group.seriesId));
    } else if (group.first) {
      navigate(classTestMarksHref(role, group.first._id));
    }
  };

  const isSeries = form.recurrence !== "once";

  return (
    <div className="space-y-4">
      <PanelToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search test name, class, date…">
        <div className="space-y-1">
          <Label className="text-xs sr-only">Class</Label>
          <Select value={classFilter || "_all"} onValueChange={(v) => setClassFilter(v === "_all" ? "" : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canManage && (
          <Button variant="hero" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Schedule test
          </Button>
        )}
      </PanelToolbar>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b font-semibold text-sm text-primary bg-secondary/30 flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Scheduled tests — one card per series; click to see full schedule
        </div>
        {testsLoading && <p className="p-6 text-sm text-muted-foreground">Loading…</p>}
        {!testsLoading && tests.length === 0 && (
          <p className="p-8 text-sm text-center text-muted-foreground">
            No tests yet. Schedule a test with name, date, and time — use a weekly or monthly series for repeating tests.
          </p>
        )}
        {!testsLoading && tests.length > 0 && testsFiltered.length === 0 && (
          <p className="p-8 text-sm text-center text-muted-foreground">No tests match your search.</p>
        )}
        <ul className="divide-y">
          {listGroups.map((group) => (
            <li key={group.key}>
              <button
                type="button"
                onClick={() => openGroup(group)}
                className="w-full text-left px-4 py-4 flex items-center gap-3 hover:bg-muted/40 transition-colors"
              >
                <div
                  className={`h-11 w-11 rounded-lg shrink-0 flex items-center justify-center ${
                    group.isSeries ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  {group.isSeries ? (
                    <Repeat className="h-5 w-5 text-primary" />
                  ) : (
                    <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-primary">{group.label}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {classNameOf(group.first)} · {subjectNameOf(group.first)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2 items-center">
                    <span>{ASSESSMENT_TYPE_LABELS[group.first.assessmentType as AssessmentType]}</span>
                    {group.isSeries ? (
                      <>
                        <span>·</span>
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {group.recurrence} · {group.count} dates
                        </Badge>
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          {formatClassTestSchedule(group.first)}
                          {group.count > 1 && group.last ? ` – ${formatClassTestSchedule(group.last)}` : ""}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          {formatClassTestSchedule(group.first)}
                        </span>
                      </>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      Out of {group.first.totalMarks}
                    </Badge>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule class test</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>
                Test name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Chapter 5 Weekly Test"
              />
            </div>
            <div className="space-y-1">
              <Label>Class</Label>
              <Select
                value={form.classId || "_"}
                onValueChange={(v) => setForm((f) => ({ ...f, classId: v === "_" ? "" : v, subjectId: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">Select class</SelectItem>
                  {classes.map((c: AcademyClass) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Subject</Label>
              <Select
                value={form.subjectId || "_"}
                onValueChange={(v) => setForm((f) => ({ ...f, subjectId: v === "_" ? "" : v }))}
                disabled={!form.classId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">Select subject</SelectItem>
                  {createSubjects.map((s: AcademySubject) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.subjectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select
                value={form.assessmentType}
                onValueChange={(v) => {
                  const type = v as AssessmentType;
                  setForm((f) => ({
                    ...f,
                    assessmentType: type,
                    recurrence:
                      type === "weekly" && f.recurrence === "once"
                        ? "weekly"
                        : type === "monthly" && f.recurrence === "once"
                          ? "monthly"
                          : f.recurrence,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ASSESSMENT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Test date</Label>
                <Input
                  type="date"
                  value={form.examDate}
                  onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Test time</Label>
                <Input
                  type="time"
                  value={form.testTime}
                  onChange={(e) => setForm((f) => ({ ...f, testTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Repeat</Label>
              <Select
                value={form.recurrence}
                onValueChange={(v) => {
                  const recurrence = v as ClassTestRecurrence;
                  setForm((f) => ({
                    ...f,
                    recurrence,
                    seriesCount: String(DEFAULT_SERIES_COUNT[recurrence]),
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isSeries && (
              <div className="space-y-1">
                <Label>How many in the series</Label>
                <Input
                  type="number"
                  min={2}
                  max={52}
                  value={form.seriesCount}
                  onChange={(e) => setForm((f) => ({ ...f, seriesCount: e.target.value }))}
                />
              </div>
            )}
            <div className="space-y-1">
              <Label>Total marks</Label>
              <Input
                type="number"
                min={1}
                value={form.totalMarks}
                onChange={(e) => setForm((f) => ({ ...f, totalMarks: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleCreate} disabled={createMut.isPending}>
              {isSeries ? `Schedule ${form.seriesCount} tests` : "Schedule & enter marks"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
