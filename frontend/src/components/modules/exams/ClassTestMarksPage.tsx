import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Role } from "@/lib/auth";
import type { ModuleActionCaps } from "@/lib/permissions";
import { testExamsHref } from "@/lib/testExamsMenus";
import {
  ASSESSMENT_TYPE_LABELS,
  fetchClassTestEntry,
  saveClassTestMarks,
  type AcademyClassTest,
  type AssessmentType,
  type ClassTestEntryRow,
} from "@/lib/studentManagementApi";

function classNameOf(test: AcademyClassTest) {
  const c = test.classId;
  return typeof c === "object" && c ? c.className : "—";
}

function subjectNameOf(test: AcademyClassTest) {
  const s = test.subjectId;
  return typeof s === "object" && s ? s.subjectName : "—";
}

export default function ClassTestMarksPage({
  testId,
  role,
  caps,
}: {
  testId: string;
  role: Role;
  caps: ModuleActionCaps;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const canEnter = caps.canEdit || caps.canCreate;
  const listHref = testExamsHref(role, "enter-tests");

  const [marks, setMarks] = useState<
    Record<string, { obtained: string; remarks: string; assessmentId?: string }>
  >({});

  const { data: entry, isLoading, isError, error } = useQuery({
    queryKey: ["class-test-entry", testId],
    queryFn: () => fetchClassTestEntry(testId),
  });

  const rows = entry?.students ?? [];
  const test = entry?.test;
  const totalMarks = test?.totalMarks ?? 20;

  useEffect(() => {
    if (!rows.length) return;
    const draft: Record<string, { obtained: string; remarks: string; assessmentId?: string }> = {};
    rows.forEach((row: ClassTestEntryRow) => {
      const sid = row.student._id;
      draft[sid] = {
        obtained: row.assessment != null ? String(row.assessment.obtainedMarks) : "",
        remarks: row.assessment?.remarks || "",
        assessmentId: row.assessment?._id,
      };
    });
    setMarks(draft);
  }, [entry]);

  const saveMut = useMutation({
    mutationFn: (entries: Parameters<typeof saveClassTestMarks>[1]) =>
      saveClassTestMarks(testId, entries),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["class-test-entry", testId] });
      qc.invalidateQueries({ queryKey: ["class-tests"] });
      toast({ title: `Saved ${data.savedCount} mark(s)` });
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const handleSave = () => {
    if (!test) return;
    const entries = rows
      .map((row) => {
        const cell = marks[row.student._id];
        if (!cell || cell.obtained === "") return null;
        return {
          studentId: row.student._id,
          assessmentId: cell.assessmentId,
          obtainedMarks: Number(cell.obtained),
          remarks: cell.remarks,
        };
      })
      .filter(Boolean) as Parameters<typeof saveClassTestMarks>[1];

    saveMut.mutate(entries);
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">Loading test and students…</div>
    );
  }

  if (isError || !test) {
    return (
      <div className="py-12 space-y-4 text-center">
        <p className="text-destructive text-sm">{(error as Error)?.message || "Test not found"}</p>
        <Button variant="outline" asChild>
          <Link to={listHref}>Back to tests</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b pb-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" asChild>
            <Link to={listHref}>
              <ArrowLeft className="h-4 w-4" /> Back to class tests
            </Link>
          </Button>
          <h2 className="font-display text-xl font-semibold text-primary">{test.title}</h2>
          <p className="text-sm text-muted-foreground">
            {classNameOf(test)} · {subjectNameOf(test)} ·{" "}
            {ASSESSMENT_TYPE_LABELS[test.assessmentType as AssessmentType]} ·{" "}
            {new Date(test.examDate).toLocaleDateString()} · Total {test.totalMarks} marks
          </p>
        </div>
        {canEnter && (
          <Button variant="hero" className="shrink-0" onClick={handleSave} disabled={saveMut.isPending}>
            <Save className="h-4 w-4 mr-1" />
            Save marks
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <p className="px-4 py-3 text-sm text-muted-foreground border-b bg-muted/20">
          Enter marks for each student in this class. Leave obtained blank to skip a student.
        </p>
        {rows.length === 0 ? (
          <p className="p-8 text-sm text-center text-muted-foreground">No active students in this class.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">#</th>
                  <th className="text-left p-3 font-medium min-w-[200px]">Student</th>
                  <th className="text-left p-3 font-medium">ID</th>
                  <th className="text-center p-3 font-medium w-36">Obtained</th>
                  <th className="text-left p-3 font-medium min-w-[160px]">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const sid = row.student._id;
                  const cell = marks[sid] || { obtained: "", remarks: "" };
                  const pct =
                    cell.obtained !== ""
                      ? Math.round((Number(cell.obtained) / totalMarks) * 100)
                      : null;
                  return (
                    <tr key={sid} className="border-b hover:bg-muted/20">
                      <td className="p-3 text-muted-foreground">{idx + 1}</td>
                      <td className="p-3 font-medium">{row.student.studentName}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{row.student.studentId}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            className="h-9 w-20 text-center"
                            type="number"
                            min={0}
                            max={totalMarks}
                            value={cell.obtained}
                            disabled={!canEnter}
                            onChange={(e) =>
                              setMarks((m) => ({
                                ...m,
                                [sid]: { ...cell, obtained: e.target.value },
                              }))
                            }
                          />
                          <span className="text-xs text-muted-foreground">/ {totalMarks}</span>
                          {pct != null && !Number.isNaN(pct) && (
                            <span className="text-xs font-medium text-primary w-10">{pct}%</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Input
                          className="h-9"
                          placeholder="Optional"
                          value={cell.remarks}
                          disabled={!canEnter}
                          onChange={(e) =>
                            setMarks((m) => ({
                              ...m,
                              [sid]: { ...cell, remarks: e.target.value },
                            }))
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
