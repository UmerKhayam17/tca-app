import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Store, useStore } from "@/lib/store";
import { ModuleActionCaps, PermLevel } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";

const ExamsModule = ({ perm: _perm, caps }: { perm: PermLevel; caps: ModuleActionCaps }) => {
  const exams = useStore(() => Store.listExams());
  const students = useStore(() => Store.listStudents());
  const canEditMarks = caps.canEdit;
  const { toast } = useToast();
  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? "—";

  const setMarks = (id: string, marks: number) => {
    Store.saveExams(Store.listExams().map((e) => (e.id === id ? { ...e, marks } : e)));
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-semibold text-primary">Mid Term Results</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Student</th>
                <th className="text-left px-4 py-3">Subject</th>
                <th className="text-left px-4 py-3">Marks</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">%</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-primary">{studentName(e.studentId)}</td>
                  <td className="px-4 py-3">{e.subject}</td>
                  <td className="px-4 py-3">
                    {canEditMarks ? (
                      <Input type="number" className="h-8 w-24" value={e.marks}
                        onChange={(ev) => setMarks(e.id, Number(ev.target.value))}
                        onBlur={() => toast({ title: "Marks saved" })} />
                    ) : `${e.marks} / ${e.total}`}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs font-semibold text-accent">{Math.round((e.marks / e.total) * 100)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ExamsModule;
