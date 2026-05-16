import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ModuleActionCaps, PermLevel } from "@/lib/permissions";
import ClassesTab from "@/components/modules/student-management/ClassesTab";
import SubjectsTab from "@/components/modules/student-management/SubjectsTab";
import FeeStructureTab from "@/components/modules/student-management/FeeStructureTab";
import RegistrationTab from "@/components/modules/student-management/RegistrationTab";
import FeesTab from "@/components/modules/student-management/FeesTab";

const StudentManagementModule = ({
  caps,
}: {
  perm: PermLevel;
  caps: ModuleActionCaps;
}) => (
  <Tabs defaultValue="classes" className="w-full">
    <div className="px-4 sm:px-6 lg:px-8 pt-4 border-b bg-background/80 sticky top-0 z-10">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
        <TabsTrigger value="classes">Classes</TabsTrigger>
        <TabsTrigger value="subjects">Subjects</TabsTrigger>
        <TabsTrigger value="fees-structure">Fee structure</TabsTrigger>
        <TabsTrigger value="registration">Registration</TabsTrigger>
        <TabsTrigger value="fees">Fee management</TabsTrigger>
      </TabsList>
    </div>
    <TabsContent value="classes" className="mt-0">
      <ClassesTab caps={caps} />
    </TabsContent>
    <TabsContent value="subjects" className="mt-0">
      <SubjectsTab caps={caps} />
    </TabsContent>
    <TabsContent value="fees-structure" className="mt-0">
      <FeeStructureTab caps={caps} />
    </TabsContent>
    <TabsContent value="registration" className="mt-0">
      <RegistrationTab caps={caps} />
    </TabsContent>
    <TabsContent value="fees" className="mt-0">
      <FeesTab caps={caps} />
    </TabsContent>
  </Tabs>
);

export default StudentManagementModule;
