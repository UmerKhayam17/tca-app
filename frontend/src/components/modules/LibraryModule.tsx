import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Store, useStore, newId, Book } from "@/lib/store";
import { ModuleActionCaps, PermLevel } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import PanelToolbar from "@/components/modules/PanelToolbar";
import { matchesPanelSearch } from "@/lib/panelSearch";

const empty: Book = { id: "", title: "", author: "", copies: 1, available: 1 };

const LibraryModule = ({ perm: _perm, caps }: { perm: PermLevel; caps: ModuleActionCaps }) => {
  const books = useStore(() => Store.listBooks());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Book>(empty);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const booksFiltered = useMemo(() => {
    if (!search.trim()) return books;
    return books.filter((b) => matchesPanelSearch(search, b.title, b.author, b.copies, b.available));
  }, [books, search]);

  const save = () => {
    if (!caps.canCreate) return;
    if (!editing.title.trim()) return;
    Store.saveBooks([{ ...editing, id: newId() }, ...Store.listBooks()]);
    toast({ title: "Book added" });
    setOpen(false); setEditing(empty);
  };

  const issue = (id: string) => {
    Store.saveBooks(Store.listBooks().map((b) =>
      b.id === id && b.available > 0 ? { ...b, available: b.available - 1 } : b,
    ));
    toast({ title: "Book issued" });
  };

  const ret = (id: string) => {
    Store.saveBooks(Store.listBooks().map((b) =>
      b.id === id && b.available < b.copies ? { ...b, available: b.available + 1 } : b,
    ));
    toast({ title: "Book returned" });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <PanelToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search title or author…">
        {caps.canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="hero"><Plus className="h-4 w-4" /> Add Book</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Book</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Title</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
                <div><Label>Author</Label><Input value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} /></div>
                <div><Label>Copies</Label><Input type="number" value={editing.copies} onChange={(e) => setEditing({ ...editing, copies: Number(e.target.value), available: Number(e.target.value) })} /></div>
              </div>
              <DialogFooter><Button onClick={save} variant="hero">Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </PanelToolbar>

      {booksFiltered.length === 0 ? (
        <p className="text-sm text-center text-muted-foreground py-8">No books match your search.</p>
      ) : (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {booksFiltered.map((b) => (
          <Card key={b.id} className="p-4 space-y-2">
            <div className="font-semibold text-primary">{b.title}</div>
            <div className="text-xs text-muted-foreground">by {b.author}</div>
            <div className="text-sm">Available: <span className="font-semibold text-accent">{b.available}</span> / {b.copies}</div>
            {caps.canEdit && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => issue(b.id)} disabled={b.available === 0}>Issue</Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => ret(b.id)} disabled={b.available === b.copies}>Return</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
      )}
    </div>
  );
};

export default LibraryModule;
