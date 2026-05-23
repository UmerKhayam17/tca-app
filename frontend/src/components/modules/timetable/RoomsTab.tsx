import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ModuleActionCaps } from "@/lib/permissions";
import { createRoom, deleteRoom, fetchRooms, updateRoom, type Room } from "@/lib/timetableApi";
import PanelSearchBar from "@/components/modules/PanelSearchBar";
import { usePanelListSearch } from "@/hooks/usePanelListSearch";

const QK = (sid: string) => ["timetable-rooms", sid] as const;

export default function RoomsTab({ sessionId, caps }: { sessionId: string; caps: ModuleActionCaps }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Room | null>(null);
  const [form, setForm] = useState({ name: "", code: "", capacity: 35, type: "classroom" });

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: QK(sessionId),
    queryFn: () => fetchRooms(sessionId),
    enabled: !!sessionId,
  });

  const { search, setSearch, filtered: roomsFiltered } = usePanelListSearch(rooms, (r) => [
    r.code,
    r.name,
    r.type,
    r.capacity,
  ]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (edit) return updateRoom(edit._id, form);
      return createRoom({ session: sessionId, ...form });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(sessionId) });
      setOpen(false);
      toast({ title: edit ? "Room updated" : "Room created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const delMut = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(sessionId) });
      toast({ title: "Room deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (!sessionId) {
    return <p className="p-6 text-muted-foreground text-sm">Select an academic session above.</p>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <PanelSearchBar value={search} onChange={setSearch} placeholder="Search code, name, type…" className="max-w-md" />
        {caps.canCreate && (
          <Button
            className="gap-2 shrink-0"
            onClick={() => {
              setEdit(null);
              setForm({ name: "", code: "", capacity: 35, type: "classroom" });
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add room
          </Button>
        )}
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left p-3">Code</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Capacity</th>
              {(caps.canEdit || caps.canDelete) && <th className="text-right p-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && roomsFiltered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  {rooms.length === 0 ? "No rooms" : "No rooms match your search."}
                </td>
              </tr>
            )}
            {roomsFiltered.map((r) => (
              <tr key={r._id} className="border-b last:border-0">
                <td className="p-3 font-mono text-xs">{r.code}</td>
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3 capitalize">{r.type}</td>
                <td className="p-3">{r.capacity}</td>
                {(caps.canEdit || caps.canDelete) && (
                  <td className="p-3 text-right space-x-1">
                    {caps.canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEdit(r);
                          setForm({ name: r.name, code: r.code, capacity: r.capacity, type: r.type });
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {caps.canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirm("Delete room?") && delMut.mutate(r._id)}
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
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit ? "Edit room" : "New room"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Type</Label>
              <select
                className="w-full h-10 rounded-md border px-3 text-sm"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="classroom">Classroom</option>
                <option value="lab">Lab</option>
                <option value="hall">Hall</option>
                <option value="computer">Computer lab</option>
              </select>
            </div>
            <div>
              <Label>Capacity</Label>
              <Input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!form.name || !form.code || saveMut.isPending} onClick={() => saveMut.mutate()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}




