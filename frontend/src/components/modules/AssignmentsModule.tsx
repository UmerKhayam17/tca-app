import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Store, useStore, newId, Assignment } from "@/lib/store";
import { ModuleActionCaps, PermLevel } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";

const empty: Assignment = { id: "", class: "10-A", subject: "Math", title: "", dueDate: "", submitted: 0, total: 24 };

const AssignmentsModule = ({ perm: _perm, caps }: { perm: PermLevel; caps: ModuleActionCaps }) => {
  const list = useStore(() => Store.listAssignments());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment>(empty);
  const { toast } = useToast();

  const save = () => {
    if (!caps.canCreate) return;
    if (!editing.title.trim()) return;
    const all = Store.listAssignments();
    Store.saveAssignments([{ ...editing, id: newId() }, ...all]);
    toast({ title: "Assignment created" });
    setOpen(false); setEditing(empty);
  };

  const grade = (id: string) => {
    Store.saveAssignments(Store.listAssignments().map((a) =>
      a.id === id ? { ...a, submitted: Math.min(a.total, a.submitted + 1) } : a,
    ));
    toast({ title: "Submission graded" });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {caps.canCreate && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="hero"><Plus className="h-4 w-4" /> New Assignment</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Assignment</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Title</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
                <div><Label>Class</Label><Input value={editing.class} onChange={(e) => setEditing({ ...editing, class: e.target.value })} /></div>
                <div><Label>Subject</Label><Input value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} /></div>
                <div><Label>Due date</Label><Input type="date" value={editing.dueDate} onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })} /></div>
                <div><Label>Total students</Label><Input type="number" value={editing.total} onChange={(e) => setEditing({ ...editing, total: Number(e.target.value) })} /></div>
              </div>
              <DialogFooter><Button onClick={save} variant="hero">Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((a) => (
          <Card key={a.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">{a.class} • {a.subject}</div>
              <div className="text-xs text-accent">Due {a.dueDate}</div>
            </div>
            <div className="font-semibold text-primary">{a.title}</div>
            <div className="text-xs text-muted-foreground">Submissions: {a.submitted}/{a.total}</div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${(a.submitted / a.total) * 100}%` }} />
            </div>
            {caps.canEdit && (
              <Button size="sm" variant="outline" className="w-full" onClick={() => grade(a.id)}>Grade next submission</Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AssignmentsModule;
