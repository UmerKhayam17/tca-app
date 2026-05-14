import { Card } from "@/components/ui/card";
import { Store, useStore } from "@/lib/store";

const ReportsModule = () => {
  const fees = useStore(() => Store.listFees());
  const students = useStore(() => Store.listStudents());
  const attendance = useStore(() => Store.listAttendance());
  const exams = useStore(() => Store.listExams());

  const collected = fees.filter((f) => f.status === "paid").reduce((s, f) => s + f.amount, 0);
  const due       = fees.filter((f) => f.status === "due").reduce((s, f) => s + f.amount, 0);
  const present   = attendance.filter((a) => a.status === "present").length;
  const avg       = exams.length ? Math.round(exams.reduce((s, e) => s + (e.marks / e.total) * 100, 0) / exams.length) : 0;

  const stats = [
    { l: "Total Students", v: students.length },
    { l: "Fees Collected", v: `₨ ${collected.toLocaleString()}` },
    { l: "Fees Due",       v: `₨ ${due.toLocaleString()}` },
    { l: "Attendance Today", v: present },
    { l: "Avg Exam Score", v: `${avg}%` },
    { l: "Exam Records",   v: exams.length },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.l} className="p-4">
            <div className="text-xs text-muted-foreground">{s.l}</div>
            <div className="font-display text-2xl font-bold text-primary mt-1">{s.v}</div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReportsModule;
