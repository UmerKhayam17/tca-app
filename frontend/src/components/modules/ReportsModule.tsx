import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Store, useStore } from "@/lib/store";
import { fetchExams } from "@/lib/examApi";

const ReportsModule = () => {
  const fees = useStore(() => Store.listFees());
  const students = useStore(() => Store.listStudents());
  const attendance = useStore(() => Store.listAttendance());

  const { data: termExams = [] } = useQuery({
    queryKey: ["term-exams-summary"],
    queryFn: () => fetchExams(),
    retry: false,
  });

  const collected = fees.filter((f) => f.status === "paid").reduce((s, f) => s + f.amount, 0);
  const due = fees.filter((f) => f.status === "due").reduce((s, f) => s + f.amount, 0);
  const present = attendance.filter((a) => a.status === "present").length;
  const completedExams = termExams.filter((e) => e.status === "completed").length;

  const stats = [
    { l: "Total Students", v: students.length },
    { l: "Fees Collected", v: `₨ ${collected.toLocaleString()}` },
    { l: "Fees Due", v: `₨ ${due.toLocaleString()}` },
    { l: "Attendance Today", v: present },
    { l: "Term exams", v: termExams.length },
    { l: "Completed term exams", v: completedExams },
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
