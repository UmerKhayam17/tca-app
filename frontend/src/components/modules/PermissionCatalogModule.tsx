import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { fetchPermissionCatalog, type PermissionDefinition } from "@/lib/staffApi";
import { moduleHref } from "@/lib/panelMenus";
import type { Role } from "@/lib/auth";

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

  const sorted = useMemo(() => sortRows(rows), [rows]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Card className="p-4 border-dashed">
        <div className="text-sm font-semibold text-primary mb-1">All API permissions</div>
        <p className="text-xs text-muted-foreground">
          Complete list of permission records in the database (name, module, action). Assign these to users on the{" "}
          <Link to={moduleHref(role, "permissions")} className="text-accent underline-offset-2 hover:underline">
            Permissions
          </Link>{" "}
          page.
        </p>
      </Card>

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
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No permissions returned from the server.
                  </td>
                </tr>
              ) : (
                sorted.map((p) => (
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
