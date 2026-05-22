import { useState } from "react";
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
import { ChevronRight, ClipboardList, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { ModuleActionCaps } from "@/lib/permissions";
import { classTestMarksHref } from "@/lib/testExamsMenus";
import {
  ASSESSMENT_TYPE_LABELS,
  createClassTest,
  fetchAcademyClasses,
  fetchClassTests,
  fetchSubjectsByClass,
  type AcademyClass,
  type AcademyClassTest,
  type AcademySubject,
  type AssessmentType,
} from "@/lib/studentManagementApi";

const TYPES = Object.keys(ASSESSMENT_TYPE_LABELS) as AssessmentType[];

function classNameOf(test: AcademyClassTest) {
  const c = test.classId;
  return typeof c === "object" && c ? c.className : "—";
}

function subjectNameOf(test: AcademyClassTest) {
  const s = test.subjectId;
  return typeof s === "object" && s ? s.subjectName : "—";
}

export default function ClassTestsPanel({ caps }: { caps: ModuleActionCaps }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const canManage = caps.canCreate;
  const role = user?.role;

  const [classFilter, setClassFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    classId: "",
    subjectId: "",
    title: "",
    assessmentType: "quiz" as AssessmentType,
    examDate: new Date().toISOString().slice(0, 10),
    totalMarks: "20",
  });

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
    onSuccess: (test) => {
      qc.invalidateQueries({ queryKey: ["class-tests"] });
      setCreateOpen(false);
      toast({ title: "Test created", description: "Opening marks entry…" });
      if (role) navigate(classTestMarksHref(role, test._id));
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const handleCreate = () => {
    if (!form.classId || !form.subjectId || !form.title.trim()) {
      toast({ title: "Fill class, subject, and title", variant: "destructive" });
      return;
    }
    createMut.mutate({
      classId: form.classId,
      subjectId: form.subjectId,
      title: form.title.trim(),
      assessmentType: form.assessmentType,
      examDate: form.examDate,
      totalMarks: Number(form.totalMarks) || 20,
    });
  };

  const openTest = (testId: string) => {
    if (!role) return;
    navigate(classTestMarksHref(role, testId));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Filter by class</Label>
          <Select value={classFilter || "_all"} onValueChange={(v) => setClassFilter(v === "_all" ? "" : v)}>
            <SelectTrigger className="w-[200px]">
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
          <Button variant="hero" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Create test
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b font-semibold text-sm text-primary bg-secondary/30 flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Class tests — click a test to enter marks
        </div>
        {testsLoading && <p className="p-6 text-sm text-muted-foreground">Loading…</p>}
        {!testsLoading && tests.length === 0 && (
          <p className="p-8 text-sm text-center text-muted-foreground">
            No tests yet. Create a test, then open it to enter marks for all students in the class.
          </p>
        )}
        <ul className="divide-y">
          {tests.map((test) => (
            <li key={test._id}>
              <button
                type="button"
                onClick={() => openTest(test._id)}
                className="w-full text-left px-4 py-4 flex items-center gap-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-primary">{test.title}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {classNameOf(test)} · {subjectNameOf(test)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2 items-center">
                    <span>{ASSESSMENT_TYPE_LABELS[test.assessmentType as AssessmentType]}</span>
                    <span>·</span>
                    <span>{new Date(test.examDate).toLocaleDateString()}</span>
                    <Badge variant="outline" className="text-[10px]">
                      Out of {test.totalMarks}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create class test</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            After creating, you will go to a new page listing all students in the class to enter marks.
          </p>
          <div className="grid gap-3 py-2">
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
              <Label>Type</Label>
              <Select
                value={form.assessmentType}
                onValueChange={(v) => setForm((f) => ({ ...f, assessmentType: v as AssessmentType }))}
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
            <div className="space-y-1">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Week 3 Quiz"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.examDate}
                  onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
                />
              </div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleCreate} disabled={createMut.isPending}>
              Create & enter marks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
