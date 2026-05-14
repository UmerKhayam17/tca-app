import { Card } from "@/components/ui/card";
import { Store, useStore } from "@/lib/store";

const TimetableModule = () => {
  const rows = useStore(() => Store.listTimetable());
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const periods = Array.from(new Set(rows.map((r) => r.period))).sort();

  const cell = (day: string, period: string) =>
    rows.find((r) => r.day === day && r.period === period);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-semibold text-primary">Class 10-A — Weekly Timetable</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Time</th>
                {days.map((d) => <th key={d} className="text-left px-4 py-3">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p}</td>
                  {days.map((d) => {
                    const c = cell(d, p);
                    return (
                      <td key={d} className="px-4 py-3">
                        {c ? (<div><div className="font-semibold text-primary">{c.subject}</div><div className="text-xs text-muted-foreground">{c.teacher}</div></div>) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TimetableModule;
