import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GraduationCap, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { ModuleActionCaps } from "@/lib/permissions";
import {
  createClass,
  createSession,
  createSubject,
  fetchClasses,
  fetchSubjects,
} from "@/lib/configApi";
import PanelSearchBar from "@/components/modules/PanelSearchBar";
import { matchesPanelSearch } from "@/lib/panelSearch";

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

  const [search, setSearch] = useState("");
  const classesFiltered = useMemo(() => {
    if (!search.trim()) return classes;
    return classes.filter((c) => matchesPanelSearch(search, c.name));
  }, [classes, search]);
  const subjectsFiltered = useMemo(() => {
    if (!search.trim()) return subjects;
    return subjects.filter((s) => matchesPanelSearch(search, s.name, s.code));
  }, [subjects, search]);

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
          <PanelSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search classes and subjects…"
            className="max-w-md"
          />

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="font-display font-semibold text-primary">
                Classes ({classesFiltered.length}
                {search.trim() ? ` of ${classes.length}` : ""})
              </h3>
              <p className="text-xs text-muted-foreground">
                Select a class to manage subjects · sections are on the Sections tab
              </p>
            </div>

            {classesFiltered.length === 0 ? (
              <Card className="p-10 text-center text-muted-foreground text-sm">
                {classes.length === 0
                  ? "No classes yet. Click + Class to add one for this session."
                  : "No classes match your search."}
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {classesFiltered.map((c) => {
                  const isSelected = selectedClass === c._id;
                  return (
                    <Card
                      key={c._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedClass(c._id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedClass(c._id);
                        }
                      }}
                      className={cn(
                        "p-4 cursor-pointer transition-smooth hover:shadow-elegant hover:border-accent/50 text-left",
                        isSelected && "ring-2 ring-accent border-accent shadow-elegant"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-lg grid place-items-center shrink-0",
                            isSelected ? "bg-accent text-accent-foreground" : "bg-accent/10"
                          )}
                        >
                          <GraduationCap
                            className={cn("h-5 w-5", !isSelected && "text-accent")}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-primary truncate">{c.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {isSelected ? "Selected · manage subjects below" : "Click to view subjects"}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {selectedClass && (
            <Card className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-primary">
                  Subjects — {classes.find((c) => c._id === selectedClass)?.name ?? "Class"}
                </h3>
                {caps.canCreate && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDialog("subject");
                      setForm({ name: "", code: "" });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add subject
                  </Button>
                )}
              </div>
              {subjectsFiltered.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {subjects.length === 0
                    ? "No subjects for this class yet."
                    : "No subjects match your search."}
                </p>
              ) : (
                <ul className="text-sm flex flex-wrap gap-2">
                  {subjectsFiltered.map((s) => (
                    <li key={s._id} className="bg-muted px-2.5 py-1 rounded-md font-medium">
                      {s.name}{" "}
                      <span className="text-muted-foreground font-normal">({s.code})</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
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


