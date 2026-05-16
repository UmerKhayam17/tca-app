import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ModuleActionCaps } from "@/lib/permissions";
import {
  createClass,
  createSession,
  createSubject,
  fetchClasses,
  fetchSubjects,
} from "@/lib/configApi";

export default function AcademicSetupTab({
  sessionId,
  caps,
  onSessionCreated,
}: {
  sessionId: string;
  caps: ModuleActionCaps;
  onSessionCreated?: (id: string) => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<"session" | "class" | "subject" | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: classes = [] } = useQuery({
    queryKey: ["config-classes", sessionId],
    queryFn: () => fetchClasses(sessionId),
    enabled: !!sessionId,
  });

  const [selectedClass, setSelectedClass] = useState("");

  const { data: subjects = [] } = useQuery({
    queryKey: ["config-subjects", selectedClass],
    queryFn: () => fetchSubjects(selectedClass),
    enabled: !!selectedClass,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (dialog === "session") {
        return createSession({
          name: form.name,
          startDate: form.startDate,
          endDate: form.endDate,
          isActive: true,
        });
      }
      if (dialog === "class") {
        return createClass({ name: form.name, session: sessionId });
      }
      if (dialog === "subject") {
        return createSubject({
          name: form.name,
          code: form.code.toUpperCase(),
          class: selectedClass,
        });
      }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["academic-sessions"] });
      qc.invalidateQueries({ queryKey: ["config-classes"] });
      qc.invalidateQueries({ queryKey: ["config-sections"] });
      qc.invalidateQueries({ queryKey: ["config-subjects"] });
      if (dialog === "session" && data && "_id" in data) {
        onSessionCreated?.(data._id);
      }
      setDialog(null);
      toast({ title: "Saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {caps.canCreate && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => { setDialog("session"); setForm({ name: "", startDate: "", endDate: "" }); }}>
            <Plus className="h-4 w-4 mr-1" /> Session
          </Button>
          {sessionId && (
            <Button variant="outline" size="sm" onClick={() => { setDialog("class"); setForm({ name: "" }); }}>
              <Plus className="h-4 w-4 mr-1" /> Class
            </Button>
          )}
        </div>
      )}

      {!sessionId ? (
        <p className="text-sm text-muted-foreground">Select or create a session using the bar above.</p>
      ) : (
        <>
          <Card className="p-4">
            <Label className="text-xs text-muted-foreground">Class for subjects (sections → Sections tab)</Label>
            <select
              className="mt-1 w-full max-w-xs h-10 rounded-md border px-3 text-sm"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Select class</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {selectedClass && caps.canCreate && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => { setDialog("subject"); setForm({ name: "", code: "" }); }}>
                  Add subject
                </Button>
              </div>
            )}
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Classes ({classes.length})</h3>
              <ul className="text-sm space-y-1">
                {classes.map((c) => (
                  <li key={c._id} className="text-muted-foreground">{c.name}</li>
                ))}
              </ul>
            </Card>
            {selectedClass && (
              <>
                <Card className="p-4 md:col-span-2">
                  <h3 className="font-semibold mb-2">Subjects</h3>
                  <ul className="text-sm flex flex-wrap gap-2">
                    {subjects.map((s) => (
                      <li key={s._id} className="bg-muted px-2 py-1 rounded">{s.name} ({s.code})</li>
                    ))}
                  </ul>
                </Card>
              </>
            )}
          </div>
        </>
      )}

      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "session" && "New session"}
              {dialog === "class" && "New class"}
              {dialog === "subject" && "New subject"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {dialog === "session" && (
              <>
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="2026–2027" /></div>
                <div><Label>Start</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                <div><Label>End</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
              </>
            )}
            {dialog === "class" && (
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            )}
            {dialog === "subject" && (
              <>
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


