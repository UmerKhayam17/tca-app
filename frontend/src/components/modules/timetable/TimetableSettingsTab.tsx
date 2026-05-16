import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { ModuleActionCaps } from "@/lib/permissions";
import { fetchPeriodTemplates, fetchTimetableSettings, updateTimetableSettings } from "@/lib/timetableApi";

export default function TimetableSettingsTab({
  sessionId,
  caps,
}: {
  sessionId: string;
  caps: ModuleActionCaps;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    defaultPeriodTemplate: "",
    defaultMaxTeacherPerDay: 6,
    defaultMaxConsecutive: 2,
    conflictCheckOnDraft: true,
    publishRequiresCompleteQuotas: true,
    autoAssignRooms: true,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["timetable-settings", sessionId],
    queryFn: () => fetchTimetableSettings(sessionId),
    enabled: !!sessionId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["timetable-periods", sessionId],
    queryFn: () => fetchPeriodTemplates(sessionId),
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (!settings) return;
    const tplId =
      typeof settings.defaultPeriodTemplate === "object" && settings.defaultPeriodTemplate
        ? settings.defaultPeriodTemplate._id
        : (settings.defaultPeriodTemplate as string) || "";
    setForm({
      defaultPeriodTemplate: tplId,
      defaultMaxTeacherPerDay: settings.defaultMaxTeacherPerDay ?? 6,
      defaultMaxConsecutive: settings.defaultMaxConsecutive ?? 2,
      conflictCheckOnDraft: settings.conflictCheckOnDraft ?? true,
      publishRequiresCompleteQuotas: settings.publishRequiresCompleteQuotas ?? true,
      autoAssignRooms: settings.autoAssignRooms ?? true,
    });
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: () => updateTimetableSettings(sessionId, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timetable-settings", sessionId] });
      toast({ title: "Timetable settings saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (!sessionId) {
    return <p className="p-6 text-muted-foreground text-sm">Select an academic session above.</p>;
  }

  if (isLoading) {
    return <p className="p-6 text-muted-foreground text-sm">Loading settings…</p>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <Card className="p-6 max-w-xl space-y-4">
        <div>
          <h3 className="font-semibold text-primary">Timetable rules</h3>
          <p className="text-xs text-muted-foreground mt-1">Defaults used when building and publishing timetables.</p>
        </div>

        <div>
          <Label>Default period template</Label>
          <select
            className="mt-1 w-full h-10 rounded-md border px-3 text-sm"
            value={form.defaultPeriodTemplate}
            onChange={(e) => setForm((f) => ({ ...f, defaultPeriodTemplate: e.target.value }))}
            disabled={!caps.canEdit}
          >
            <option value="">None</option>
            {templates.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
                {t.isDefault ? " (default)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Max teacher lectures / day</Label>
            <input
              type="number"
              min={1}
              className="mt-1 w-full h-10 rounded-md border px-3 text-sm"
              value={form.defaultMaxTeacherPerDay}
              onChange={(e) => setForm((f) => ({ ...f, defaultMaxTeacherPerDay: Number(e.target.value) }))}
              disabled={!caps.canEdit}
            />
          </div>
          <div>
            <Label>Max consecutive (same subject)</Label>
            <input
              type="number"
              min={1}
              className="mt-1 w-full h-10 rounded-md border px-3 text-sm"
              value={form.defaultMaxConsecutive}
              onChange={(e) => setForm((f) => ({ ...f, defaultMaxConsecutive: Number(e.target.value) }))}
              disabled={!caps.canEdit}
            />
          </div>
        </div>

        <ul className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.conflictCheckOnDraft}
              onChange={(e) => setForm((f) => ({ ...f, conflictCheckOnDraft: e.target.checked }))}
              disabled={!caps.canEdit}
            />
            Check teacher/room conflicts while editing drafts
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.publishRequiresCompleteQuotas}
              onChange={(e) => setForm((f) => ({ ...f, publishRequiresCompleteQuotas: e.target.checked }))}
              disabled={!caps.canEdit}
            />
            Require all weekly subject quotas before publish
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.autoAssignRooms}
              onChange={(e) => setForm((f) => ({ ...f, autoAssignRooms: e.target.checked }))}
              disabled={!caps.canEdit}
            />
            Auto-assign rooms when generating (future)
          </label>
        </ul>

        {caps.canEdit && (
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? "Saving…" : "Save settings"}
          </Button>
        )}
      </Card>
    </div>
  );
}
