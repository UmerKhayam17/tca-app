import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, useStore, newId } from "@/lib/store";
import { ModuleActionCaps, PermLevel } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import PanelToolbar from "@/components/modules/PanelToolbar";
import { matchesPanelSearch } from "@/lib/panelSearch";

const today = () => new Date().toISOString().slice(0, 10);

const AttendanceModule = ({ perm: _perm, caps }: { perm: PermLevel; caps: ModuleActionCaps }) => {
  const students = useStore(() => Store.listStudents());
  const attendance = useStore(() => Store.listAttendance());
  const canMark = caps.canCreate || caps.canEdit;
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const studentsFiltered = useMemo(() => {
    if (!search.trim()) return students;
    return students.filter((s) => matchesPanelSearch(search, s.name, s.class, s.id));
  }, [students, search]);

  const todayMap = new Map(attendance.filter((a) => a.date === today()).map((a) => [a.studentId, a]));

  const mark = (studentId: string, status: "present" | "absent" | "leave") => {
    const list = Store.listAttendance();
    const existing = list.find((a) => a.studentId === studentId && a.date === today());
    let next;
    if (existing) next = list.map((a) => (a.id === existing.id ? { ...a, status } : a));
    else next = [...list, { id: newId(), studentId, date: today(), status }];
    Store.saveAttendance(next);
    toast({ title: `Marked ${status}` });
  };

  const counts = {
    present: [...todayMap.values()].filter((a) => a.status === "present").length,
    absent:  [...todayMap.values()].filter((a) => a.status === "absent").length,
    leave:   [...todayMap.values()].filter((a) => a.status === "leave").length,
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Present</div><div className="font-display text-2xl font-bold text-accent">{counts.present}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Absent</div><div className="font-display text-2xl font-bold text-destructive">{counts.absent}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Leave</div><div className="font-display text-2xl font-bold text-primary">{counts.leave}</div></Card>
      </div>

      <PanelToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search student or class…"
      />

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-semibold text-primary">Today — {today()}</div>
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
              {studentsFiltered.length === 0 && (
                <tr>
                  <td colSpan={canMark ? 4 : 3} className="px-4 py-8 text-center text-muted-foreground">
                    No students match your search.
                  </td>
                </tr>
              )}
              {studentsFiltered.map((s) => {
                const cur = todayMap.get(s.id)?.status;
                return (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-primary">{s.name}</td>
                    <td className="px-4 py-3">{s.class}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                        cur === "present" ? "bg-accent/15 text-accent" :
                        cur === "absent" ? "bg-destructive/15 text-destructive" :
                        cur === "leave" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      }`}>{cur || "unmarked"}</span>
                    </td>
                    {canMark && (
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                        <Button size="sm" variant={cur === "present" ? "hero" : "outline"} onClick={() => mark(s.id, "present")}>P</Button>
                        <Button size="sm" variant={cur === "absent" ? "hero" : "outline"} onClick={() => mark(s.id, "absent")}>A</Button>
                        <Button size="sm" variant={cur === "leave" ? "hero" : "outline"} onClick={() => mark(s.id, "leave")}>L</Button>
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
