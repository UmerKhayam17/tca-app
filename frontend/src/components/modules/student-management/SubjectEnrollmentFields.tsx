import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { AcademySubjectChoiceGroup } from "@/lib/studentManagementApi";
import {
  generateSubjectCode,
  subjectCodePlaceholder,
} from "@/components/modules/student-management/subjectCodeUtils";
import type { GroupSubjectRow } from "@/components/modules/student-management/groupSubjectFormUtils";

export type SubjectEnrollmentForm = {
  enrollmentType: "required" | "choice";
  choiceGroupId: string;
  choiceGroupName: string;
  pickCount: string;
  groupSubjectCount: string;
};

export const defaultSubjectEnrollmentForm = (): SubjectEnrollmentForm => ({
  enrollmentType: "required",
  choiceGroupId: "",
  choiceGroupName: "",
  pickCount: "1",
  groupSubjectCount: "2",
});

export function isGroupChoiceSubject(form: SubjectEnrollmentForm): boolean {
  return form.enrollmentType === "choice";
}

export function isBulkGroupCreate(form: SubjectEnrollmentForm, isEdit: boolean): boolean {
  return !isEdit && form.enrollmentType === "choice" && !form.choiceGroupId;
}

export function setGroupChoiceEnabled(
  form: SubjectEnrollmentForm,
  enabled: boolean,
): SubjectEnrollmentForm {
  if (!enabled) {
    return defaultSubjectEnrollmentForm();
  }
  return { ...form, enrollmentType: "choice", groupSubjectCount: form.groupSubjectCount || "2" };
}

export function subjectIdsOfGroup(group: AcademySubjectChoiceGroup): string[] {
  return (group.subjectIds || []).map((s) => (typeof s === "string" ? s : s._id));
}

export function findGroupForSubject(
  groups: AcademySubjectChoiceGroup[],
  subjectId: string,
): AcademySubjectChoiceGroup | undefined {
  return groups.find((g) => subjectIdsOfGroup(g).includes(subjectId));
}

export function enrollmentFromGroup(group: AcademySubjectChoiceGroup): SubjectEnrollmentForm {
  return {
    enrollmentType: "choice",
    choiceGroupId: group._id,
    choiceGroupName: group.groupName,
    pickCount: String(group.pickCount),
    groupSubjectCount: String(group.subjectIds?.length ?? 2),
  };
}

export function buildEnrollmentPayload(form: SubjectEnrollmentForm) {
  if (form.enrollmentType === "required") {
    return { enrollmentType: "required" as const };
  }
  const pickCount = 1;
  if (form.choiceGroupId) {
    return {
      enrollmentType: "choice" as const,
      choiceGroupId: form.choiceGroupId,
      pickCount,
    };
  }
  return {
    enrollmentType: "choice" as const,
    choiceGroupName: form.choiceGroupName.trim(),
    pickCount,
  };
}

export function choiceGroupValid(form: SubjectEnrollmentForm): boolean {
  if (form.enrollmentType === "required") return true;
  return Boolean(form.choiceGroupId || form.choiceGroupName.trim());
}

type EnrollmentConfigProps = {
  value: SubjectEnrollmentForm;
  onChange: (next: SubjectEnrollmentForm) => void;
  choiceGroups: AcademySubjectChoiceGroup[];
  currentSubjectId?: string;
  isEdit?: boolean;
};

