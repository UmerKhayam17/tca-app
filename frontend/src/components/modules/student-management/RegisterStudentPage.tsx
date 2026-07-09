import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  KeyRound,
  Eye,
  EyeOff,
  ImageIcon,
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
  fetchEnrollmentSubjects,
  fetchSectionsByClass,
  getAcademyStudent,
  previewFees,
  registerAcademyStudent,
  activateAcademyStudent,
  resolveUploadUrl,
  updateAcademyStudent,
  uploadAcademyStudentPhoto,
  type AcademyStudentActivateResult,
  type EnrollmentSubjectLayout,
  type FeePreview,
} from "@/lib/studentManagementApi";
import {
  buildStudentPayload,
  defaultRegisterForm,
  emptyAcademicRow,
  mapStudentToForm,
  type AcademicRow,
} from "./registerStudentForm";
import { formatDate } from "./studentDisplayUtils";

function deriveChoiceSelections(
  layout: EnrollmentSubjectLayout,
  selectedSubjects: string[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const group of layout.choiceGroups) {
    const pick = group.subjects.find((s) => selectedSubjects.includes(s._id));
    if (pick) map[group._id] = pick._id;
  }
  return map;
}

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
  sessionId = "",
  mode = "register",
  asDialog = false,
  open = true,
  onOpenChange,
}: {
  caps: ModuleActionCaps;
  studentId?: string;
  routes?: AcademyStudentRoutes;
  sessionId?: string;
  mode?: "register" | "activate";
  asDialog?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isActivate = mode === "activate";
  const isEdit = Boolean(studentId) && !isActivate;
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState(defaultRegisterForm);
  const [feePreview, setFeePreview] = useState<FeePreview | null>(null);
  const [formReady, setFormReady] = useState(!studentId);
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [choiceSelections, setChoiceSelections] = useState<Record<string, string>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [studentPassword, setStudentPassword] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer" | "online" | "other">("cash");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [credentials, setCredentials] = useState<AcademyStudentActivateResult["credentials"] | null>(null);
  const autoPackageSectionRef = useRef<string | null>(null);

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
    enabled: Boolean(studentId),
  });

  useEffect(() => {
    if (isActivate && existingStudent && existingStudent.status !== "pending_fee" && !asDialog) {
      navigate(detailHref, { replace: true });
    }
  }, [isActivate, existingStudent, detailHref, navigate, asDialog]);

  useEffect(() => {
    if (isActivate && existingStudent && existingStudent.status !== "pending_fee" && asDialog) {
      onOpenChange?.(false);
    }
  }, [isActivate, existingStudent, asDialog, onOpenChange]);

  useEffect(() => {
    if (existingStudent) {
      setForm(mapStudentToForm(existingStudent));
      setPhotoFile(null);
      setPhotoPreview(
        existingStudent.photoImage ? resolveUploadUrl(existingStudent.photoImage) : null,
      );
      setFormReady(true);
    }
  }, [existingStudent]);

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const clearPhoto = () => {
    if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(
      existingStudent?.photoImage ? resolveUploadUrl(existingStudent.photoImage) : null,
    );
  };

  const { data: classes = [] } = useQuery({
    queryKey: ["academy-classes", sessionId],
    queryFn: () => fetchAcademyClasses({ status: "active", sessionId: sessionId || undefined }),
    enabled: isEdit || isActivate || Boolean(sessionId),
  });

  const { data: enrollmentLayout, isLoading: enrollmentLoading } = useQuery({
    queryKey: ["enrollment-subjects", form.classId, form.sectionId],
    queryFn: () => fetchEnrollmentSubjects(form.classId, form.sectionId),
    enabled: Boolean(form.classId) && Boolean(form.sectionId),
  });

  const hasChoiceGroups = Boolean(enrollmentLayout?.hasChoiceGroups);

  useEffect(() => {
    if (!enrollmentLayout?.hasChoiceGroups || !formReady) return;
    if (Object.keys(choiceSelections).length > 0) return;
    const derived = deriveChoiceSelections(enrollmentLayout, form.selectedSubjects);
    if (Object.keys(derived).length > 0) setChoiceSelections(derived);
  }, [enrollmentLayout, formReady, form.selectedSubjects, choiceSelections]);

  useEffect(() => {
    if (!enrollmentLayout?.hasChoiceGroups || !form.isFullPackage) return;
    const coreIds = enrollmentLayout.coreSubjects.map((s) => s._id);
    const groupIds = enrollmentLayout.choiceGroups
      .map((g) => choiceSelections[g._id])
      .filter(Boolean);
    const next = [...coreIds, ...groupIds];
    setForm((f) => {
      const same =
        f.selectedSubjects.length === next.length &&
        next.every((id) => f.selectedSubjects.includes(id));
      return same ? f : { ...f, selectedSubjects: next };
    });
  }, [enrollmentLayout, form.isFullPackage, choiceSelections]);

  useEffect(() => {
    if (!isActivate || !form.sectionId || !enrollmentLayout) return;
    if (autoPackageSectionRef.current === form.sectionId) return;
    autoPackageSectionRef.current = form.sectionId;
    if (!enrollmentLayout.hasChoiceGroups && enrollmentLayout.coreSubjects.length > 0) {
      setForm((f) => ({
        ...f,
        isFullPackage: true,
        selectedSubjects: enrollmentLayout.coreSubjects.map((s) => s._id),
      }));
    } else if (enrollmentLayout.hasChoiceGroups) {
      setForm((f) => ({ ...f, isFullPackage: true }));
    }
  }, [isActivate, form.sectionId, enrollmentLayout]);

  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ["academy-sections", form.classId],
    queryFn: () => fetchSectionsByClass(form.classId, { status: "active" }),
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
    if (form.isFullPackage && hasChoiceGroups && enrollmentLayout) {
      const groupsReady = enrollmentLayout.choiceGroups.every((g) => {
        const groupIds = g.subjects.map((s) => s._id);
        return form.selectedSubjects.filter((id) => groupIds.includes(id)).length === g.pickCount;
      });
      if (!groupsReady) {
        setFeePreview(null);
        return;
      }
    }
    const t = setTimeout(() => {
      previewFees({
        classId: form.classId,
        selectedSubjects: form.selectedSubjects,
        isFullPackage: form.isFullPackage,
        monthlyFeeDiscount: Number(form.monthlyFeeDiscount) || 0,
        admissionFeeDiscount: Number(form.admissionFeeDiscount) || 0,
      })
        .then(setFeePreview)
        .catch(() => setFeePreview(null));
    }, 300);
    return () => clearTimeout(t);
  }, [
    form.classId,
    form.selectedSubjects,
    form.isFullPackage,
    form.monthlyFeeDiscount,
    form.admissionFeeDiscount,
    hasChoiceGroups,
    enrollmentLayout,
    choiceSelections,
  ]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = buildStudentPayload(form);
      if (isActivate && studentId) {
        const result = await activateAcademyStudent(studentId, {
          ...body,
          parentPassword: form.parentPassword.trim(),
          studentPassword: studentPassword.trim() || undefined,
          paymentMethod,
          receiptNumber: receiptNumber.trim() || undefined,
        });
        if (photoFile) {
          await uploadAcademyStudentPhoto(result.student._id, photoFile);
        }
        return result;
      }
      const student =
        isEdit && studentId
          ? await updateAcademyStudent(studentId, body)
          : await registerAcademyStudent(body);
      if (photoFile) {
        await uploadAcademyStudentPhoto(student._id, photoFile);
      }
      return { student, credentials: null as AcademyStudentActivateResult["credentials"] | null };
    },
    onSuccess: ({ student, credentials: creds }) => {
      qc.invalidateQueries({ queryKey: ["academy-students"] });
      qc.invalidateQueries({ queryKey: ["academy-student", studentId] });
      qc.invalidateQueries({ queryKey: ["academy-student-record", studentId] });
      if (creds) {
        setCredentials(creds);
        toast({
          title: "Student activated",
          description: `Roll ${creds.rollNumber} · ID ${creds.studentId}`,
        });
        return;
      }
      if (isEdit) {
        toast({ title: "Student updated" });
        if (asDialog) onOpenChange?.(false);
        else navigate(detailHref);
      } else {
        toast({ title: "Student registered", description: `ID: ${student.studentId}` });
        if (asDialog) onOpenChange?.(false);
        else navigate(listHref);
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

  const toggleGroupChoice = (groupId: string, subjectId: string, checked: boolean) => {
    setChoiceSelections((prev) => {
      if (!checked) {
        if (prev[groupId] !== subjectId) return prev;
        const next = { ...prev };
        delete next[groupId];
        return next;
      }
      return { ...prev, [groupId]: subjectId };
    });

    setForm((f) => {
      const group = enrollmentLayout?.choiceGroups.find((g) => g._id === groupId);
      const groupSubjectIds = group?.subjects.map((s) => s._id) ?? [];
      let nextSubjects = f.selectedSubjects.filter((id) => !groupSubjectIds.includes(id));
      if (checked) nextSubjects = [...nextSubjects, subjectId];
      return { ...f, selectedSubjects: nextSubjects };
    });
  };

  const selectFullPackage = (checked: boolean) => {
    setForm((f) => ({
      ...f,
      isFullPackage: checked,
      selectedSubjects: checked && enrollmentLayout
        ? enrollmentLayout.coreSubjects.map((s) => s._id)
        : checked
          ? []
          : f.selectedSubjects,
    }));
    if (!checked) setChoiceSelections({});
  };

  const updateAcademic = (index: number, patch: Partial<AcademicRow>) => {
    setForm((f) => ({
      ...f,
      academicHistory: f.academicHistory.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  };

  const subjectSelectionValid = (() => {
    if (form.isFullPackage) {
      if (!hasChoiceGroups) return true;
      return (
        enrollmentLayout?.choiceGroups.every((g) => {
          const groupIds = g.subjects.map((s) => s._id);
          const picks = form.selectedSubjects.filter((id) => groupIds.includes(id));
          return picks.length === g.pickCount;
        }) ?? false
      );
    }
    if (hasChoiceGroups) {
      return (
        form.selectedSubjects.length > 0 &&
        (enrollmentLayout?.choiceGroups.every((g) => {
          const groupIds = g.subjects.map((s) => s._id);
          const picks = form.selectedSubjects.filter((id) => groupIds.includes(id));
          return picks.length === 0 || picks.length === g.pickCount;
        }) ?? false)
      );
    }
    return form.selectedSubjects.length > 0;
  })();

  const submitBlockers = (() => {
    const missing: string[] = [];
    if (!form.studentName.trim()) missing.push("Student name");
    if (!form.fatherName.trim()) missing.push("Father's name");
    if (!form.dateOfBirth) missing.push("Date of birth");
    if (!form.gender) missing.push("Gender");
    if (!form.mobileNo.trim()) missing.push("Mobile number");
    if (!form.classId) missing.push("Class");
    if (!form.sectionId) missing.push("Section");
    if (!subjectSelectionValid) {
      if (form.isFullPackage && hasChoiceGroups) {
        missing.push("One elective per group (section 6)");
      } else {
        missing.push("Subjects or full package (section 6)");
      }
    }
    if (isActivate || !isEdit) {
      if (!form.guardianEmail.trim()) missing.push("Guardian email (section 2)");
      if (form.parentPassword.trim().length < 8) {
        missing.push("Parent login password — min 8 characters (section 2)");
      }
    }
    return missing;
  })();

  const canSubmit =
    form.studentName.trim()
    && form.fatherName.trim()
    && form.dateOfBirth
    && form.gender
    && form.mobileNo.trim()
    && form.classId
    && form.sectionId
    && subjectSelectionValid
    && (isActivate
      ? Boolean(form.guardianEmail.trim()) && form.parentPassword.trim().length >= 8
      : !isEdit
        ? Boolean(form.guardianEmail.trim()) && form.parentPassword.trim().length >= 8
        : true);

  const selectedClassName = classes.find((c) => c._id === form.classId)?.className;

  const handleClose = () => {
    if (asDialog) onOpenChange?.(false);
    else navigate(isEdit || isActivate ? detailHref : listHref);
  };

  if ((isEdit || isActivate) && (loadingStudent || !formReady)) {
    if (asDialog) {
      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-lg">
            <p className="py-8 text-center text-muted-foreground">Loading student…</p>
          </DialogContent>
        </Dialog>
      );
    }
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12 text-center text-muted-foreground">
        Loading student…
      </div>
    );
  }

  if (!isEdit && !isActivate && !sessionId && !asDialog) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12 space-y-3 text-center">
        <Button variant="outline" asChild>
          <Link to={listHref}>{listBackLabel}</Link>
        </Button>
      </div>
    );
  }

  const formBody = (
    <div className={asDialog ? "space-y-8" : "space-y-10"}>
      {!asDialog && (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-2" asChild>
            <Link to={isEdit ? detailHref : listHref}>
              <ArrowLeft className="h-4 w-4" /> {isEdit ? "Back to student" : listBackLabel}
            </Link>
          </Button>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-primary">
            {isActivate
              ? "Complete admission & activate"
              : isEdit
                ? "Edit student"
                : "Register new student"}
          </h2>
          {isActivate && (existingStudent?.rollNumber || existingStudent?.registrationNumber || existingStudent?.createdAt) && (
            <p className="text-sm text-muted-foreground">
              {existingStudent.rollNumber && (
                <>
                  Temp roll: <span className="font-medium text-foreground">{existingStudent.rollNumber}</span>
                  {existingStudent.registrationNumber || existingStudent.createdAt ? " · " : null}
                </>
              )}
              {existingStudent.registrationNumber && (
                <>
                  Ref: <span className="font-medium text-foreground">{existingStudent.registrationNumber}</span>
                  {existingStudent.createdAt ? " · " : null}
                </>
              )}
              {existingStudent.createdAt && (
                <>
                  Created: <span className="font-medium text-foreground">{formatDate(existingStudent.createdAt)}</span>
                </>
              )}
            </p>
          )}
        </div>
      </div>
      )}

      <div className="space-y-10">
        <section className="space-y-4 pb-10 border-b">
          <SectionTitle>1. Student information</SectionTitle>
          <div className="flex flex-col sm:flex-row gap-6 items-start pb-2">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="h-28 w-28 rounded-full border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <input
                id="student-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="sr-only"
                onChange={onPickPhoto}
              />
              <Label htmlFor="student-photo-input" className="cursor-pointer text-xs text-accent hover:underline">
                {photoPreview ? "Change photo" : "Upload photo"}
              </Label>
              {photoFile ? (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={clearPhoto}
                >
                  Remove selection
                </button>
              ) : null}
            </div>
          </div>
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
            <FormField label="Guardian email" required>
              <IconInput
                icon={Mail}
                type="email"
                placeholder="guardian@email.com"
                value={form.guardianEmail}
                onChange={(e) => setForm((f) => ({ ...f, guardianEmail: e.target.value }))}
              />
            </FormField>
            <FormField label="Parent login password" required={!isEdit}>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showParentPassword ? "text" : "password"}
                  className="pl-9 pr-10"
                  placeholder="Minimum 8 characters"
                  value={form.parentPassword}
                  disabled={isEdit}
                  onChange={(e) => setForm((f) => ({ ...f, parentPassword: e.target.value }))}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                  onClick={() => setShowParentPassword((p) => !p)}
                  aria-label={showParentPassword ? "Hide password" : "Show password"}
                >
                  {showParentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
              onChange={(e) => {
                setForm((f) => ({
                  ...f,
                  classId: e.target.value,
                  sectionId: "",
                  selectedSubjects: [],
                  isFullPackage: false,
                }));
                setChoiceSelections({});
              }}
            >
              <option value="">Choose class to enroll…</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.className}</option>
              ))}
            </IconSelect>
          </FormField>

          <FormField label="Section" required>
            <IconSelect
              id="enroll-section"
              icon={GraduationCap}
              value={form.sectionId}
              onChange={(e) => {
                setForm((f) => ({
                  ...f,
                  sectionId: e.target.value,
                  selectedSubjects: [],
                  isFullPackage: false,
                }));
                setChoiceSelections({});
              }}
              disabled={!form.classId || sectionsLoading}
            >
              <option value="">{form.classId ? "Choose section…" : "Select class first…"}</option>
              {sections.map((s) => (
                <option key={s._id} value={s._id}>{s.sectionName}</option>
              ))}
            </IconSelect>
          </FormField>

          {form.classId && form.sectionId && (
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
                </div>
              </label>

              {enrollmentLoading && (
                <p className="text-sm text-muted-foreground">Loading subjects…</p>
              )}

              {!enrollmentLoading && hasChoiceGroups && enrollmentLayout && (
                <>
                  {form.isFullPackage && enrollmentLayout.coreSubjects.length > 0 && (
                    <div className="space-y-2 rounded-md border bg-background p-3">
                      <p className="text-sm font-medium">Included in full package</p>
                      <div className="flex flex-wrap gap-2">
                        {enrollmentLayout.coreSubjects.map((s) => (
                          <span
                            key={s._id}
                            className="inline-flex items-center rounded-full border bg-muted/30 px-3 py-1 text-sm"
                          >
                            {s.subjectName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {enrollmentLayout.choiceGroups.map((group) => (
                    <div key={group._id} className="space-y-2 rounded-md border bg-background p-3">
                      <p className="text-sm font-medium">{group.groupName}</p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {group.subjects.map((s) => {
                          const selected = choiceSelections[group._id] === s._id;
                          return (
                            <label
                              key={s._id}
                              className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                                selected ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                              }`}
                            >
                              <Checkbox
                                checked={selected}
                                onCheckedChange={(checked) =>
                                  toggleGroupChoice(group._id, s._id, checked === true)
                                }
                              />
                              <div>
                                <p className="font-medium text-sm">{s.subjectName}</p>
                                <p className="text-xs text-muted-foreground">{s.subjectCode}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {!subjectSelectionValid && (
                    <p className="text-sm text-destructive">
                      {form.isFullPackage
                        ? "Pick one subject from each group above."
                        : "Select at least one subject. From each group, you may enroll in only one subject."}
                    </p>
                  )}
                </>
              )}

              {!form.isFullPackage && (
                <div className="space-y-4">
                  {!enrollmentLoading && hasChoiceGroups && enrollmentLayout && (
                    <>
                      {enrollmentLayout.coreSubjects.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Subjects to enroll</p>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {enrollmentLayout.coreSubjects.map((s) => {
                              const selected = form.selectedSubjects.includes(s._id);
                              return (
                                <label
                                  key={s._id}
                                  className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                                    selected ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                                  }`}
                                >
                                  <Checkbox
                                    checked={selected}
                                    onCheckedChange={() => toggleSubject(s._id)}
                                  />
                                  <div>
                                    <p className="font-medium text-sm">{s.subjectName}</p>
                                    <p className="text-xs text-muted-foreground">{s.subjectCode}</p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {!enrollmentLoading && !hasChoiceGroups && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Or select one or more subjects (checkboxes):
                      </p>
                      {(enrollmentLayout?.coreSubjects.length ?? 0) === 0 ? (
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          No subjects found for this class. Add subjects in the Subjects tab first.
                        </p>
                      ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                          {(enrollmentLayout?.coreSubjects ?? []).map((s) => {
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
                      {!subjectSelectionValid && (enrollmentLayout?.coreSubjects.length ?? 0) > 0 && (
                        <p className="text-sm text-destructive">Select at least one subject or choose full package.</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Monthly fee discount (PKR)">
              <IconInput
                icon={Tag}
                type="number"
                min={0}
                step={1}
                placeholder="0"
                value={form.monthlyFeeDiscount}
                onChange={(e) => setForm((f) => ({ ...f, monthlyFeeDiscount: e.target.value }))}
              />
            </FormField>
            <FormField label="Admission fee discount (PKR)">
              <IconInput
                icon={Tag}
                type="number"
                min={0}
                step={1}
                placeholder="0"
                value={form.admissionFeeDiscount}
                onChange={(e) => setForm((f) => ({ ...f, admissionFeeDiscount: e.target.value }))}
              />
            </FormField>
          </div>

          {feePreview && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 text-sm">
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
                <span className="text-muted-foreground">Monthly discount</span>
                <p className="font-bold text-lg text-destructive">
                  − ₨ {(feePreview.monthlyFeeDiscount ?? 0).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Admission discount</span>
                <p className="font-bold text-lg text-destructive">
                  − ₨ {(feePreview.admissionFeeDiscount ?? 0).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Total discount</span>
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

        {isActivate && (
          <section className="space-y-4 pb-10 border-b">
            <SectionTitle>Fee payment & portal access</SectionTitle>
            <p className="text-sm text-muted-foreground rounded-md border bg-muted/30 px-3 py-2">
              Parent portal login uses <strong>Guardian email</strong> and <strong>Parent login password</strong> from section 2 (password must be at least 8 characters).
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Payment method">
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="online">Online</option>
                  <option value="other">Other</option>
                </select>
              </FormField>
              <FormField label="Receipt number">
                <Input
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="Optional — auto-generated if empty"
                />
              </FormField>
              <FormField label="Student portal password">
                <Input
                  type="password"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="Leave blank for default"
                />
              </FormField>
            </div>
          </section>
        )}

        <div className="flex flex-col gap-3 pt-6 border-t">
          {!canSubmit && submitBlockers.length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <p className="font-medium">Complete these before activating:</p>
              <ul className="mt-1 list-disc pl-5 space-y-0.5">
                {submitBlockers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            disabled={saveMut.isPending || !canSubmit}
            title={!canSubmit ? submitBlockers.join("; ") : undefined}
            onClick={() => saveMut.mutate()}
          >
            {saveMut.isPending
              ? "Saving…"
              : isActivate
                ? "Record fee & activate"
                : isEdit
                  ? "Save changes"
                  : "Register & enroll"}
          </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const credentialsDialog = (
    <Dialog
      open={Boolean(credentials)}
      onOpenChange={(o) => {
        if (!o) {
          setCredentials(null);
          if (asDialog) onOpenChange?.(false);
          else navigate(detailHref);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Student activated</DialogTitle>
        </DialogHeader>
        {credentials && (
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Student ID:</span> {credentials.studentId}</p>
            <p><span className="text-muted-foreground">Roll number:</span> {credentials.rollNumber}</p>
            <p><span className="text-muted-foreground">Student login:</span> {credentials.studentEmail}</p>
            <p><span className="text-muted-foreground">Student password:</span> {credentials.studentPassword}</p>
            <p><span className="text-muted-foreground">Parent login:</span> {credentials.parentEmail}</p>
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={() => {
              setCredentials(null);
              if (asDialog) onOpenChange?.(false);
              else navigate(detailHref);
            }}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (asDialog) {
    if (!open) return credentialsDialog;
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Complete admission & activate</DialogTitle>
              {isActivate && (existingStudent?.rollNumber || existingStudent?.registrationNumber) && (
                <p className="text-sm text-muted-foreground font-normal">
                  {existingStudent.rollNumber && <>Temp roll: {existingStudent.rollNumber}</>}
                  {existingStudent.rollNumber && existingStudent.registrationNumber ? " · " : null}
                  {existingStudent.registrationNumber && <>Ref: {existingStudent.registrationNumber}</>}
                </p>
              )}
            </DialogHeader>
            {formBody}
          </DialogContent>
        </Dialog>
        {credentialsDialog}
      </>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {formBody}
      {credentialsDialog}
    </div>
  );
}
