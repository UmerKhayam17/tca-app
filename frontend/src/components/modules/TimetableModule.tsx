import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import type { ModuleActionCaps } from "@/lib/permissions";
import SessionBar, { useActiveSessionId } from "@/components/modules/timetable/SessionBar";
import GridTab from "@/components/modules/timetable/GridTab";
import MyScheduleTab from "@/components/modules/timetable/MyScheduleTab";
import ViewScheduleTab from "@/components/modules/timetable/ViewScheduleTab";

const TimetableModule = ({ caps }: { caps: ModuleActionCaps }) => {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState("");
  useActiveSessionId(sessionId, setSessionId);

  const isTeacher = user?.role === "teacher";
  const isStudentOrParent = user?.role === "student" || user?.role === "parent";
  const canManage = caps.canEdit || caps.canCreate;

  if (isStudentOrParent) {
    return (
      <>
        <SessionBar sessionId={sessionId} onSessionChange={setSessionId} />
        <ViewScheduleTab sessionId={sessionId} />
      </>
    );
  }

  if (isTeacher && !canManage) {
    return (
      <>
        <SessionBar sessionId={sessionId} onSessionChange={setSessionId} />
        <Tabs defaultValue="mine" className="w-full">
          <div className="px-4 sm:px-6 lg:px-8 pt-4 border-b">
            <TabsList>
              <TabsTrigger value="mine">My schedule</TabsTrigger>
              <TabsTrigger value="class">Class timetable</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="mine" className="mt-0">
            <MyScheduleTab sessionId={sessionId} />
          </TabsContent>
          <TabsContent value="class" className="mt-0">
            <ViewScheduleTab sessionId={sessionId} />
          </TabsContent>
        </Tabs>
      </>
    );
  }

  return (
    <>
      <SessionBar sessionId={sessionId} onSessionChange={setSessionId} />
      <Tabs defaultValue={canManage ? "builder" : "view"} className="w-full">
        <div className="px-4 sm:px-6 lg:px-8 pt-4 border-b bg-background/80 sticky top-0 z-10">
          <TabsList className="flex flex-wrap h-auto gap-1">
            {canManage && <TabsTrigger value="builder">Timetable builder</TabsTrigger>}
            <TabsTrigger value="view">Class view</TabsTrigger>
            {(isTeacher || canManage) && <TabsTrigger value="mine">My schedule</TabsTrigger>}
          </TabsList>
        </div>
        {canManage && (
          <TabsContent value="builder" className="mt-0">
            <GridTab sessionId={sessionId} caps={caps} />
          </TabsContent>
        )}
        <TabsContent value="view" className="mt-0">
          <ViewScheduleTab sessionId={sessionId} />
        </TabsContent>
        <TabsContent value="mine" className="mt-0">
          <MyScheduleTab sessionId={sessionId} />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default TimetableModule;
