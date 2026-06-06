import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fetchSessions, isSessionWritable } from "@/lib/configApi";
import { fetchAcademyClasses, fetchSectionsByClass } from "@/lib/studentManagementApi";
import { systemConfigHref } from "@/lib/systemConfigMenus";
import {
  studentManagementHref,
  type StudentManagementSection,
} from "@/lib/studentManagementMenus";
import type { Role } from "@/lib/auth";

type StepKey = "session" | "classes" | "sections" | "students";

const STEPS: { key: StepKey; label: string; section: StudentManagementSection | "academic" }[] = [
  { key: "session", label: "Create academic session", section: "academic" },
  { key: "classes", label: "Create class", section: "classes" },
  { key: "sections", label: "Create section in class", section: "sections" },
  { key: "students", label: "Add students to section", section: "registration" },
];

export default function AcademySetupWorkflow({
  role,
  sessionId,
  currentSection,
}: {
  role: Role;
  sessionId: string;
  currentSection?: string;
}) {
  const { data: sessions = [] } = useQuery({
    queryKey: ["academic-sessions"],
    queryFn: () => fetchSessions(),
  });

  const selectedSession = sessions.find((s) => s._id === sessionId);
  const sessionReady = Boolean(selectedSession && isSessionWritable(selectedSession));

  const { data: classes = [] } = useQuery({
    queryKey: ["academy-classes", sessionId],
    queryFn: () => fetchAcademyClasses({ sessionId, status: "active" }),
    enabled: Boolean(sessionId),
  });

  const { data: sectionGroups = [] } = useQuery({
    queryKey: ["academy-setup-section-count", sessionId, classes.map((c) => c._id).join(",")],
    queryFn: async () => {
      const lists = await Promise.all(classes.map((c) => fetchSectionsByClass(c._id, { status: "active" })));
      return lists.flat();
    },
    enabled: classes.length > 0,
  });

  const done: Record<StepKey, boolean> = {
    session: sessionReady,
    classes: classes.length > 0,
    sections: sectionGroups.length > 0,
    students: false,
  };

  const hrefFor = (step: (typeof STEPS)[number]) =>
    step.section === "academic"
      ? systemConfigHref(role, "academic")
      : studentManagementHref(role, step.section);

  const activeKey: StepKey =
    currentSection === "registration"
      ? "students"
      : currentSection === "sections"
        ? "sections"
        : currentSection === "classes"
          ? "classes"
          : !sessionReady
            ? "session"
            : classes.length === 0
              ? "classes"
              : sectionGroups.length === 0
                ? "sections"
                : "students";

  return (
    <Card className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 border-dashed bg-secondary/10">
      <div className="text-sm font-semibold text-primary mb-1">Academy setup order</div>
      <p className="text-xs text-muted-foreground mb-3">
        First create a session, then a class, then sections in that class, then register students into a section.
      </p>
      <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {STEPS.map((step, index) => {
          const complete = done[step.key];
          const active = step.key === activeKey;
          const Icon = complete ? CheckCircle2 : Circle;
          return (
            <li key={step.key}>
              <Link
                to={hrefFor(step)}
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                  active
                    ? "border-accent bg-accent/10 text-primary"
                    : complete
                      ? "border-border bg-background text-foreground"
                      : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${complete ? "text-accent" : ""}`} />
                <span>
                  <span className="font-semibold">{index + 1}. </span>
                  {step.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      {!sessionReady && (
        <p className="text-xs text-destructive mt-3">
          Select or create an active academic session before adding classes.
        </p>
      )}
    </Card>
  );
}
