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
import { fetchUsers } from "@/lib/usersApi";
import { createTeacherProfile, deleteTeacherProfile, fetchTeacherProfiles } from "@/lib/timetableApi";

const QK = (sid: string) => ["timetable-teacher-profiles", sid] as const;

export default function TeacherProfilesTab({ sessionId, caps }: { sessionId: string; caps: ModuleActionCaps }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [maxDay, setMaxDay] = useState(6);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: QK(sessionId),
    queryFn: () => fetchTeacherProfiles(sessionId),
    enabled: !!sessionId,
  });

  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  const teachers = users.filter((u) => {
    const roleName = typeof u.role === "object" && u.role?.name ? u.role.name : "";
    return roleName === "teacher" || roleName === "admin";
  });

  const saveMut = useMutation({
    mutationFn: () => createTeacherProfile({ user: userId, session: sessionId, maxLecturesPerDay: maxDay }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(sessionId) });
      setOpen(false);
      toast({ title: "Teacher profile created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const delMut = useMutation({
    mutationFn: deleteTeacherProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(sessionId) });
      toast({ title: "Profile removed" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (!sessionId) return <p className="p-6 text-muted-foreground text-sm">Select a session above.</p>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {caps.canCreate && (
        <Button className="gap-2" onClick={() => { setUserId(""); setMaxDay(6); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Add teacher profile
        </Button>
      )}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left p-3">Teacher</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Max/day</th>
              {caps.canDelete && <th className="text-right p-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
            {profiles.map((p) => (
              <tr key={p._id} className="border-b">
                <td className="p-3 font-medium">{p.user.name}</td>
                <td className="p-3 text-muted-foreground">{p.user.email}</td>
                <td className="p-3">{p.maxLecturesPerDay}</td>
                {caps.canDelete && (
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => confirm("Remove profile?") && delMut.mutate(p._id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Teacher profile</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Teacher</Label>
              <select className="w-full h-10 rounded-md border px-3 text-sm" value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">Select teacher</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Max lectures per day</Label>
              <Input type="number" min={1} value={maxDay} onChange={(e) => setMaxDay(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!userId || saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


