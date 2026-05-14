import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Store, useStore, newId, Student } from "@/lib/store";
import { ModuleActionCaps, PermLevel } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";

const empty: Student = { id: "", name: "", class: "", rollNo: "", guardian: "", phone: "" };

const StudentsModule = ({ perm: _perm, caps }: { perm: PermLevel; caps: ModuleActionCaps }) => {
  const students = useStore(() => Store.listStudents());
  const anyWrite = caps.canCreate || caps.canEdit || caps.canDelete;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student>(empty);
  const [query, setQuery] = useState("");
  const { toast } = useToast();

  const save = () => {
    if (editing.id) {
      if (!caps.canEdit) return;
    } else if (!caps.canCreate) {
      return;
    }
    if (!editing.name.trim()) return;
    const list = Store.listStudents();
    if (editing.id) {
      Store.saveStudents(list.map((s) => (s.id === editing.id ? editing : s)));
      toast({ title: "Student updated" });
    } else {
      Store.saveStudents([{ ...editing, id: newId() }, ...list]);
      toast({ title: "Student added" });
    }
    setOpen(false); setEditing(empty);
  };

  const remove = (id: string) => {
    Store.saveStudents(Store.listStudents().filter((s) => s.id !== id));
    toast({ title: "Student removed" });
  };

  const filtered = students.filter((s) =>
    [s.name, s.class, s.rollNo, s.guardian].join(" ").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Input placeholder="Search students..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-md" />
        {(caps.canCreate || caps.canEdit) && (
          <Dialog open={open} onOpenChange={setOpen}>
            {caps.canCreate ? (
              <Button variant="hero" onClick={() => { setEditing(empty); setOpen(true); }}>
                <Plus className="h-4 w-4" /> Add Student
              </Button>
            ) : null}
            <DialogContent>
              <DialogHeader><DialogTitle>{editing.id ? "Edit" : "Add"} Student</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                <div><Label>Class</Label><Input value={editing.class} onChange={(e) => setEditing({ ...editing, class: e.target.value })} /></div>
                <div><Label>Roll No</Label><Input value={editing.rollNo} onChange={(e) => setEditing({ ...editing, rollNo: e.target.value })} /></div>
                <div><Label>Guardian</Label><Input value={editing.guardian} onChange={(e) => setEditing({ ...editing, guardian: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={save} variant="hero">Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Name</th>
                <th className="text-left font-medium px-4 py-3">Class</th>
                <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Roll</th>
                <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Guardian</th>
                <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Phone</th>
                {anyWrite && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium text-primary">{s.name}</td>
                  <td className="px-4 py-3">{s.class}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">{s.rollNo}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{s.guardian}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{s.phone}</td>
                  {anyWrite && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {caps.canEdit && (
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      )}
                      {caps.canDelete && (
                        <Button size="sm" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No students found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {!anyWrite && <p className="text-xs text-muted-foreground">Read-only view based on your role permissions.</p>}
    </div>
  );
};

export default StudentsModule;
