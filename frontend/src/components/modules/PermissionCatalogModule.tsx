import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchPermissionCatalog, type PermissionDefinition } from "@/lib/staffApi";
import type { Role } from "@/lib/auth";
import PanelSearchBar from "@/components/modules/PanelSearchBar";
import { matchesPanelSearch } from "@/lib/panelSearch";

const PERM_CATALOG_QUERY = ["permissionCatalog"] as const;

function sortRows(rows: PermissionDefinition[]): PermissionDefinition[] {
  return [...rows].sort((a, b) => {
    const ma = String(a.module).localeCompare(String(b.module));
    if (ma !== 0) return ma;
    return String(a.name).localeCompare(String(b.name));
  });
}

/**
 * Full-page table of every API permission row from `GET /api/v1/permissions` (no modal).
 */
const PermissionCatalogModule = ({ role }: { role: Role }) => {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: PERM_CATALOG_QUERY,
    queryFn: fetchPermissionCatalog,
  });

  const [search, setSearch] = useState("");
  const sorted = useMemo(() => sortRows(rows), [rows]);
  const sortedFiltered = useMemo(() => {
    if (!search.trim()) return sorted;
    return sorted.filter((p) =>
      matchesPanelSearch(search, p.name, p.module, p.action, p.description)
    );
  }, [sorted, search]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <PanelSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search permission name, module, action…"
        className="max-w-md"
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Name</th>
                <th className="text-left font-medium px-4 py-3">Module</th>
                <th className="text-left font-medium px-4 py-3">Action</th>
                <th className="text-left font-medium px-4 py-3 min-w-[220px]">Description</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : sortedFiltered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    {sorted.length === 0 ? "No permissions returned from the server." : "No permissions match your search."}
                  </td>
                </tr>
              ) : (
                sortedFiltered.map((p) => (
                  <tr key={p._id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono text-xs text-primary whitespace-nowrap">{p.name}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{p.module}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.action}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs leading-snug">
                      {p.description || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default PermissionCatalogModule;
