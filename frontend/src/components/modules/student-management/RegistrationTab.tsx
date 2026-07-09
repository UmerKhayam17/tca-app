import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import PanelSearchBar from "@/components/modules/PanelSearchBar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { ModuleActionCaps } from "@/lib/permissions";
import {
  academyStudentRoutes,
  type AcademyStudentRoutes,
} from "@/lib/studentManagementMenus";
import {
  deleteAcademyStudent,
  exportStudentsCsv,
  fetchAcademyClasses,
  fetchAcademyStudents,
  fetchSectionsByClass,
  type AcademyStudent,
} from "@/lib/studentManagementApi";
import { classLabel, formatPkr } from "./studentDisplayUtils";

export default function RegistrationTab({
  caps,
  routes: routesProp,
  sessionId = "",
  heading = "Enrolled students",
  registerLabel = "Register student",
  emptyHint = "No students enrolled yet.",
  showHeading = true,
}: {
  caps: ModuleActionCaps;
  routes?: AcademyStudentRoutes;
  sessionId?: string;
  heading?: string;
  registerLabel?: string;
  emptyHint?: string;
  /** Hide when the panel module header already shows the page title */
  showHeading?: boolean;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [page, setPage] = useState(1);

  const routes =
    routesProp ?? (user?.role ? academyStudentRoutes(user.role, "registration") : null);
  const registerHref = routes?.new ?? "#";
  const hasActions = caps.canView || caps.canEdit || caps.canDelete;
  const colSpan = hasActions ? 7 : 6;

  const { data: classes = [] } = useQuery({
    queryKey: ["academy-classes", sessionId],
    queryFn: () => fetchAcademyClasses({ status: "active", sessionId: sessionId || undefined }),
    enabled: Boolean(sessionId),
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["academy-registration-sections", sessionId, classes.map((c) => c._id).join(",")],
    queryFn: async () => {
      const lists = await Promise.all(classes.map((c) => fetchSectionsByClass(c._id, { status: "active" })));
      return lists.flat();
    },
    enabled: classes.length > 0,
  });

  const canRegister = Boolean(sessionId) && classes.length > 0 && sections.length > 0;

  const { data: listData, isLoading } = useQuery({
    queryKey: ["academy-students", page, search, classFilter],
    queryFn: () => fetchAcademyStudents({ page, limit: 15, search: search || undefined, classId: classFilter || undefined }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAcademyStudent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy-students"] });
      toast({ title: "Student deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleExport = async () => {
    try {
      const blob = await exportStudentsCsv({ search: search || undefined, classId: classFilter || undefined });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "academy-students.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const handleDelete = (s: AcademyStudent) => {
    if (!confirm(`Delete student "${s.studentName}" (${s.studentId})? This cannot be undone.`)) return;
    deleteMut.mutate(s._id);
  };

  const students = listData?.students ?? [];
  const pagination = listData?.pagination;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 space-y-3">
      <div
        className={
          showHeading
            ? "flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between border-b pb-3"
            : "flex flex-col lg:flex-row gap-2 lg:items-center lg:justify-end border-b pb-3"
        }
      >
        {showHeading && (
          <h2 className="font-display text-base font-semibold text-primary shrink-0">{heading}</h2>
        )}
        <div className="flex flex-wrap gap-2 items-center sm:ml-auto">
          {caps.canCreate && (
            canRegister ? (
              <Button className="gap-2" asChild>
                <Link to={registerHref}>
                  <Plus className="h-4 w-4" /> {registerLabel}
                </Link>
              </Button>
            ) : (
              <Button className="gap-2" disabled title="Create session, class, and section first">
                <Plus className="h-4 w-4" /> {registerLabel}
              </Button>
            )
          )}
          <PanelSearchBar
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search name, ID, phone…"
            className="w-48 max-w-none flex-none"
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.className}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" className="gap-1" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">ID</th>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Father</th>
                <th className="text-left p-3 font-medium">Class</th>
                <th className="text-left p-3 font-medium">Monthly</th>
                <th className="text-left p-3 font-medium">Status</th>
                {hasActions && <th className="text-right p-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={colSpan} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!isLoading && students.length === 0 && (
                <tr>
                  <td colSpan={colSpan} className="p-8 text-center text-muted-foreground">
                    {emptyHint}
                    {caps.canCreate && (
                      <>
                        {" "}
                        <Link to={registerHref} className="text-primary underline-offset-2 hover:underline">
                          {registerLabel}
                        </Link>
                      </>
                    )}
                  </td>
                </tr>
              )}
              {students.map((s) => {
                const viewHref = routes ? routes.detail(s._id) : "#";
                const editHref = routes ? routes.edit(s._id) : "#";
                return (
                  <tr key={s._id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{s.studentId}</td>
                    <td className="p-3 font-medium">{s.studentName}</td>
                    <td className="p-3">{s.fatherName}</td>
                    <td className="p-3">{classLabel(s.classId)}</td>
                    <td className="p-3">{formatPkr(s.monthlyFee)}</td>
                    <td className="p-3 capitalize">{s.status}</td>
                    {hasActions && (
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          {caps.canView && (
                            <Button variant="ghost" size="icon" asChild aria-label="View student">
                              <Link to={viewHref}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          {caps.canEdit && (
                            <Button variant="ghost" size="icon" asChild aria-label="Edit student">
                              <Link to={editHref}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          {caps.canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Delete student"
                              disabled={deleteMut.isPending}
                              onClick={() => handleDelete(s)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <span className="text-sm self-center">Page {page} / {pagination.pages}</span>
            <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
