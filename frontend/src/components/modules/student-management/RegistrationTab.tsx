import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ModuleActionCaps } from "@/lib/permissions";
import {
  exportStudentsCsv, fetchAcademyClasses, fetchAcademyStudents, fetchSubjectsByClass,
  previewFees, registerAcademyStudent, type AcademyStudent, type FeePreview,
} from "@/lib/studentManagementApi";

function classLabel(c: AcademyStudent["classId"]) {
  return typeof c === "object" && c && "className" in c ? c.className : "—";
}

export default function RegistrationTab({ caps }: { caps: ModuleActionCaps }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    studentName: "",
    fatherName: "",
    phone: "",
    gender: "male",
    address: "",
    classId: "",
    isFullPackage: false,
    selectedSubjects: [] as string[],
  });
  const [feePreview, setFeePreview] = useState<FeePreview | null>(null);

  const { data: classes = [] } = useQuery({
    queryKey: ["academy-classes"],
    queryFn: () => fetchAcademyClasses({ status: "active" }),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["academy-subjects", form.classId],
    queryFn: () => fetchSubjectsByClass(form.classId),
    enabled: Boolean(form.classId) && !form.isFullPackage,
  });

  const { data: listData, isLoading } = useQuery({
    queryKey: ["academy-students", page, search, classFilter],
    queryFn: () => fetchAcademyStudents({ page, limit: 15, search: search || undefined, classId: classFilter || undefined }),
  });

  useEffect(() => {
    if (!form.classId) {
      setFeePreview(null);
      return;
    }
    if (!form.isFullPackage && form.selectedSubjects.length === 0) {
      setFeePreview(null);
      return;
    }
    const t = setTimeout(() => {
      previewFees({
        classId: form.classId,
        selectedSubjects: form.selectedSubjects,
        isFullPackage: form.isFullPackage,
      })
        .then(setFeePreview)
        .catch(() => setFeePreview(null));
    }, 300);
    return () => clearTimeout(t);
  }, [form.classId, form.selectedSubjects, form.isFullPackage]);

  const registerMut = useMutation({
    mutationFn: () =>
      registerAcademyStudent({
        studentName: form.studentName,
        fatherName: form.fatherName,
        phone: form.phone,
        gender: form.gender,
        address: form.address,
        classId: form.classId,
        selectedSubjects: form.selectedSubjects,
        isFullPackage: form.isFullPackage,
      }),
    onSuccess: (student) => {
      qc.invalidateQueries({ queryKey: ["academy-students"] });
      toast({ title: "Student registered", description: `ID: ${student.studentId}` });
      setForm({
        studentName: "", fatherName: "", phone: "", gender: "male", address: "",
        classId: "", isFullPackage: false, selectedSubjects: [],
      });
      setFeePreview(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleSubject = (id: string) => {
    setForm((f) => ({
      ...f,
      selectedSubjects: f.selectedSubjects.includes(id)
        ? f.selectedSubjects.filter((x) => x !== id)
        : [...f.selectedSubjects, id],
    }));
  };

  const handleExport = async () => {
    try {
      const blob = await exportStudentsCsv({ search: search || undefined, classId: classFilter || undefined });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "academy-students.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const students = listData?.students ?? [];
  const pagination = listData?.pagination;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {caps.canCreate && (
        <Card className="p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-primary">Register student</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Student name</Label>
              <Input value={form.studentName} onChange={(e) => setForm((f) => ({ ...f, studentName: e.target.value }))} />
            </div>
            <div>
              <Label>Father name</Label>
              <Input value={form.fatherName} onChange={(e) => setForm((f) => ({ ...f, fatherName: e.target.value }))} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Gender</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div>
              <Label>Class</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.classId}
                onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value, selectedSubjects: [] }))}
              >
                <option value="">Select…</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.className}</option>
                ))}
              </select>
            </div>
          </div>

          {form.classId && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="fullPkg"
                  checked={form.isFullPackage}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isFullPackage: Boolean(v), selectedSubjects: [] }))}
                />
                <Label htmlFor="fullPkg" className="cursor-pointer">Enroll in all subjects (full package)</Label>
              </div>
              {!form.isFullPackage && (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {subjects.map((s) => (
                    <label key={s._id} className="flex items-center gap-2 text-sm border rounded-md p-2 cursor-pointer hover:bg-muted/50">
                      <Checkbox
                        checked={form.selectedSubjects.includes(s._id)}
                        onCheckedChange={() => toggleSubject(s._id)}
                      />
                      {s.subjectName}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {feePreview && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 grid sm:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Monthly fee</span>
                <p className="font-bold text-lg">₨ {feePreview.monthlyFee.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Admission fee</span>
                <p className="font-bold text-lg">₨ {feePreview.admissionFee.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total payable</span>
                <p className="font-bold text-lg text-accent">₨ {feePreview.totalFee.toLocaleString()}</p>
              </div>
            </div>
          )}

          <Button
            disabled={
              registerMut.isPending || !form.studentName || !form.fatherName || !form.phone || !form.classId
              || (!form.isFullPackage && form.selectedSubjects.length === 0)
            }
            onClick={() => registerMut.mutate()}
          >
            {registerMut.isPending ? "Registering…" : "Register & enroll"}
          </Button>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-semibold text-primary">Enrolled students</h2>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 w-48" placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Class</th>
                  <th className="text-left p-3">Monthly</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
                )}
                {students.map((s) => (
                  <tr key={s._id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{s.studentId}</td>
                    <td className="p-3">{s.studentName}</td>
                    <td className="p-3">{classLabel(s.classId)}</td>
                    <td className="p-3">₨ {s.monthlyFee?.toLocaleString()}</td>
                    <td className="p-3">{s.status}</td>
                  </tr>
                ))}
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
    </div>
  );
}
