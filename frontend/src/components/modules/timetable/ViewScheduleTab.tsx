import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { fetchClasses, fetchSections } from "@/lib/configApi";
import { fetchSectionSchedule } from "@/lib/timetableApi";
import { Badge } from "@/components/ui/badge";
import { DAY_LABELS, slotMatchesPeriod, subjectColor } from "./constants";
import type { Weekday } from "@/lib/configApi";

export default function ViewScheduleTab({ sessionId }: { sessionId: string }) {
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");

  useEffect(() => {
    setClassId("");
    setSectionId("");
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

  const { data: grid, isLoading } = useQuery({
    queryKey: ["section-schedule", sessionId, sectionId],
    queryFn: () => fetchSectionSchedule(sessionId, sectionId),
    enabled: !!sessionId && !!sectionId,
  });

  if (!sessionId) return null;

  const workingDays = (grid?.workingDays || []) as Weekday[];
  const lecturePeriods = (grid?.periods || []).filter((p) => p.type === "lecture");

  const getSlot = (day: Weekday, periodId: string) =>
    grid?.slots.find((s) => s.day === day && slotMatchesPeriod(s, periodId));

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[140px]">
          <Label className="text-xs text-muted-foreground">Class</Label>
          <select
            className="mt-1 w-full h-10 rounded-md border px-3 text-sm"
            value={classId}
            onChange={(e) => { setClassId(e.target.value); setSectionId(""); }}
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
            onChange={(e) => setSectionId(e.target.value)}
            disabled={!classId}
          >
            <option value="">Select section</option>
            {sections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {grid && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="default">Published · v{grid.version.version}</Badge>
            {grid.slots.length === 0 && (
              <span className="text-muted-foreground">Published, but no lessons in the grid yet.</span>
            )}
          </div>
        <Card className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">Time</th>
                {workingDays.map((d) => (
                  <th key={d} className="text-left p-3">{DAY_LABELS[d]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lecturePeriods.map((period) => (
                <tr key={period._id} className="border-t">
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {period.startTime}–{period.endTime}
                  </td>
                  {workingDays.map((day) => {
                    const slot = getSlot(day, period._id);
                    return (
                      <td key={day} className="p-2">
                        {slot ? (
                          <div className={`rounded-md border p-2 ${subjectColor(slot.subject._id)}`}>
                            <div className="font-semibold">{slot.subject.name}</div>
                            <div className="text-xs opacity-80">{slot.teacher.name}</div>
                          </div>
                        ) : (
                          "—"
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
    </div>
  );
}


