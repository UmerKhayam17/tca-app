/** Removes panel demo data previously stored in localStorage (not auth or permissions). */
const LEGACY_DEMO_KEYS = [
  "tces_students",
  "tces_staff",
  "tces_attendance",
  "tces_fees",
  "tces_exams",
  "tces_salary",
  "tces_chat_messages",
  "tces_announcements",
  "tces_timetable",
  "tces_datasheets_v1",
  "tces_permissions_v1",
] as const;

let cleared = false;

export function clearLegacyDemoStorage() {
  if (cleared || typeof window === "undefined") return;
  cleared = true;
  for (const key of LEGACY_DEMO_KEYS) {
    localStorage.removeItem(key);
  }
}
