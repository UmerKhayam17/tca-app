import { useState } from "react";
import { Navigate } from "react-router-dom";
import type { ModuleActionCaps } from "@/lib/permissions";
import {
  DEFAULT_SYSTEM_CONFIG_SECTION,
  findSystemConfigSection,
  isSessionMongoId,
  type SystemConfigSection,
} from "@/lib/systemConfigMenus";
import SessionBar, { useActiveSessionId } from "@/components/modules/timetable/SessionBar";
import AcademicSetupTab from "@/components/modules/timetable/AcademicSetupTab";
import SectionsTab from "@/components/modules/timetable/SectionsTab";
import PeriodsTab from "@/components/modules/timetable/PeriodsTab";
import RoomsTab from "@/components/modules/timetable/RoomsTab";
import TeacherProfilesTab from "@/components/modules/timetable/TeacherProfilesTab";
import AssignmentsTab from "@/components/modules/timetable/AssignmentsTab";
import RequirementsTab from "@/components/modules/timetable/RequirementsTab";
import TimetableSettingsTab from "@/components/modules/timetable/TimetableSettingsTab";
import SessionHistoryTab from "@/components/modules/timetable/SessionHistoryTab";
import SessionDetailPage from "@/components/modules/timetable/SessionDetailPage";

const SystemConfigModule = ({
  caps,
  section: sectionParam,
  action,
}: {
  caps: ModuleActionCaps;
  section?: string;
  action?: string;
}) => {
  const isDetailView = sectionParam === "academic" && action && isSessionMongoId(action);
  const [sessionId, setSessionId] = useState(isDetailView ? action : "");
  useActiveSessionId(sessionId, setSessionId);

  if (!caps.canView) {
    return (
      <p className="p-6 text-muted-foreground text-sm">You do not have access to system configuration.</p>
    );
  }

  if (isDetailView) {
    return (
      <div>
        <SessionBar sessionId={sessionId} onSessionChange={setSessionId} />
        <SessionDetailPage sessionId={action} caps={caps} />
      </div>
    );
  }

  const section: SystemConfigSection = sectionParam
    ? findSystemConfigSection(sectionParam)
    : DEFAULT_SYSTEM_CONFIG_SECTION;

  if (sectionParam && sectionParam !== section) {
    return <Navigate to={`../${section}`} replace />;
  }

  const needsSession = section !== "history";

  return (
    <div>
      {needsSession && <SessionBar sessionId={sessionId} onSessionChange={setSessionId} />}
      {section === "academic" && (
        <AcademicSetupTab sessionId={sessionId} caps={caps} onSessionCreated={setSessionId} />
      )}
      {section === "sections" && <SectionsTab sessionId={sessionId} caps={caps} />}
      {section === "periods" && <PeriodsTab sessionId={sessionId} caps={caps} />}
      {section === "rooms" && <RoomsTab sessionId={sessionId} caps={caps} />}
      {section === "teachers" && <TeacherProfilesTab sessionId={sessionId} caps={caps} />}
      {section === "teacher-assignments" && <AssignmentsTab sessionId={sessionId} caps={caps} />}
      {section === "requirements" && <RequirementsTab sessionId={sessionId} caps={caps} />}
      {section === "timetable-rules" && <TimetableSettingsTab sessionId={sessionId} caps={caps} />}
      {section === "history" && <SessionHistoryTab caps={caps} />}
    </div>
  );
};

export default SystemConfigModule;
