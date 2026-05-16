import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ModuleActionCaps } from "@/lib/permissions";
import {
  createPeriodTemplate,
  deletePeriodTemplate,
  fetchPeriodTemplates,
  type PeriodSlot,
  type PeriodTemplate,
} from "@/lib/timetableApi";

const QK = (sid: string) => ["timetable-periods", sid] as const;

const emptySlot = (): Omit<PeriodSlot, "_id"> => ({
  order: 1,
  label: "Period 1",
  startTime: "08:00",
  endTime: "08:40",
  type: "lecture",
});

export default function PeriodsTab({ sessionId, caps }: { sessionId: string; caps: ModuleActionCaps }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Morning");
  const [slots, setSlots] = useState<Omit<PeriodSlot, "_id">[]>([emptySlot()]);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: QK(sessionId),
    queryFn: () => fetchPeriodTemplates(sessionId),
    enabled: !!sessionId,
  });

  const saveMut = useMutation({
    mutationFn: () =>
      createPeriodTemplate({
        session: sessionId,
        name,
        slots: slots.map((s, i) => ({ ...s, order: i + 1 })),
        isDefault: templates.length === 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(sessionId) });
      setOpen(false);
      toast({ title: "Period template created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const delMut = useMutation({
    mutationFn: deletePeriodTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(sessionId) });
      toast({ title: "Template deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (!sessionId) return <p className="p-6 text-muted-foreground text-sm">Select a session above.</p>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {caps.canCreate && (
        <Button className="gap-2" onClick={() => { setName("Morning"); setSlots([emptySlot()]); setOpen(true); }}>
          <Plus className="h-4 w-4" /> New period template
        </Button>
      )}
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {templates.map((t: PeriodTemplate) => (
        <Card key={t._id} className="p-4">
          <div className="flex justify-between items-start gap-2 mb-3">
            <div>
              <h3 className="font-semibold text-primary">{t.name}</h3>
              {t.isDefault && <span className="text-xs text-accent">Default</span>}
            </div>
            {caps.canDelete && (
              <Button variant="ghost" size="icon" onClick={() => confirm("Delete template?") && delMut.mutate(t._id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
          <div className="grid gap-1 text-sm">
            {t.slots.map((s) => (
              <div key={s._id} className="flex gap-3 py-1 border-b border-border/50 last:border-0">
                <span className="font-mono text-xs w-24 text-muted-foreground">
                  {s.startTime}–{s.endTime}
                </span>
                <span className={s.type === "break" ? "text-muted-foreground italic" : "font-medium"}>
                  {s.label}
                  {s.type === "break" ? " (break)" : ""}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New period template</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Template name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Label>Periods</Label>
            {slots.map((s, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 p-2 border rounded-md">
                <Input placeholder="Label" value={s.label} onChange={(e) => {
                  const next = [...slots]; next[i] = { ...next[i], label: e.target.value }; setSlots(next);
                }} />
                <select className="h-10 rounded-md border px-2 text-sm" value={s.type} onChange={(e) => {
                  const next = [...slots]; next[i] = { ...next[i], type: e.target.value as PeriodSlot["type"] }; setSlots(next);
                }}>
                  <option value="lecture">Lecture</option>
                  <option value="break">Break</option>
                </select>
                <Input placeholder="Start" value={s.startTime} onChange={(e) => {
                  const next = [...slots]; next[i] = { ...next[i], startTime: e.target.value }; setSlots(next);
                }} />
                <Input placeholder="End" value={s.endTime} onChange={(e) => {
                  const next = [...slots]; next[i] = { ...next[i], endTime: e.target.value }; setSlots(next);
                }} />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setSlots([...slots, { ...emptySlot(), order: slots.length + 1, label: `Period ${slots.length + 1}` }])}>
              Add row
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!name || saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



