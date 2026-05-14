import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { Store, useStore, newId, Announcement } from "@/lib/store";
import { canCRUD, PermLevel } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";

const AnnouncementsModule = ({ perm }: { perm: PermLevel }) => {
  const list = useStore(() => Store.listAnnouncements()).slice().sort((a, b) => b.ts - a.ts);
  const writable = canCRUD(perm);
  const [draft, setDraft] = useState<Announcement>({ id: "", title: "", body: "", audience: "all", ts: 0 });
  const { toast } = useToast();

  const publish = () => {
    if (!draft.title.trim()) return;
    Store.saveAnnouncements([{ ...draft, id: newId(), ts: Date.now() }, ...Store.listAnnouncements()]);
    toast({ title: "Announcement published" });
    setDraft({ id: "", title: "", body: "", audience: "all", ts: 0 });
  };

  const remove = (id: string) => Store.saveAnnouncements(Store.listAnnouncements().filter((a) => a.id !== id));

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {writable && (
        <Card className="p-4 space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2"><Label>Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
            <div>
              <Label>Audience</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value as any })}>
                <option value="all">Everyone</option>
                <option value="staff">Staff</option>
                <option value="teachers">Teachers</option>
                <option value="parents">Parents</option>
              </select>
            </div>
          </div>
          <div><Label>Message</Label><Textarea rows={3} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></div>
          <div className="text-right"><Button variant="hero" onClick={publish}><Plus className="h-4 w-4" /> Publish</Button></div>
        </Card>
      )}

      <div className="space-y-3">
        {list.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-accent uppercase tracking-wider">{a.audience}</div>
                <div className="font-semibold text-primary">{a.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{a.body}</div>
                <div className="text-[11px] text-muted-foreground mt-2">{new Date(a.ts).toLocaleString()}</div>
              </div>
              {writable && <Button size="sm" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementsModule;
