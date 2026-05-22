import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  GraduationCap,
  Globe,
  Heart,
  Home,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Plus,
  School,
  Smartphone,
  Tag,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { ModuleActionCaps } from "@/lib/permissions";
import {
  academyStudentRoutes,
  type AcademyStudentRoutes,
} from "@/lib/studentManagementMenus";
import {
  fetchAcademyClasses,
  fetchSubjectsByClass,
  getAcademyStudent,
  previewFees,
  registerAcademyStudent,
  updateAcademyStudent,
  type FeePreview,
} from "@/lib/studentManagementApi";
import {
  buildStudentPayload,
  defaultRegisterForm,
  emptyAcademicRow,
  mapStudentToForm,
  type AcademicRow,
} from "./registerStudentForm";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-primary border-b pb-1">{children}</h3>;
}

function FormField({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function IconInput({
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className={cn("pl-9", className)} {...props} />
    </div>
  );
}

function IconTextarea({
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<typeof Textarea> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Textarea className={cn("pl-9 min-h-[80px]", className)} {...props} />
    </div>
  );
}

function IconSelect({
  icon: Icon,
  className,
  children,
  ...props
}: React.ComponentProps<"select"> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <select
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export default function RegisterStudentPage({
  caps,
  studentId,
  routes: routesProp,
}: {
  caps: ModuleActionCaps;
  studentId?: string;
  routes?: AcademyStudentRoutes;
}) {
  const isEdit = Boolean(studentId);
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState(defaultRegisterForm);
  const [feePreview, setFeePreview] = useState<FeePreview | null>(null);
  const [formReady, setFormReady] = useState(!isEdit);

  const routes =
    routesProp ?? (user?.role ? academyStudentRoutes(user.role, "registration") : null);
  const listHref = routes?.list ?? "..";
  const detailHref = studentId && routes ? routes.detail(studentId) : listHref;
  const listBackLabel = routes?.list.includes("/students")
    ? "Back to student records"
    : "Back to registration";

  const { data: existingStudent, isLoading: loadingStudent } = useQuery({
    queryKey: ["academy-student", studentId],
    queryFn: () => getAcademyStudent(studentId!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingStudent) {
      setForm(mapStudentToForm(existingStudent));
      setFormReady(true);
    }
  }, [existingStudent]);

  const { data: classes = [] } = useQuery({
    queryKey: ["academy-classes"],
    queryFn: () => fetchAcademyClasses({ status: "active" }),
  });

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ["academy-subjects", form.classId],
    queryFn: () => fetchSubjectsByClass(form.classId, { status: "active" }),
    enabled: Boolean(form.classId),
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
        discountAmount: Number(form.discountAmount) || 0,
      })
        .then(setFeePreview)
        .catch(() => setFeePreview(null));
    }, 300);
    return () => clearTimeout(t);
  }, [form.classId, form.selectedSubjects, form.isFullPackage, form.discountAmount]);

  const saveMut = useMutation({
    mutationFn: () => {
      const body = buildStudentPayload(form);
      if (isEdit && studentId) return updateAcademyStudent(studentId, body);
      return registerAcademyStudent(body);
    },
    onSuccess: (student) => {
      qc.invalidateQueries({ queryKey: ["academy-students"] });
      qc.invalidateQueries({ queryKey: ["academy-student", studentId] });
      if (isEdit) {
        toast({ title: "Student updated" });
        navigate(detailHref);
      } else {
        toast({ title: "Student registered", description: `ID: ${student.studentId}` });
        navigate(listHref);
      }
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleSubject = (id: string) => {
    setForm((f) => ({
      ...f,
      isFullPackage: false,
      selectedSubjects: f.selectedSubjects.includes(id)
        ? f.selectedSubjects.filter((x) => x !== id)
        : [...f.selectedSubjects, id],
    }));
  };

  const selectFullPackage = (checked: boolean) => {
    setForm((f) => ({
      ...f,
      isFullPackage: checked,
      selectedSubjects: checked ? [] : f.selectedSubjects,
    }));
  };

  const updateAcademic = (index: number, patch: Partial<AcademicRow>) => {
    setForm((f) => ({
      ...f,
      academicHistory: f.academicHistory.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  };

  const subjectSelectionValid = form.isFullPackage || form.selectedSubjects.length > 0;
  const canSubmit =
    form.studentName.trim()
    && form.fatherName.trim()
    && form.dateOfBirth
    && form.mobileNo.trim()
    && form.classId
    && subjectSelectionValid;

  const selectedClassName = classes.find((c) => c._id === form.classId)?.className;

  if (isEdit && (loadingStudent || !formReady)) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12 text-center text-muted-foreground">
        Loading student…
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-2" asChild>
            <Link to={isEdit ? detailHref : listHref}>
              <ArrowLeft className="h-4 w-4" /> {isEdit ? "Back to student" : listBackLabel}
            </Link>
          </Button>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-primary">
            {isEdit ? "Edit student" : "Register new student"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? `Update profile and enrollment for ${existingStudent?.studentId || "student"}.`
              : "Complete the admission form, select class and subjects, then enroll."}
          </p>
        </div>
      </div>

      <div className="space-y-10">
        <section className="space-y-4 pb-10 border-b">
          <SectionTitle>1. Student information</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Student name" required>
              <IconInput
                icon={User}
                placeholder="e.g. Ali Ahmed Khan"
                value={form.studentName}
                onChange={(e) => setForm((f) => ({ ...f, studentName: e.target.value }))}
              />
            </FormField>
            <FormField label="Father's name" required>
              <IconInput
                icon={Users}
                placeholder="e.g. Muhammad Ahmed Khan"
                value={form.fatherName}
                onChange={(e) => setForm((f) => ({ ...f, fatherName: e.target.value }))}
              />
            </FormField>
            <FormField label="Date of birth" required>
              <IconInput
                icon={Calendar}
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
              />
            </FormField>
            <FormField label="Nationality">
              <IconInput
                icon={Globe}
                placeholder="Pakistan"
                value={form.nationality}
                onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))}
              />
            </FormField>
            <FormField label="Gender" required>
              <IconSelect
                icon={Users}
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </IconSelect>
            </FormField>
            <FormField label="Student email">
              <IconInput
                icon={Mail}
                type="email"
                placeholder="student@email.com"
                value={form.studentEmail}
                onChange={(e) => setForm((f) => ({ ...f, studentEmail: e.target.value }))}
              />
            </FormField>
            {isEdit && (
              <FormField label="Status">
                <IconSelect
                  icon={User}
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as typeof f.status }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </IconSelect>
              </FormField>
            )}
          </div>
        </section>

        <section className="space-y-4 pb-10 border-b">
          <SectionTitle>2. Guardian information</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Guardian name">
              <IconInput
                icon={User}
                placeholder="Guardian full name"
                value={form.guardianName}
                onChange={(e) => setForm((f) => ({ ...f, guardianName: e.target.value }))}
              />
            </FormField>
            <FormField label="Relation with student">
              <IconInput
                icon={Heart}
                placeholder="e.g. Father, Uncle, Mother"
                value={form.guardianRelation}
                onChange={(e) => setForm((f) => ({ ...f, guardianRelation: e.target.value }))}
              />
            </FormField>
            <FormField label="Father / Guardian CNIC no." className="sm:col-span-2 lg:col-span-3">
              <IconInput
                icon={IdCard}
                placeholder="35201-1234567-1"
                value={form.fatherGuardianCnic}
                onChange={(e) => setForm((f) => ({ ...f, fatherGuardianCnic: e.target.value }))}
              />
            </FormField>
            <FormField label="Occupation">
              <IconInput
                icon={Briefcase}
                placeholder="e.g. Business, Teacher"
                value={form.guardianOccupation}
                onChange={(e) => setForm((f) => ({ ...f, guardianOccupation: e.target.value }))}
              />
            </FormField>
            <FormField label="Official / work address">
              <IconInput
                icon={Building2}
                placeholder="Office or workplace address"
                value={form.guardianWorkAddress}
                onChange={(e) => setForm((f) => ({ ...f, guardianWorkAddress: e.target.value }))}
              />
            </FormField>
            <FormField label="Guardian email">
              <IconInput
                icon={Mail}
                type="email"
                placeholder="guardian@email.com"
                value={form.guardianEmail}
                onChange={(e) => setForm((f) => ({ ...f, guardianEmail: e.target.value }))}
              />
            </FormField>
          </div>
        </section>

        <section className="space-y-4 pb-10 border-b">
          <SectionTitle>3. Contact & address</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Mobile no." required>
              <IconInput
                icon={Smartphone}
                type="tel"
                placeholder="03XX-XXXXXXX"
                value={form.mobileNo}
                onChange={(e) => setForm((f) => ({ ...f, mobileNo: e.target.value }))}
              />
            </FormField>
            <FormField label="Contact no. (residence)">
              <IconInput
                icon={Phone}
                type="tel"
                placeholder="042-XXXXXXX"
                value={form.contactPhoneRes}
                onChange={(e) => setForm((f) => ({ ...f, contactPhoneRes: e.target.value }))}
              />
            </FormField>
            <FormField label="Postal address" className="sm:col-span-2 lg:col-span-3">
              <IconTextarea
                icon={MapPin}
                rows={2}
                placeholder="House no., street, area, city"
                value={form.postalAddress}
                onChange={(e) => setForm((f) => ({ ...f, postalAddress: e.target.value }))}
              />
            </FormField>
            <FormField label="Permanent address" className="sm:col-span-2 lg:col-span-3">
              <IconTextarea
                icon={Home}
                rows={2}
                placeholder="Permanent home address (if different)"
                value={form.permanentAddress}
                onChange={(e) => setForm((f) => ({ ...f, permanentAddress: e.target.value }))}
              />
            </FormField>
          </div>
        </section>

        <section className="space-y-4 pb-10 border-b">
          <SectionTitle>4. Previous school / college</SectionTitle>
          <FormField label="Student current school / college">
            <IconInput
              icon={School}
              placeholder="Name of current or last attended school"
              value={form.currentSchoolCollege}
              onChange={(e) => setForm((f) => ({ ...f, currentSchoolCollege: e.target.value }))}
            />
          </FormField>
        </section>

        <section className="space-y-4 pb-10 border-b">
          <div className="flex items-center justify-between gap-2">
            <SectionTitle>5. Academic history</SectionTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setForm((f) => ({ ...f, academicHistory: [...f.academicHistory, emptyAcademicRow()] }))}
            >
              <Plus className="h-3.5 w-3.5" /> Add row
            </Button>
          </div>
          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-2">Institution</th>
                  <th className="text-left p-2">Class</th>
                  <th className="text-left p-2">Total</th>
                  <th className="text-left p-2">Obtained</th>
                  <th className="text-left p-2">%</th>
                  <th className="text-left p-2">Year</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {form.academicHistory.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-1">
                      <Input className="h-8 text-xs" placeholder="School name" value={row.institutionName} onChange={(e) => updateAcademic(i, { institutionName: e.target.value })} />
                    </td>
                    <td className="p-1">
                      <Input className="h-8 text-xs" placeholder="Class" value={row.className} onChange={(e) => updateAcademic(i, { className: e.target.value })} />
                    </td>
                    <td className="p-1">
                      <Input className="h-8 text-xs" type="number" min={0} placeholder="Total" value={row.totalMarks} onChange={(e) => updateAcademic(i, { totalMarks: e.target.value })} />
                    </td>
                    <td className="p-1">
                      <Input className="h-8 text-xs" type="number" min={0} placeholder="Obtained" value={row.obtainedMarks} onChange={(e) => updateAcademic(i, { obtainedMarks: e.target.value })} />
                    </td>
                    <td className="p-1">
                      <Input className="h-8 text-xs" type="number" min={0} max={100} placeholder="%" value={row.percentage} onChange={(e) => updateAcademic(i, { percentage: e.target.value })} />
                    </td>
                    <td className="p-1">
                      <Input className="h-8 text-xs" placeholder="Year" value={row.year} onChange={(e) => updateAcademic(i, { year: e.target.value })} />
                    </td>
                    <td className="p-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setForm((f) => ({
                          ...f,
                          academicHistory: f.academicHistory.length > 1
                            ? f.academicHistory.filter((_, j) => j !== i)
                            : [emptyAcademicRow()],
                        }))}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 pb-10">
          <SectionTitle>6. Class & subject selection</SectionTitle>
          <FormField label="Class" required>
            <IconSelect
              id="enroll-class"
              icon={GraduationCap}
              value={form.classId}
              onChange={(e) => setForm((f) => ({
                ...f,
                classId: e.target.value,
                selectedSubjects: [],
                isFullPackage: false,
              }))}
            >
              <option value="">Choose class to enroll…</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.className}</option>
              ))}
            </IconSelect>
          </FormField>

          {form.classId && (
            <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium">
                Subjects for {selectedClassName}
              </p>

              <label className="flex items-start gap-3 rounded-md border bg-background p-3 cursor-pointer hover:bg-muted/30">
                <Checkbox
                  checked={form.isFullPackage}
                  onCheckedChange={(v) => selectFullPackage(Boolean(v))}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-medium text-sm">Full package</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enroll in all subjects for this class at the full package fee.
                  </p>
                </div>
              </label>

              {!form.isFullPackage && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Or select one or more subjects (checkboxes):
                  </p>
                  {subjectsLoading && (
                    <p className="text-sm text-muted-foreground">Loading subjects…</p>
                  )}
                  {!subjectsLoading && subjects.length === 0 && (
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      No subjects found for this class. Add subjects in the Subjects tab first.
                    </p>
                  )}
                  {!subjectsLoading && subjects.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {subjects.map((s) => {
                        const selected = form.selectedSubjects.includes(s._id);
                        return (
                          <label
                            key={s._id}
                            className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                              selected ? "border-primary bg-primary/5" : "bg-background hover:bg-muted/40"
                            }`}
                          >
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => toggleSubject(s._id)}
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{s.subjectName}</p>
                              <p className="text-xs text-muted-foreground">{s.subjectCode}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {form.selectedSubjects.length > 0 && (
                    <p className="text-sm font-medium text-primary">
                      {form.selectedSubjects.length} subject{form.selectedSubjects.length > 1 ? "s" : ""} selected
                    </p>
                  )}
                  {!subjectSelectionValid && subjects.length > 0 && (
                    <p className="text-sm text-destructive">Select at least one subject or choose full package.</p>
                  )}
                </div>
              )}
            </div>
          )}

          <FormField label="Discount (PKR)">
            <IconInput
              icon={Tag}
              type="number"
              min={0}
              step={1}
              placeholder="0"
              value={form.discountAmount}
              onChange={(e) => setForm((f) => ({ ...f, discountAmount: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              One-time discount in rupees applied to the first payment (monthly + admission).
            </p>
          </FormField>

          {feePreview && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Monthly fee</span>
                <p className="font-bold text-lg">₨ {feePreview.monthlyFee.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Admission fee</span>
                <p className="font-bold text-lg">₨ {feePreview.admissionFee.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Subtotal</span>
                <p className="font-bold text-lg">
                  ₨ {(feePreview.subtotal ?? feePreview.monthlyFee + feePreview.admissionFee).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Discount</span>
                <p className="font-bold text-lg text-destructive">
                  − ₨ {(feePreview.discountAmount ?? 0).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Total payable</span>
                <p className="font-bold text-lg text-accent">₨ {feePreview.totalFee.toLocaleString()}</p>
              </div>
            </div>
          )}
        </section>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t">
          <Button variant="outline" asChild>
            <Link to={isEdit ? detailHref : listHref}>Cancel</Link>
          </Button>
          <Button disabled={saveMut.isPending || !canSubmit} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? "Saving…" : isEdit ? "Save changes" : "Register & enroll"}
          </Button>
        </div>
      </div>
    </div>
  );
}
