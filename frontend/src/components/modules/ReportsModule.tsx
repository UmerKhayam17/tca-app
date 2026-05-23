import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchExams } from "@/lib/examApi";
import {
  fetchAcademyAttendanceSummary,
  fetchAcademyFeeSummary,
  fetchAcademyExpenseSummary,
  fetchAcademySalarySummary,
  fetchAcademyStudents,
} from "@/lib/studentManagementApi";
import PanelSearchBar from "@/components/modules/PanelSearchBar";
import { matchesPanelSearch } from "@/lib/panelSearch";

const ReportsModule = () => {
  const [search, setSearch] = useState("");
  const now = new Date();
  const period = { month: now.getMonth() + 1, year: now.getFullYear() };

  const { data: feeSummary } = useQuery({
    queryKey: ["academy-fees-summary-reports"],
    queryFn: () => fetchAcademyFeeSummary(),
    retry: false,
  });

  const { data: academyStudentTotal } = useQuery({
    queryKey: ["academy-students-total-reports"],
    queryFn: async () => {
      const r = await fetchAcademyStudents({ page: 1, limit: 1 });
      return r.pagination?.total ?? r.students.length;
    },
    retry: false,
  });

  const { data: attendanceSummary } = useQuery({
    queryKey: ["academy-attendance-summary-reports", period],
    queryFn: () => fetchAcademyAttendanceSummary(period),
    retry: false,
  });

  const { data: salarySummary } = useQuery({
    queryKey: ["academy-salaries-summary-reports", period],
    queryFn: () => fetchAcademySalarySummary(period),
    retry: false,
  });

  const { data: expenseSummary } = useQuery({
    queryKey: ["academy-expenses-summary-reports", period],
    queryFn: () => fetchAcademyExpenseSummary(period),
    retry: false,
  });

  const { data: termExams = [] } = useQuery({
    queryKey: ["term-exams-summary"],
    queryFn: () => fetchExams(),
    retry: false,
  });

  const completedExams = termExams.filter((e) => e.status === "completed").length;

  const stats = [
    { l: "Academy students", v: academyStudentTotal ?? "—" },
    { l: "Fees collected", v: feeSummary ? `₨ ${feeSummary.totalPaid.toLocaleString()}` : "—" },
    { l: "Fees outstanding", v: feeSummary ? `₨ ${feeSummary.totalPending.toLocaleString()}` : "—" },
    { l: "Fee vouchers", v: feeSummary?.recordsCount ?? "—" },
    {
      l: "Attendance this month",
      v: attendanceSummary ? `${attendanceSummary.present} present / ${attendanceSummary.total} marks` : "—",
    },
    { l: "Pending salary (month)", v: salarySummary?.byStatus?.pending ?? "—" },
    { l: "Expenses this month", v: expenseSummary ? `₨ ${expenseSummary.totalAmount.toLocaleString()}` : "—" },
    { l: "Term exams", v: termExams.length },
    { l: "Completed term exams", v: completedExams },
  ];

  const statsFiltered = useMemo(() => {
    if (!search.trim()) return stats;
    return stats.filter((s) => matchesPanelSearch(search, s.l, s.v));
  }, [stats, search]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 space-y-3">
      <PanelSearchBar value={search} onChange={setSearch} placeholder="Search report metrics…" className="max-w-md" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {statsFiltered.length === 0 ? (
          <p className="col-span-full text-sm text-muted-foreground py-4">No metrics match your search.</p>
        ) : null}
        {statsFiltered.map((s) => (
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