export function SubjectEnrollmentConfig({
  value,
  onChange,
  choiceGroups,
  currentSubjectId,
  isEdit,
}: EnrollmentConfigProps) {
  const isGroupChoice = isGroupChoiceSubject(value);
  const bulkCreate = isBulkGroupCreate(value, Boolean(isEdit));
  const patch = (partial: Partial<SubjectEnrollmentForm>) => onChange({ ...value, ...partial });

  const availableGroups = choiceGroups.filter((g) => {
    if (value.choiceGroupId === g._id) return true;
    const ids = subjectIdsOfGroup(g);
    if (currentSubjectId && ids.includes(currentSubjectId)) return true;
    return true;
  });

  const selectedGroup = choiceGroups.find((g) => g._id === value.choiceGroupId);

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-3 rounded-md border bg-muted/20 p-3 cursor-pointer">
        <Checkbox
          checked={isGroupChoice}
          onCheckedChange={(checked) => onChange(setGroupChoiceEnabled(value, checked === true))}
          className="mt-0.5"
          disabled={Boolean(isEdit && isGroupChoice)}
        />
        <div>
          <span className="text-sm font-medium">Group choice subject</span>
        </div>
      </label>

      {isGroupChoice && (
        <div className="space-y-3 rounded-md border border-dashed p-3">
          {availableGroups.length > 0 && !isEdit && (
            <div>
              <Label className="text-xs">Group</Label>
              <select
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={value.choiceGroupId || "__new__"}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id === "__new__") {
                    patch({ choiceGroupId: "", choiceGroupName: "", groupSubjectCount: value.groupSubjectCount || "2" });
                  } else {
                    const group = choiceGroups.find((g) => g._id === id);
                    patch({
                      choiceGroupId: id,
                      choiceGroupName: group?.groupName ?? "",
                      pickCount: "1",
                    });
                  }
                }}
              >
                <option value="__new__">Create new group with multiple subjects…</option>
                {availableGroups.map((g) => (
                  <option key={g._id} value={g._id}>
                    Add one subject to: {g.groupName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {bulkCreate && (
            <div>
              <Label className="text-xs">How many subjects in this group?</Label>
              <Input
                className="mt-1 max-w-[6rem]"
                type="number"
                min={2}
                max={10}
                value={value.groupSubjectCount}
                onChange={(e) => patch({ groupSubjectCount: e.target.value })}
              />
            </div>
          )}

          {!bulkCreate && availableGroups.length > 0 && isEdit && (
            <div>
              <Label className="text-xs">Group</Label>
              <select
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={value.choiceGroupId || "__new__"}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id === "__new__") {
                    patch({ choiceGroupId: "", choiceGroupName: "" });
                  } else {
                    const group = choiceGroups.find((g) => g._id === id);
                    patch({
                      choiceGroupId: id,
                      choiceGroupName: group?.groupName ?? "",
                      pickCount: "1",
                    });
                  }
                }}
              >
                <option value="__new__">Create new group…</option>
                {availableGroups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.groupName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(bulkCreate || !value.choiceGroupId) && (
            <div>
              <Label className="text-xs">Group name</Label>
              <Input
                className="mt-1"
                value={value.choiceGroupName}
                onChange={(e) => patch({ choiceGroupName: e.target.value })}
                placeholder="e.g. Computer or Biology"
                disabled={!bulkCreate && Boolean(value.choiceGroupId)}
              />
            </div>
          )}

          {selectedGroup && !bulkCreate && (
            <p className="text-xs text-muted-foreground">
              Already in this group:{" "}
              {selectedGroup.subjectIds
                .map((s) => (typeof s === "string" ? s : s.subjectName))
                .filter(Boolean)
                .join(", ")}
            </p>
          )}

        </div>
      )}
    </div>
  );
}

type BulkRowsProps = {
  rows: GroupSubjectRow[];
  onChange: (rows: GroupSubjectRow[]) => void;
  className: string;
};

export function GroupSubjectRowsEditor({ rows, onChange, className }: BulkRowsProps) {
  const updateRow = (index: number, patch: Partial<GroupSubjectRow>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Subjects in this group</Label>
      {rows.map((row, index) => (
        <div key={index} className="rounded-md border p-3 space-y-2 bg-background">
          <p className="text-xs font-medium text-muted-foreground">Subject {index + 1}</p>
          <div>
            <Label className="text-xs">Subject name</Label>
            <Input
              className="mt-1"
              value={row.subjectName}
              onChange={(e) => {
                const subjectName = e.target.value;
                const next: Partial<GroupSubjectRow> = { subjectName };
                if (!row.codeManual) {
                  next.subjectCode = generateSubjectCode(subjectName, className);
                }
                updateRow(index, next);
              }}
              placeholder="e.g. Computer Science"
            />
          </div>
          <div>
            <Label className="text-xs">Subject code</Label>
            <Input
              className="mt-1"
              value={row.subjectCode}
              onChange={(e) =>
                updateRow(index, { subjectCode: e.target.value.toUpperCase(), codeManual: true })
              }
              placeholder={subjectCodePlaceholder(className)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default SubjectEnrollmentConfig;
