import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ClipboardList,
  GraduationCap,
  Pencil,
  Receipt,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { ModuleActionCaps } from "@/lib/permissions";
import {
  type AcademyAssessmentRecord,
  type AcademyAttendanceRecord,
  type AcademyFeeRecord,
  type AcademyStudent,
  type AcademyStudentRecord,
  type AcademySubject,
  type AcademyTimetableSlot,
  getAcademyStudentRecord,
} from "@/lib/studentManagementApi";
import {
  academyStudentRoutes,
  type AcademyStudentRoutes,
} from "@/lib/studentManagementMenus";
import {
  classLabel,
  examPercentage,
  formatDate,
  formatPkr,
  MONTH_NAMES,
  subjectCode,
  subjectName,
  WEEKDAY_NAMES,
} from "./studentDisplayUtils";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-primary border-b pb-2 mb-4">{children}</h3>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium break-words">{value ?? "—"}</p>
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <p className="text-sm text-muted-foreground py-8 text-center border rounded-md bg-muted/20">
      {message}
    </p>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-xl font-semibold text-primary">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-x-auto border rounded-md">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left p-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b last:border-0">
              {cells.map((cell, j) => (
                <td key={j} className="p-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-accent/15 text-accent",
    present: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    absent: "bg-destructive/15 text-destructive",
    overdue: "bg-destructive/15 text-destructive",
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    late: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    leave: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    waived: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex text-xs font-semibold rounded-full px-2 py-0.5 capitalize ${
        colors[status] || "bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

function ProfileTab({ student }: { student: AcademyStudent }) {
  const subtotal = student.monthlyFee + student.admissionFee;

  return (
    <div className="space-y-8">
      <section className="space-y-4 pb-8 border-b">
        <SectionTitle>Student information</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DetailRow label="Student name" value={student.studentName} />
          <DetailRow label="Father's name" value={student.fatherName} />
          <DetailRow label="Date of birth" value={formatDate(student.dateOfBirth)} />
          <DetailRow label="Nationality" value={student.nationality} />
          <DetailRow label="Gender" value={student.gender} />
          <DetailRow label="Student email" value={student.studentEmail} />
        </div>
      </section>

      <section className="space-y-4 pb-8 border-b">
        <SectionTitle>Guardian information</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DetailRow label="Guardian name" value={student.guardianName} />
          <DetailRow label="Relation" value={student.guardianRelation} />
          <DetailRow label="CNIC" value={student.fatherGuardianCnic} />
          <DetailRow label="Occupation" value={student.guardianOccupation} />
          <DetailRow label="Work address" value={student.guardianWorkAddress} />
          <DetailRow label="Guardian email" value={student.guardianEmail} />
        </div>
      </section>

      <section className="space-y-4 pb-8 border-b">
        <SectionTitle>Contact & address</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DetailRow label="Mobile" value={student.phone} />
          <DetailRow label="Residence phone" value={student.contactPhoneRes} />
          <DetailRow label="Postal address" value={student.postalAddress || student.address} />
          <DetailRow label="Permanent address" value={student.permanentAddress} />
        </div>
      </section>

      <section className="space-y-4 pb-8 border-b">
        <SectionTitle>Previous school / college</SectionTitle>
        <DetailRow label="School / college" value={student.currentSchoolCollege} />
      </section>

      {student.academicHistory && student.academicHistory.length > 0 && (
        <section className="space-y-4 pb-8 border-b">
          <SectionTitle>Academic history (prior institutions)</SectionTitle>
          <DataTable
            headers={["Institution", "Class", "Total", "Obtained", "%", "Year"]}
            rows={student.academicHistory.map((row) => [
              row.institutionName || "—",
              row.className || "—",
              row.totalMarks ?? "—",
              row.obtainedMarks ?? "—",
              row.percentage != null ? `${row.percentage}%` : "—",
              row.year || "—",
            ])}
          />
        </section>
      )}

      <section className="space-y-4">
        <SectionTitle>Fee structure at registration</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DetailRow label="Class" value={classLabel(student.classId)} />
          <DetailRow label="Monthly fee" value={formatPkr(student.monthlyFee)} />
          <DetailRow label="Admission fee" value={formatPkr(student.admissionFee)} />
          <DetailRow label="Discount (PKR)" value={formatPkr(student.discountAmount)} />
          <DetailRow label="Subtotal" value={formatPkr(subtotal)} />
          <DetailRow label="First payment (total)" value={formatPkr(student.totalFee)} />
        </div>
      </section>
    </div>
  );
}

function EnrollmentTab({ record }: { record: AcademyStudentRecord }) {
  const { enrollment, student } = record;
  const subjects = enrollment.subjects as AcademySubject[];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Enrolled subjects" value={enrollment.subjectCount} />
        <SummaryCard label="Class total subjects" value={enrollment.classSubjectsTotal} />
        <SummaryCard
          label="Package"
          value={enrollment.isFullPackage ? "Full package" : "Selected subjects"}
        />
        <SummaryCard label="Class" value={classLabel(student.classId)} />
      </div>

      {subjects.length === 0 ? (
        <EmptyBlock message="No subjects enrolled for this student." />
      ) : (
        <DataTable
          headers={["#", "Subject", "Code", "Status"]}
          rows={subjects.map((s, i) => [
            i + 1,
            s.subjectName || "—",
            s.subjectCode || "—",
            <StatusBadge key="st" status={s.status || "active"} />,
          ])}
        />
      )}
    </div>
  );
}

function TimetableTab({ slots }: { slots: AcademyTimetableSlot[] }) {
  if (slots.length === 0) {
    return (
      <EmptyBlock message="No timetable slots for this student's class and subjects yet. Add class timetable entries from class setup when available." />
    );
  }

  const byDay = WEEKDAY_NAMES.map((day, dayIndex) => ({
    day,
    slots: slots.filter((s) => s.dayOfWeek === dayIndex),
  })).filter((g) => g.slots.length > 0);

  return (
    <div className="space-y-6">
      {byDay.map(({ day, slots: daySlots }) => (
        <div key={day} className="space-y-2">
          <h4 className="text-sm font-semibold text-primary">{day}</h4>
          <DataTable
            headers={["Time", "Subject", "Code", "Room"]}
            rows={daySlots.map((s) => [
              `${s.startTime} – ${s.endTime}`,
              subjectName(s.subjectId as AcademySubject),
              subjectCode(s.subjectId as AcademySubject) || "—",
              s.room || "—",
            ])}
          />
        </div>
      ))}
    </div>
  );
}

function AttendanceTab({ record }: { record: AcademyStudentRecord }) {
  const { summary, records } = record.attendance;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard label="Total marked days" value={summary.total} />
        <SummaryCard label="Present" value={summary.present} />
        <SummaryCard label="Absent" value={summary.absent} />
        <SummaryCard label="Late / leave" value={`${summary.late} / ${summary.leave}`} />
        <SummaryCard
          label="Attendance rate"
          value={summary.attendanceRate != null ? `${summary.attendanceRate}%` : "—"}
          hint="Present + late out of all records"
        />
      </div>

      {records.length === 0 ? (
        <EmptyBlock message="No attendance records for this student yet." />
      ) : (
        <DataTable
          headers={["Date", "Status", "Subject", "Notes"]}
          rows={records.map((r: AcademyAttendanceRecord) => [
            formatDate(r.date),
            <StatusBadge key="st" status={r.status} />,
            r.subjectId ? subjectName(r.subjectId as AcademySubject) : "General",
            r.notes || "—",
          ])}
        />
      )}
    </div>
  );
}

function FeesTab({ record }: { record: AcademyStudentRecord }) {
  const { summary, records } = record.fees;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Fee records" value={summary.recordsCount} />
        <SummaryCard label="Total paid" value={formatPkr(summary.totalPaid)} />
        <SummaryCard label="Outstanding" value={formatPkr(summary.totalPending)} />
        <SummaryCard
          label="By status"
          value={`${summary.byStatus.paid} paid · ${summary.byStatus.pending} pending`}
          hint={
            summary.byStatus.overdue
              ? `${summary.byStatus.overdue} overdue`
              : undefined
          }
        />
      </div>

      {records.length === 0 ? (
        <EmptyBlock message="No fee invoices or payments recorded yet." />
      ) : (
        <DataTable
          headers={["Period", "Type", "Amount", "Status", "Receipt", "Paid on"]}
          rows={records.map((r: AcademyFeeRecord) => [
            r.feeType === "admission"
              ? "Admission"
              : `${MONTH_NAMES[(r.month || 1) - 1]} ${r.year}`,
            r.feeType,
            formatPkr(r.amount),
            <StatusBadge key="st" status={r.status} />,
            r.receiptNumber || "—",
            r.paidAt ? formatDate(r.paidAt) : "—",
          ])}
        />
      )}
    </div>
  );
}

function TestsTab({ record }: { record: AcademyStudentRecord }) {
  const { summary, records } = record.assessments;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Tests / reports" value={summary.count} />
        <SummaryCard
          label="Average score"
          value={summary.averagePercentage != null ? `${summary.averagePercentage}%` : "—"}
        />
        <SummaryCard
          label="Highest"
          value={summary.highestPercentage != null ? `${summary.highestPercentage}%` : "—"}
        />
        <SummaryCard
          label="Lowest"
          value={summary.lowestPercentage != null ? `${summary.lowestPercentage}%` : "—"}
        />
      </div>

      {records.length === 0 ? (
        <EmptyBlock message="No test reports or assessments recorded for this student yet." />
      ) : (
        <DataTable
          headers={["Date", "Title", "Type", "Subject", "Obtained", "Total", "%", "Remarks"]}
          rows={records.map((r: AcademyAssessmentRecord) => [
            formatDate(r.examDate),
            r.title,
            r.assessmentType,
            r.subjectId ? subjectName(r.subjectId as AcademySubject) : "—",
            r.obtainedMarks,
            r.totalMarks,
            examPercentage(r.obtainedMarks, r.totalMarks),
            r.remarks || "—",
          ])}
        />
      )}
    </div>
  );
}

