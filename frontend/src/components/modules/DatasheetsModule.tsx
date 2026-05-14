import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Download, FileSpreadsheet, ArrowLeft, Save } from "lucide-react";
import { canWrite, canCRUD, PermLevel } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";

const KEY = "tces_datasheets_v1";
const EVT = "tces-datasheets-change";

export interface Datasheet {
  id: string;
  name: string;
  columns: string[];
  rows: string[][];
  updatedAt: number;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const load = (): Datasheet[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};
const save = (v: Datasheet[]) => {
  localStorage.setItem(KEY, JSON.stringify(v));
  window.dispatchEvent(new Event(EVT));
};

const seedIfEmpty = () => {
  if (localStorage.getItem(KEY)) return;
  const seed: Datasheet[] = [
    {
      id: uid(),
      name: "Class 10-A Roster",
      columns: ["Roll No", "Name", "Guardian", "Phone", "Remarks"],
      rows: [
        ["01", "Ahmed Raza", "Bilal Ahmed", "0300-1234567", ""],
        ["02", "Fatima Noor", "Imran Noor", "0300-2234567", ""],
        ["03", "Bilal Khan", "Asif Khan", "0300-3234567", ""],
      ],
      updatedAt: Date.now(),
    },
  ];
  save(seed);
};

const toCSV = (s: Datasheet) => {
  const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  return [s.columns.map(esc).join(","), ...s.rows.map((r) => r.map(esc).join(","))].join("\n");
};

const downloadCSV = (s: Datasheet) => {
  const blob = new Blob([toCSV(s)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${s.name.replace(/\s+/g, "_")}.csv`;
  a.click(); URL.revokeObjectURL(url);
};

const DatasheetsModule = ({ perm }: { perm: PermLevel }) => {
  const { toast } = useToast();
  const writable = canWrite(perm);
  const crud = canCRUD(perm);

  const [sheets, setSheets] = useState<Datasheet[]>(() => { seedIfEmpty(); return load(); });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCols, setNewCols] = useState("Name, Email, Phone");
  const [newRowCount, setNewRowCount] = useState(5);

  useEffect(() => {
    const sync = () => setSheets(load());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, []);

  const persist = (next: Datasheet[]) => { setSheets(next); save(next); };

  const createSheet = () => {
    const cols = newCols.split(",").map((c) => c.trim()).filter(Boolean);
    if (!newName.trim() || cols.length === 0) {
      toast({ title: "Name and at least one column required", variant: "destructive" });
      return;
    }
    const sheet: Datasheet = {
      id: uid(), name: newName.trim(), columns: cols,
      rows: Array.from({ length: Math.max(1, newRowCount) }, () => cols.map(() => "")),
      updatedAt: Date.now(),
    };
    persist([sheet, ...sheets]);
    setCreating(false); setNewName(""); setNewCols("Name, Email, Phone"); setNewRowCount(5);
    setActiveId(sheet.id);
    toast({ title: "Datasheet created" });
  };

  const deleteSheet = (id: string) => {
    if (!confirm("Delete this datasheet?")) return;
    persist(sheets.filter((s) => s.id !== id));
    if (activeId === id) setActiveId(null);
    toast({ title: "Deleted" });
  };

  const updateActive = (mut: (s: Datasheet) => Datasheet) => {
    persist(sheets.map((s) => (s.id === activeId ? { ...mut(s), updatedAt: Date.now() } : s)));
  };

  const active = sheets.find((s) => s.id === activeId);

  // -------- LIST VIEW --------
  if (!active) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-xl font-bold text-primary">My Datasheets</h2>
            <p className="text-sm text-muted-foreground">Create custom spreadsheets for any data you need.</p>
          </div>
          {crud && (
            <Button onClick={() => setCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" /> New Datasheet
            </Button>
          )}
        </div>

        {sheets.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-accent" />
            No datasheets yet. Click "New Datasheet" to get started.
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {sheets.map((s) => (
              <Card key={s.id} className="p-4 hover:shadow-elegant transition-smooth">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 grid place-items-center shrink-0">
                    <FileSpreadsheet className="h-5 w-5 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => setActiveId(s.id)} className="font-semibold text-primary hover:underline text-left truncate block w-full">
                      {s.name}
                    </button>
                    <div className="text-xs text-muted-foreground mt-1">
                      {s.columns.length} cols · {s.rows.length} rows
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Updated {new Date(s.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => setActiveId(s.id)}>Open</Button>
                  <Button size="sm" variant="outline" onClick={() => downloadCSV(s)} className="gap-1">
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                  {crud && (
                    <Button size="sm" variant="ghost" onClick={() => deleteSheet(s.id)} className="ml-auto text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Datasheet</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Sheet name</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Trip Permission Slips" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Columns (comma-separated)</label>
                <Input value={newCols} onChange={(e) => setNewCols(e.target.value)} placeholder="Name, Email, Phone" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Initial rows</label>
                <Input type="number" min={1} max={200} value={newRowCount}
                  onChange={(e) => setNewRowCount(Number(e.target.value) || 1)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
              <Button onClick={createSheet}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // -------- EDITOR VIEW --------
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="outline" size="sm" onClick={() => setActiveId(null)} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {writable ? (
            <Input value={active.name}
              onChange={(e) => updateActive((s) => ({ ...s, name: e.target.value }))}
              className="h-9 max-w-xs font-semibold" />
          ) : (
            <h2 className="font-semibold text-primary truncate">{active.name}</h2>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => downloadCSV(active)} className="gap-1">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          {writable && (
            <>
              <Button size="sm" variant="outline" onClick={() => updateActive((s) => ({
                ...s, columns: [...s.columns, `Col ${s.columns.length + 1}`],
                rows: s.rows.map((r) => [...r, ""]),
              }))} className="gap-1">
                <Plus className="h-4 w-4" /> Column
              </Button>
              <Button size="sm" onClick={() => updateActive((s) => ({
                ...s, rows: [...s.rows, s.columns.map(() => "")],
              }))} className="gap-1">
                <Plus className="h-4 w-4" /> Row
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-secondary/60">
              <tr>
                <th className="w-10 px-2 py-2 text-xs text-muted-foreground border-b border-border">#</th>
                {active.columns.map((c, ci) => (
                  <th key={ci} className="px-2 py-2 border-b border-border min-w-[140px] text-left">
                    {writable ? (
                      <div className="flex items-center gap-1">
                        <Input value={c} className="h-8 font-semibold"
                          onChange={(e) => updateActive((s) => {
                            const cols = [...s.columns]; cols[ci] = e.target.value; return { ...s, columns: cols };
                          })} />
                        {crud && active.columns.length > 1 && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0"
                            onClick={() => updateActive((s) => ({
                              ...s, columns: s.columns.filter((_, i) => i !== ci),
                              rows: s.rows.map((r) => r.filter((_, i) => i !== ci)),
                            }))}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ) : <span className="font-semibold text-primary">{c}</span>}
                  </th>
                ))}
                {writable && <th className="w-10 border-b border-border"></th>}
              </tr>
            </thead>
            <tbody>
              {active.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-border hover:bg-muted/30">
                  <td className="px-2 py-1 text-xs text-muted-foreground text-center">{ri + 1}</td>
                  {active.columns.map((_, ci) => (
                    <td key={ci} className="px-1 py-1">
                      {writable ? (
                        <Input value={row[ci] ?? ""} className="h-8 border-transparent hover:border-input focus:border-input"
                          onChange={(e) => updateActive((s) => {
                            const rows = s.rows.map((r) => [...r]);
                            rows[ri][ci] = e.target.value;
                            return { ...s, rows };
                          })} />
                      ) : <span className="px-2">{row[ci]}</span>}
                    </td>
                  ))}
                  {writable && (
                    <td className="px-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => updateActive((s) => ({ ...s, rows: s.rows.filter((_, i) => i !== ri) }))}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
              {active.rows.length === 0 && (
                <tr><td colSpan={active.columns.length + 2} className="text-center text-muted-foreground py-6">No rows. Click "Row" to add one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {writable && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Save className="h-3 w-3" /> Changes auto-save to your browser.
        </p>
      )}
    </div>
  );
};

export default DatasheetsModule;
