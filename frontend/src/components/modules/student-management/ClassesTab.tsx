import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { classDetailHref } from "@/lib/studentManagementMenus";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import PanelSearchBar from "@/components/modules/PanelSearchBar";
import { useToast } from "@/hooks/use-toast";
import type { ModuleActionCaps } from "@/lib/permissions";
import {
  createAcademyClass, deleteAcademyClass, fetchAcademyClasses, updateAcademyClass, type AcademyClass,
} from "@/lib/studentManagementApi";

const QK = ["academy-classes"] as const;

export default function ClassesTab({ caps }: { caps: ModuleActionCaps }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? "admin";
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<AcademyClass | null>(null);
  const [form, setForm] = useState({ className: "", status: "active" as "active" | "inactive" });

  const { data: classes = [], isLoading } = useQuery({
    queryKey: [...QK, search],
    queryFn: () => fetchAcademyClasses({ search: search || undefined }),
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (edit) return updateAcademyClass(edit._id, form);
      return createAcademyClass(form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
      setOpen(false);
      setEdit(null);
      toast({ title: edit ? "Class updated" : "Class created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteAcademyClass(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
      toast({ title: "Class deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setEdit(null);
    setForm({ className: "", status: "active" });
    setOpen(true);
  };

  const openEdit = (c: AcademyClass) => {
    setEdit(c);
    setForm({ className: c.className, status: c.status });
    setOpen(true);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <PanelSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search classes…"
          className="max-w-md"
        />
        {caps.canCreate && (
          <Button onClick={openCreate} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Add Class
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Class</th>
                <th className="text-left p-3 font-medium">Subjects</th>
                <th className="text-left p-3 font-medium">Status</th>
                {(caps.canEdit || caps.canDelete) && <th className="text-right p-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!isLoading && classes.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No classes yet</td></tr>
              )}
              {classes.map((c) => (
                <tr
                  key={c._id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => navigate(classDetailHref(role, c._id))}
                >
                  <td className="p-3 font-medium text-primary">
                    {c.className}
                  </td>
                  <td className="p-3">{c.totalSubjects}</td>
                  <td className="p-3">
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                      c.status === "active" ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                    }`}>{c.status}</span>
                  </td>
                  {(caps.canEdit || caps.canDelete) && (
                    <td className="p-3 text-right space-x-1">
                      {caps.canEdit && (
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(c); }} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {caps.canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete class "${c.className}"?`)) delMut.mutate(c._id);
                          }}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit ? "Edit Class" : "New Class"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Class name</Label>
              <Input value={form.className} onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))} placeholder="e.g. 9th" required />
            </div>
            <div>
              <Label>Status</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "active" | "inactive" }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!form.className.trim() || saveMut.isPending} onClick={() => saveMut.mutate()}>
              {saveMut.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
