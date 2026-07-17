import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ModuleActionCaps } from "@/lib/permissions";
import {
  createPeriodTemplate,
  deletePeriodTemplate,
  fetchPeriodTemplates,
  updatePeriodTemplate,
  type PeriodTemplate,
} from "@/lib/timetableApi";
import PanelSearchBar from "@/components/modules/PanelSearchBar";
import { usePanelListSearch } from "@/hooks/usePanelListSearch";

const QK = (sid: string) => ["timetable-periods", sid] as const;

interface AcademyBreak {
  breakName: string;
  startTime: string;
  endTime: string;
}

function parseTimeToMinutes(value: string) {
  const match = value.match(/^([0-1]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatMinutesToTime(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function generatePeriods(
  startTime: string,
  endTime: string,
  duration: number,
  breaks: AcademyBreak[]
) {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return [];
  const validatedBreaks = [...breaks]
    .map((br) => ({
      ...br,
      startMinutes: parseTimeToMinutes(br.startTime),
      endMinutes: parseTimeToMinutes(br.endTime),
    }))
    .filter((br) => br.startMinutes !== null && br.endMinutes !== null)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  let cursor = startMinutes;
  let period = 1;
  const slots: Array<{ label: string; startTime: string; endTime: string; type: "lecture" | "break" }> = [];

  const addLectureSegment = (segmentEnd: number) => {
    if (segmentEnd <= cursor) return;
    while (cursor + duration <= segmentEnd) {
      slots.push({
        label: `Period ${period}`,
        startTime: formatMinutesToTime(cursor),
        endTime: formatMinutesToTime(cursor + duration),
        type: "lecture",
      });
      cursor += duration;
      period += 1;
    }
    if (cursor < segmentEnd) {
      slots.push({
        label: `Period ${period}`,
        startTime: formatMinutesToTime(cursor),
        endTime: formatMinutesToTime(segmentEnd),
        type: "lecture",
      });
      cursor = segmentEnd;
      period += 1;
    }
  };

  for (const br of validatedBreaks) {
    if (br.startMinutes > cursor) {
      addLectureSegment(br.startMinutes);
    }
    slots.push({
      label: br.breakName,
      startTime: formatMinutesToTime(br.startMinutes),
      endTime: formatMinutesToTime(br.endMinutes),
      type: "break",
    });
    cursor = br.endMinutes;
  }

  addLectureSegment(endMinutes);
  return slots;
}

export default function PeriodsTab({ sessionId, caps }: { sessionId: string; caps: ModuleActionCaps }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: templates = [], isLoading } = useQuery({
    queryKey: QK(sessionId),
    queryFn: () => fetchPeriodTemplates(sessionId),
    enabled: !!sessionId,
  });

  const activeTemplate = useMemo(
    () => templates.find((t) => t.isDefault) || templates[0] || null,
    [templates]
  );

  const [form, setForm] = useState({
    academyStartTime: "",
    academyEndTime: "",
    periodDurationMinutes: 40,
    breaks: [] as AcademyBreak[],
  });

  const previewPeriods = useMemo(
    () =>
      generatePeriods(
        form.academyStartTime,
        form.academyEndTime,
        form.periodDurationMinutes,
        form.breaks
      ),
    [form]
  );

  useEffect(() => {
    if (!activeTemplate) {
      setForm({ academyStartTime: "", academyEndTime: "", periodDurationMinutes: 40, breaks: [] });
      return;
    }
    setForm({
      academyStartTime: activeTemplate.academyStartTime,
      academyEndTime: activeTemplate.academyEndTime,
      periodDurationMinutes: activeTemplate.periodDurationMinutes,
      breaks: activeTemplate.breaks ?? [],
    });
  }, [activeTemplate]);

  const createMut = useMutation({
    mutationFn: () =>
      createPeriodTemplate({
        session: sessionId,
        name: "Academy time configuration",
        academyStartTime: form.academyStartTime,
        academyEndTime: form.academyEndTime,
        periodDurationMinutes: form.periodDurationMinutes,
        breaks: form.breaks,
        isDefault: templates.length === 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(sessionId) });
      toast({ title: "Academy time configuration saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: () => {
      if (!activeTemplate) throw new Error("No configuration to update");
      return updatePeriodTemplate(activeTemplate._id, {
        name: activeTemplate.name || "Academy time configuration",
        academyStartTime: form.academyStartTime,
        academyEndTime: form.academyEndTime,
        periodDurationMinutes: form.periodDurationMinutes,
        breaks: form.breaks,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(sessionId) });
      toast({ title: "Academy time configuration updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: deletePeriodTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(sessionId) });
      toast({ title: "Configuration deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const { search, setSearch, filtered: templatesFiltered } = usePanelListSearch(templates, (t) => [
    t.name || "",
    t.academyStartTime,
    t.academyEndTime,
    String(t.periodDurationMinutes),
    ...t.breaks.map((b) => [b.breakName, b.startTime, b.endTime].join(" ")),
  ]);

  const breakErrors = form.breaks.map((br) => {
    const start = parseTimeToMinutes(br.startTime);
    const end = parseTimeToMinutes(br.endTime);
    if (start === null || end === null) return "Invalid time";
    if (end <= start) return "End time must be after start time";
    return null;
  });

  const hasErrors =
    !form.academyStartTime ||
    !form.academyEndTime ||
    !form.periodDurationMinutes ||
    parseTimeToMinutes(form.academyStartTime) === null ||
    parseTimeToMinutes(form.academyEndTime) === null ||
    parseTimeToMinutes(form.academyEndTime) <= parseTimeToMinutes(form.academyStartTime) ||
    form.breaks.some((_, index) => breakErrors[index] !== null);

  if (!sessionId) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Academy Time Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Define academy hours, default subject duration, and breaks. The system will generate teaching periods automatically.
          </p>
        </div>
        {activeTemplate && caps.canDelete && (
          <Button
            variant="destructive"
            onClick={() => {
              if (!confirm("Delete this configuration?")) return;
              deleteMut.mutate(activeTemplate._id);
            }}
            disabled={deleteMut.isPending}
          >
            Delete configuration
          </Button>
        )}
      </div>

      <Card className="p-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Academy start time</Label>
              <Input
                type="time"
                value={form.academyStartTime}
                onChange={(e) => setForm((f) => ({ ...f, academyStartTime: e.target.value }))}
              />
            </div>
            <div>
              <Label>Academy end time</Label>
              <Input
                type="time"
                value={form.academyEndTime}
                onChange={(e) => setForm((f) => ({ ...f, academyEndTime: e.target.value }))}
              />
            </div>
          </div>

          <div className="sm:w-48">
            <Label>Default period duration</Label>
            <Input
              type="number"
              min={1}
              value={form.periodDurationMinutes}
              onChange={(e) => setForm((f) => ({ ...f, periodDurationMinutes: Number(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>Breaks</Label>
                <p className="text-xs text-muted-foreground">Add one or more breaks inside academy hours.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    breaks: [...f.breaks, { breakName: "Break", startTime: "", endTime: "" }],
                  }))
                }
              >
                <Plus className="h-4 w-4" /> Add break
              </Button>
            </div>

            <div className="space-y-3">
              {form.breaks.map((breakRow, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 p-3 border rounded-lg">
                  <div>
                    <Label>Break name</Label>
                    <Input
                      value={breakRow.breakName}
                      onChange={(e) => {
                        const next = [...form.breaks];
                        next[index] = { ...next[index], breakName: e.target.value };
                        setForm((f) => ({ ...f, breaks: next }));
                      }}
                    />
                  </div>
                  <div>
                    <Label>Start time</Label>
                    <Input
                      type="time"
                      value={breakRow.startTime}
                      onChange={(e) => {
                        const next = [...form.breaks];
                        next[index] = { ...next[index], startTime: e.target.value };
                        setForm((f) => ({ ...f, breaks: next }));
                      }}
                    />
                  </div>
                  <div>
                    <Label>End time</Label>
                    <Input
                      type="time"
                      value={breakRow.endTime}
                      onChange={(e) => {
                        const next = [...form.breaks];
                        next[index] = { ...next[index], endTime: e.target.value };
                        setForm((f) => ({ ...f, breaks: next }));
                      }}
                    />
                    {breakErrors[index] && (
                      <p className="text-xs text-destructive mt-1">{breakErrors[index]}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="self-end"
                    onClick={() => {
                      setForm((f) => ({
                        ...f,
                        breaks: f.breaks.filter((_, idx) => idx !== index),
                      }));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Notes</Label>
            <Textarea
              readOnly
              value={
                "Academy time configuration generates lecture periods automatically, skipping break intervals. Update the values above to regenerate the schedule."
              }
            />
          </div>

          {caps.canCreate && (
            <Button
              onClick={() => (activeTemplate ? updateMut.mutate() : createMut.mutate())}
              disabled={hasErrors || createMut.isPending || updateMut.isPending}
            >
              {activeTemplate ? "Update configuration" : "Save configuration"}
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-primary">Generated periods preview</h2>
            <p className="text-sm text-muted-foreground">Review the automatically generated lecture and break periods.</p>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Period</th>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {previewPeriods.map((p, index) => (
                  <tr
                    key={`${p.label}-${index}`}
                    className={p.type === "break" ? "bg-muted/10" : ""}
                  >
                    <td className="px-3 py-2 font-medium">{p.label}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {p.startTime} – {p.endTime}
                    </td>
                    <td className="px-3 py-2 text-sm text-muted-foreground capitalize">{p.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-primary">Saved configurations</h2>
          <span className="text-sm text-muted-foreground">{templates.length} saved</span>
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : templatesFiltered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved configurations yet.</p>
        ) : (
          <div className="grid gap-4">
            {templatesFiltered.map((template) => (
              <Card key={template._id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-primary">{template.name || "Academy time configuration"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {template.academyStartTime} – {template.academyEndTime}, {template.periodDurationMinutes} min
                    </p>
                  </div>
                  {template.isDefault && <span className="rounded-full bg-accent/10 px-2 py-1 text-xs text-accent">Default</span>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-semibold">Breaks</p>
                    {template.breaks.length ? (
                      <ul className="space-y-1 mt-2">
                        {template.breaks.map((br, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="font-medium">{br.breakName}</span>
                            <span className="text-muted-foreground">{br.startTime}–{br.endTime}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground mt-2">No breaks configured.</p>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">Preview</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {template.slots.length} generated periods including breaks.
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



