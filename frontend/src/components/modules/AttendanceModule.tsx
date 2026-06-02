import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModuleActionCaps, PermLevel } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import PanelToolbar from "@/components/modules/PanelToolbar";
import { matchesPanelSearch } from "@/lib/panelSearch";
import {
  fetchAcademyAttendanceDay,
  fetchAcademyClasses,
  fetchAcademyStudents,
  markAcademyAttendance,
  type AcademyAttendanceRecord,
  type AcademyStudent,
} from "@/lib/studentManagementApi";
import { useAuth } from "@/hooks/useAuth";

const today = () => new Date().toISOString().slice(0, 10);

function classLabel(s: AcademyStudent) {
  const c = s.classId;
  if (typeof c === "object" && c && "className" in c) return c.className;
  return "—";
}

const AttendanceModule = ({ perm: _perm, caps }: { perm: PermLevel; caps: ModuleActionCaps }) => {
  const { user } = useAuth();
  const isParent = user?.role === "parent";
  const { toast } = useToast();
  const qc = useQueryClient();
  const [date, setDate] = useState(today());
  const [classFilter, setClassFilter] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    try {
      return localStorage.getItem("parent_selected_student_id") || "";
    } catch {
      return "";
    }
  });
  const [search, setSearch] = useState("");
  const canMark = caps.canCreate || caps.canEdit;

  const { data: classes = [] } = useQuery({
    queryKey: ["academy-classes-attendance"],
    queryFn: () => fetchAcademyClasses({ status: "active" }),
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["academy-attendance-day", date, classFilter],
    queryFn: () =>
      fetchAcademyAttendanceDay({
        date,
        classId: classFilter || undefined,
      }),
  });

  const { data: parentStudents = [] } = useQuery({
    queryKey: ["parent-students-attendance"],
    queryFn: async () => {
      const r = await fetchAcademyStudents({ page: 1, limit: 200, status: "active" });
      return r.students;
    },
    enabled: isParent,
    retry: false,
  });

  useEffect(() => {
    if (!isParent) return;
    try {
      localStorage.setItem("parent_selected_student_id", selectedStudentId || "");
    } catch {
      // ignore
    }
  }, [isParent, selectedStudentId]);

  useEffect(() => {
    if (!isParent) return;
    if (!parentStudents.length) {
      if (selectedStudentId) setSelectedStudentId("");
      return;
    }
    if (!selectedStudentId || !parentStudents.some((s) => s._id === selectedStudentId)) {
      setSelectedStudentId(parentStudents[0]._id);
    }
  }, [isParent, parentStudents, selectedStudentId]);

  const markMut = useMutation({
    mutationFn: (payload: { studentId: string; status: "present" | "absent" | "late" | "leave" }) =>
      markAcademyAttendance({
        date,
        entries: [{ studentId: payload.studentId, status: payload.status }],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy-attendance-day", date] });
      qc.invalidateQueries({ queryKey: ["academy-attendance-summary"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const recordMap = useMemo(() => {
    const m = new Map<string, AcademyAttendanceRecord>();
    (data?.records ?? []).forEach((r) => {
      const sid = typeof r.studentId === "object" ? (r.studentId as { _id?: string })._id : r.studentId;
      if (sid) m.set(String(sid), r);
    });
    return m;
  }, [data?.records]);

  const students = data?.students ?? [];
  const summary = data?.summary;

  const studentsFiltered = useMemo(() => {
    const base = isParent && selectedStudentId
      ? students.filter((s) => s._id === selectedStudentId)
      : students;
    if (!search.trim()) return base;
    return base.filter((s) =>
      matchesPanelSearch(search, s.studentName, s.studentId, classLabel(s), s.phone)
    );
  }, [students, search, isParent, selectedStudentId]);

  const parentSummary = useMemo(() => {
    if (!isParent || !selectedStudentId) return summary;
    const rec = recordMap.get(selectedStudentId);
    const counts = { present: 0, absent: 0, leave: 0, late: 0, unmarked: 0 };
    if (!rec) counts.unmarked = 1;
    else if (rec.status in counts) (counts as any)[rec.status] += 1;
    return counts;
  }, [isParent, selectedStudentId, recordMap, summary]);

  const mark = (studentId: string, status: "present" | "absent" | "late" | "leave") => {
    markMut.mutate(
      { studentId, status },
      { onSuccess: () => toast({ title: `Marked ${status}` }) }
    );
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Present</div>
          <div className="font-display text-2xl font-bold text-accent">
            {parentSummary?.present ?? "—"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Absent</div>
          <div className="font-display text-2xl font-bold text-destructive">
            {parentSummary?.absent ?? "—"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Leave</div>
          <div className="font-display text-2xl font-bold text-primary">
            {parentSummary?.leave ?? "—"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Unmarked</div>
          <div className="font-display text-2xl font-bold text-muted-foreground">
            {parentSummary?.unmarked ?? "—"}
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Date</label>
          <input
            type="date"
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        {isParent ? (
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Child</label>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm min-w-[14rem]"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">Select child…</option>
              {parentStudents.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.studentName} ({s.studentId})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Class</label>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm min-w-[10rem]"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.className}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <PanelToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search student or class…"
      />

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-semibold text-primary">
          Attendance — {date}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Student</th>
                <th className="text-left px-4 py-3">Class</th>
                <th className="text-left px-4 py-3">Status</th>
                {canMark && <th className="text-right px-4 py-3">Mark</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={canMark ? 4 : 3} className="px-4 py-8 text-center text-muted-foreground">
                    Loading students…
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={canMark ? 4 : 3} className="px-4 py-8 text-center text-destructive">
                    {(error as Error).message}
                  </td>
                </tr>
              )}
              {!isLoading && !isError && studentsFiltered.length === 0 && (
                <tr>
                  <td colSpan={canMark ? 4 : 3} className="px-4 py-8 text-center text-muted-foreground">
                    {students.length === 0
                      ? "No active academy students. Register students in Student Records."
                      : "No students match your search."}
                  </td>
                </tr>
              )}
              {studentsFiltered.map((s) => {
                const cur = recordMap.get(s._id)?.status;
                return (
                  <tr key={s._id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-primary">{s.studentName}</td>
                    <td className="px-4 py-3">{classLabel(s)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                          cur === "present"
                            ? "bg-accent/15 text-accent"
                            : cur === "absent"
                              ? "bg-destructive/15 text-destructive"
                              : cur === "leave" || cur === "late"
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {cur || "unmarked"}
                      </span>
                    </td>
                    {canMark && (
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                        <Button
                          size="sm"
                          variant={cur === "present" ? "hero" : "outline"}
                          disabled={markMut.isPending}
                          onClick={() => mark(s._id, "present")}
                        >
                          P
                        </Button>
                        <Button
                          size="sm"
                          variant={cur === "absent" ? "hero" : "outline"}
                          disabled={markMut.isPending}
                          onClick={() => mark(s._id, "absent")}
                        >
                          A
                        </Button>
                        <Button
                          size="sm"
                          variant={cur === "leave" ? "hero" : "outline"}
                          disabled={markMut.isPending}
                          onClick={() => mark(s._id, "leave")}
                        >
                          L
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AttendanceModule;