export default function StudentDetailPage({
  caps,
  studentId,
  routes: routesProp,
}: {
  caps: ModuleActionCaps;
  studentId: string;
  routes?: AcademyStudentRoutes;
}) {
  const { user } = useAuth();
  const routes =
    routesProp ?? (user?.role ? academyStudentRoutes(user.role, "registration") : null);
  const listHref = routes?.list ?? "..";
  const editHref = routes ? routes.edit(studentId) : "#";
  const listBackLabel = routes?.list.includes("/students")
    ? "Back to student records"
    : "Back to registration";

  const { data: record, isLoading, isError, error } = useQuery({
    queryKey: ["academy-student-record", studentId],
    queryFn: () => getAcademyStudentRecord(studentId),
  });

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12 text-center text-muted-foreground">
        Loading student record…
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12 space-y-4 text-center">
        <p className="text-destructive">{(error as Error)?.message || "Student not found"}</p>
        <Button variant="outline" asChild>
          <Link to={listHref}>Back to list</Link>
        </Button>
      </div>
    );
  }

  const { student, enrollment, attendance, fees, assessments } = record;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b pb-6">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" asChild>
            <Link to={listHref}>
              <ArrowLeft className="h-4 w-4" /> {listBackLabel}
            </Link>
          </Button>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-primary">
            {student.studentName}
          </h2>
          <p className="text-sm text-muted-foreground font-mono">{student.studentId}</p>
          <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
            <span>{classLabel(student.classId)}</span>
            <span>·</span>
            <StatusBadge status={student.status} />
          </div>
        </div>
        {caps.canEdit && (
          <Button className="gap-2 shrink-0" asChild>
            <Link to={editHref}>
              <Pencil className="h-4 w-4" /> Edit student
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard label="Subjects" value={enrollment.subjectCount} />
        <SummaryCard
          label="Attendance"
          value={
            attendance.summary.attendanceRate != null
              ? `${attendance.summary.attendanceRate}%`
              : "—"
          }
        />
        <SummaryCard label="Fee records" value={fees.summary.recordsCount} />
        <SummaryCard label="Paid (PKR)" value={formatPkr(fees.summary.totalPaid)} />
        <SummaryCard label="Tests" value={assessments.summary.count} />
        <SummaryCard
          label="Avg test %"
          value={
            assessments.summary.averagePercentage != null
              ? `${assessments.summary.averagePercentage}%`
              : "—"
          }
        />
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-3.5 w-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="enrollment" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Enrollment ({enrollment.subjectCount})
          </TabsTrigger>
          <TabsTrigger value="timetable" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Timetable
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" /> Attendance
          </TabsTrigger>
          <TabsTrigger value="fees" className="gap-1.5">
            <Receipt className="h-3.5 w-3.5" /> Fees
          </TabsTrigger>
          <TabsTrigger value="tests" className="gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" /> Test reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab student={student} />
        </TabsContent>
        <TabsContent value="enrollment" className="mt-6">
          <EnrollmentTab record={record} />
        </TabsContent>
        <TabsContent value="timetable" className="mt-6">
          <TimetableTab slots={record.timetable} />
        </TabsContent>
        <TabsContent value="attendance" className="mt-6">
          <AttendanceTab record={record} />
        </TabsContent>
        <TabsContent value="fees" className="mt-6">
          <FeesTab record={record} />
        </TabsContent>
        <TabsContent value="tests" className="mt-6">
          <TestsTab record={record} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
