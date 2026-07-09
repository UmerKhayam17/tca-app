import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { ModuleActionCaps } from "@/lib/permissions";
import { fetchAcademyClasses, registerProvisionalStudent } from "@/lib/studentManagementApi";
import { formatDate } from "./studentDisplayUtils";

const emptyForm = {
  studentName: "",
  fatherName: "",
  phone: "",
  dateOfBirth: "",
  classId: "",
};

export default function ProvisionalIntakeDialog({
  open,
  onOpenChange,
  caps,
  sessionId = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caps: ModuleActionCaps;
  sessionId?: string;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);

  const { data: classes = [] } = useQuery({
    queryKey: ["academy-classes", sessionId],
    queryFn: () => fetchAcademyClasses({ status: "active", sessionId: sessionId || undefined }),
    enabled: open && Boolean(sessionId),
  });

  useEffect(() => {
    if (!open) setForm(emptyForm);
  }, [open]);

  const saveMut = useMutation({
    mutationFn: () =>
      registerProvisionalStudent({
        studentName: form.studentName.trim(),
        fatherName: form.fatherName.trim(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth,
        classId: form.classId,
      }),
    onSuccess: (student) => {
      qc.invalidateQueries({ queryKey: ["academy-students"] });
      toast({
        title: "Admission intake saved",
        description: `Temp roll ${student.rollNumber ?? "—"} · Created ${formatDate(student.createdAt)}. Send family to accounts.`,
      });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const canSubmit =
    caps.canCreate
    && form.studentName.trim()
    && form.fatherName.trim()
    && form.phone.trim()
    && form.dateOfBirth
    && form.classId;

  const handleOpenChange = (next: boolean) => {
    if (!next) setForm(emptyForm);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md cms-portal font-sans"
        onClose={() => handleOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle>Admission intake</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="intake-student-name">Student name</Label>
            <Input
              id="intake-student-name"
              value={form.studentName}
              onChange={(e) => setForm((f) => ({ ...f, studentName: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="intake-father-name">Father name</Label>
            <Input
              id="intake-father-name"
              value={form.fatherName}
              onChange={(e) => setForm((f) => ({ ...f, fatherName: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="intake-phone">Phone number</Label>
            <Input
              id="intake-phone"
              type="tel"
              placeholder="03xx-xxxxxxx"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="intake-dob">Date of birth</Label>
            <Input
              id="intake-dob"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="intake-class">Class</Label>
            <select
              id="intake-class"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-sans"
              value={form.classId}
              onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
            >
              <option value="">Choose class…</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.className}</option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="gap-2"
            disabled={!canSubmit || saveMut.isPending}
            onClick={() => saveMut.mutate()}
          >
            <Plus className="h-4 w-4" /> Save intake
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
