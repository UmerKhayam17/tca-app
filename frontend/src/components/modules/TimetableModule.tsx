import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/lib/auth";
import type { ModuleActionCaps } from "@/lib/permissions";
import {
  defaultTimetableSection,
  findTimetableSection,
  getTimetableSections,
  type TimetableSection,
} from "@/lib/timetableMenus";
import SessionBar, { useActiveSessionId } from "@/components/modules/timetable/SessionBar";
import GridTab from "@/components/modules/timetable/GridTab";
import MyScheduleTab from "@/components/modules/timetable/MyScheduleTab";
import ViewScheduleTab from "@/components/modules/timetable/ViewScheduleTab";

const TimetableModule = ({
  caps,
  section: sectionParam,
  role,
}: {
  caps: ModuleActionCaps;
  section?: string;
  role: Role;
}) => {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState("");
  useActiveSessionId(sessionId, setSessionId);

  const canManage = caps.canEdit || caps.canCreate;
  const isTeacher = user?.role === "teacher";
  const section: TimetableSection = sectionParam
    ? findTimetableSection(sectionParam, { caps, role })
    : defaultTimetableSection({ caps, role });

  const allowed = getTimetableSections({ caps, role }).map((s) => s.key);
  if (sectionParam && !allowed.includes(sectionParam as TimetableSection)) {
    return <Navigate to={`../${section}`} replace />;
  }

  return (
    <>
      <SessionBar sessionId={sessionId} onSessionChange={setSessionId} />
      {section === "builder" && canManage && <GridTab sessionId={sessionId} caps={caps} />}
      {section === "view" && <ViewScheduleTab sessionId={sessionId} />}
      {section === "mine" && (isTeacher || canManage) && <MyScheduleTab sessionId={sessionId} />}
    </>
  );
};

export default TimetableModule;
