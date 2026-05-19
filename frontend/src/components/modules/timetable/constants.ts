import type { Weekday } from "@/lib/configApi";

export const DAY_LABELS: Record<Weekday, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export const DAY_ORDER: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const SUBJECT_COLORS = [
  "bg-blue-500/15 text-blue-700 border-blue-200",
  "bg-emerald-500/15 text-emerald-700 border-emerald-200",
  "bg-amber-500/15 text-amber-800 border-amber-200",
  "bg-violet-500/15 text-violet-700 border-violet-200",
  "bg-rose-500/15 text-rose-700 border-rose-200",
  "bg-cyan-500/15 text-cyan-800 border-cyan-200",
];

export function subjectColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[h];
}

/** Compare schedule slot period to template period (ObjectId vs string safe). */
export function slotMatchesPeriod(
  slot: { periodId: string | { _id?: string } },
  periodId: string
) {
  const slotPeriod =
    typeof slot.periodId === "object" && slot.periodId?._id
      ? slot.periodId._id
      : String(slot.periodId);
  return slotPeriod === String(periodId);
}
