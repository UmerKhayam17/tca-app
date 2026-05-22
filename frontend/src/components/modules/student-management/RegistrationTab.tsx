import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
  type AcademyStudent,
} from "@/lib/studentManagementApi";
import { classLabel, formatPkr } from "./studentDisplayUtils";

export default function RegistrationTab({
  caps,
  routes: routesProp,
  heading = "Enrolled students",
  registerLabel = "Register student",
  emptyHint = "No students enrolled yet.",
}: {
  caps: ModuleActionCaps;
  routes?: AcademyStudentRoutes;
  heading?: string;
  registerLabel?: string;
  emptyHint?: string;
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
    queryKey: ["academy-classes"],
    queryFn: () => fetchAcademyClasses({ status: "active" }),
  });

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
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <h2 className="font-display text-lg font-semibold text-primary">{heading}</h2>
        <div className="flex flex-wrap gap-2 items-center">
          {caps.canCreate && (
            <Button className="gap-2" asChild>
              <Link to={registerHref}>
                <Plus className="h-4 w-4" /> {registerLabel}
              </Link>
            </Button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 w-48"
              placeholder="Search name, ID, phone…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
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
