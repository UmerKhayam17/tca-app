// Dummy data store backed by localStorage with cross-tab change events.
import { useEffect, useState } from "react";

const STORE_EVT = "tces-store-change";

export interface Student { id: string; name: string; class: string; rollNo: string; guardian: string; phone: string; }
export interface StaffMember { id: string; name: string; role: "teacher" | "accountant" | "admin"; subject?: string; salary: number; status: "active" | "inactive"; }
export interface AttendanceRow { id: string; studentId: string; date: string; status: "present" | "absent" | "leave"; }
export interface FeeRow { id: string; studentId: string; month: string; amount: number; status: "paid" | "due"; paidOn?: string; }
export interface ExamRow { id: string; studentId: string; subject: string; term: string; marks: number; total: number; }
export interface SalaryRow { id: string; staffId: string; month: string; amount: number; status: "paid" | "pending"; paidOn?: string; }
export interface Book { id: string; title: string; author: string; copies: number; available: number; }
export interface BookIssue { id: string; bookId: string; studentId: string; issuedOn: string; dueOn: string; returnedOn?: string; }
export interface ChatMessage { id: string; room: string; from: string; fromName: string; role: string; text: string; ts: number; }
export interface Announcement { id: string; title: string; body: string; audience: "all" | "teachers" | "parents" | "staff"; ts: number; }
export interface TimetableRow { id: string; class: string; day: string; period: string; subject: string; teacher: string; }
export interface Assignment { id: string; class: string; subject: string; title: string; dueDate: string; submitted: number; total: number; }

const KEYS = {
  students: "tces_students",
  staff: "tces_staff",
  attendance: "tces_attendance",
  fees: "tces_fees",
  exams: "tces_exams",
  salary: "tces_salary",
  books: "tces_books",
  bookIssues: "tces_book_issues",
  chat: "tces_chat_messages",
  announcements: "tces_announcements",
  timetable: "tces_timetable",
  assignments: "tces_assignments",
} as const;

const uid = () => Math.random().toString(36).slice(2, 10);

// ------- Seeders -------
const SEED_STUDENTS: Student[] = [
  { id: "s1", name: "Ahmed Raza",   class: "10-A",  rollNo: "01", guardian: "Bilal Ahmed", phone: "0300-1234567" },
  { id: "s2", name: "Fatima Noor",  class: "10-A",  rollNo: "02", guardian: "Imran Noor",  phone: "0300-2234567" },
  { id: "s3", name: "Bilal Khan",   class: "9-B",   rollNo: "01", guardian: "Asif Khan",   phone: "0300-3234567" },
  { id: "s4", name: "Hina Tariq",   class: "8-B",   rollNo: "05", guardian: "Tariq Mehmood", phone: "0300-4234567" },
  { id: "s5", name: "Usman Sheikh", class: "ICS-2", rollNo: "12", guardian: "Sheikh Adil", phone: "0300-5234567" },
  { id: "s6", name: "Sara Iqbal",   class: "Pre-Med 1", rollNo: "08", guardian: "Iqbal Hussain", phone: "0300-6234567" },
];

const SEED_STAFF: StaffMember[] = [
  { id: "t1", name: "Ayesha Malik", role: "teacher",    subject: "Mathematics", salary: 75000, status: "active" },
  { id: "t2", name: "Kamran Iqbal", role: "teacher",    subject: "Physics",     salary: 80000, status: "active" },
  { id: "t3", name: "Nadia Saleem", role: "teacher",    subject: "English",     salary: 72000, status: "active" },
  { id: "a1", name: "Imran Ali",    role: "accountant",                          salary: 65000, status: "active" },
  { id: "ad1",name: "Sara Khan",    role: "admin",                               salary: 120000, status: "active" },
];

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthISO = () => new Date().toISOString().slice(0, 7);

const SEED_ATTENDANCE: AttendanceRow[] = SEED_STUDENTS.map((s, i) => ({
  id: uid(), studentId: s.id, date: todayISO(),
  status: i % 5 === 0 ? "absent" : "present",
}));

const SEED_FEES: FeeRow[] = SEED_STUDENTS.flatMap((s, i) => [
  { id: uid(), studentId: s.id, month: "2026-03", amount: 12500, status: "paid", paidOn: "2026-03-05" },
  { id: uid(), studentId: s.id, month: "2026-04", amount: 12500, status: i % 2 ? "paid" : "due", paidOn: i % 2 ? "2026-04-04" : undefined },
]);

const SUBJECTS = ["Math", "Physics", "Chemistry", "English", "Urdu"];
const SEED_EXAMS: ExamRow[] = SEED_STUDENTS.flatMap((s) =>
  SUBJECTS.map((sub) => ({
    id: uid(), studentId: s.id, subject: sub, term: "Mid Term",
    marks: 60 + Math.floor(Math.random() * 35), total: 100,
  })),
);

const SEED_SALARY: SalaryRow[] = SEED_STAFF.map((st) => ({
  id: uid(), staffId: st.id, month: monthISO(), amount: st.salary,
  status: "pending",
}));

const SEED_BOOKS: Book[] = [
  { id: "b1", title: "Physics Fundamentals", author: "Halliday",  copies: 12, available: 9 },
  { id: "b2", title: "Calculus Made Easy",   author: "Thompson",  copies: 10, available: 6 },
  { id: "b3", title: "Atomic Habits",        author: "James Clear", copies: 8,  available: 4 },
  { id: "b4", title: "Pakistan Studies",     author: "Ikram Rabbani", copies: 20, available: 18 },
];

const SEED_TIMETABLE: TimetableRow[] = (() => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const out: TimetableRow[] = [];
  days.forEach((d) => {
    SUBJECTS.forEach((sub, i) => {
      out.push({
        id: uid(), class: "10-A", day: d, period: `${8 + i}:00`,
        subject: sub, teacher: SEED_STAFF[i % 3].name,
      });
    });
  });
  return out;
})();

const SEED_ASSIGNMENTS: Assignment[] = [
  { id: uid(), class: "10-A", subject: "Math",    title: "Quadratic Equations Worksheet", dueDate: "2026-05-08", submitted: 18, total: 24 },
  { id: uid(), class: "10-A", subject: "Physics", title: "Newton's Laws Lab Report",       dueDate: "2026-05-10", submitted: 12, total: 24 },
  { id: uid(), class: "9-B",  subject: "English", title: "Essay: Climate Change",          dueDate: "2026-05-12", submitted: 20, total: 26 },
];

const SEED_ANNOUNCEMENTS: Announcement[] = [
  { id: uid(), title: "Parent-Teacher Meeting",  body: "Saturday, May 9 from 10am.",    audience: "parents",  ts: Date.now() - 86400000 },
  { id: uid(), title: "Mid-Term Schedule Posted", body: "Check the timetable section.", audience: "all",      ts: Date.now() - 3600000 },
];

const SEED_CHAT: ChatMessage[] = [
  { id: uid(), room: "general", from: "admin@concept.edu",     fromName: "Sara Khan",    role: "admin",      text: "Welcome to The Concept staff chat 👋", ts: Date.now() - 7200000 },
  { id: uid(), room: "general", from: "teacher@concept.edu",   fromName: "Ayesha Malik", role: "teacher",    text: "Mid-term papers ready to print.",       ts: Date.now() - 3600000 },
  { id: uid(), room: "general", from: "accountant@concept.edu",fromName: "Imran Ali",    role: "accountant", text: "April fee collection at 92%.",          ts: Date.now() - 1800000 },
];

// ------- Generic helpers -------
const seedOnce = <T,>(key: string, seed: T) => {
  if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(seed));
};

export const seedAll = () => {
  seedOnce(KEYS.students, SEED_STUDENTS);
  seedOnce(KEYS.staff, SEED_STAFF);
  seedOnce(KEYS.attendance, SEED_ATTENDANCE);
  seedOnce(KEYS.fees, SEED_FEES);
  seedOnce(KEYS.exams, SEED_EXAMS);
  seedOnce(KEYS.salary, SEED_SALARY);
  seedOnce(KEYS.books, SEED_BOOKS);
  seedOnce(KEYS.bookIssues, []);
  seedOnce(KEYS.chat, SEED_CHAT);
  seedOnce(KEYS.announcements, SEED_ANNOUNCEMENTS);
  seedOnce(KEYS.timetable, SEED_TIMETABLE);
  seedOnce(KEYS.assignments, SEED_ASSIGNMENTS);
};

const read = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
  catch { return fallback; }
};

const write = <T,>(key: string, val: T) => {
  localStorage.setItem(key, JSON.stringify(val));
  window.dispatchEvent(new CustomEvent(STORE_EVT, { detail: key }));
};

// ------- Public API per resource -------
export const newId = uid;

export const Store = {
  // Students
  listStudents: () => read<Student[]>(KEYS.students, []),
  saveStudents: (v: Student[]) => write(KEYS.students, v),

  // Staff
  listStaff: () => read<StaffMember[]>(KEYS.staff, []),
  saveStaff: (v: StaffMember[]) => write(KEYS.staff, v),

  // Attendance
  listAttendance: () => read<AttendanceRow[]>(KEYS.attendance, []),
  saveAttendance: (v: AttendanceRow[]) => write(KEYS.attendance, v),

  // Fees
  listFees: () => read<FeeRow[]>(KEYS.fees, []),
  saveFees: (v: FeeRow[]) => write(KEYS.fees, v),

  // Exams
  listExams: () => read<ExamRow[]>(KEYS.exams, []),
  saveExams: (v: ExamRow[]) => write(KEYS.exams, v),

  // Salary
  listSalary: () => read<SalaryRow[]>(KEYS.salary, []),
  saveSalary: (v: SalaryRow[]) => write(KEYS.salary, v),

  // Library
  listBooks: () => read<Book[]>(KEYS.books, []),
  saveBooks: (v: Book[]) => write(KEYS.books, v),
  listBookIssues: () => read<BookIssue[]>(KEYS.bookIssues, []),
  saveBookIssues: (v: BookIssue[]) => write(KEYS.bookIssues, v),

  // Chat
  listChat: () => read<ChatMessage[]>(KEYS.chat, []),
  saveChat: (v: ChatMessage[]) => write(KEYS.chat, v),

  // Announcements
  listAnnouncements: () => read<Announcement[]>(KEYS.announcements, []),
  saveAnnouncements: (v: Announcement[]) => write(KEYS.announcements, v),

  // Timetable
  listTimetable: () => read<TimetableRow[]>(KEYS.timetable, []),
  saveTimetable: (v: TimetableRow[]) => write(KEYS.timetable, v),

  // Assignments
  listAssignments: () => read<Assignment[]>(KEYS.assignments, []),
  saveAssignments: (v: Assignment[]) => write(KEYS.assignments, v),
};

// ------- React hook for live data -------
export function useStore<T>(reader: () => T, watchKey?: string): T {
  const [val, setVal] = useState<T>(() => { seedAll(); return reader(); });
  useEffect(() => {
    const sync = (e?: Event) => {
      const ce = e as CustomEvent | undefined;
      if (watchKey && ce?.detail && ce.detail !== watchKey) return;
      setVal(reader());
    };
    window.addEventListener(STORE_EVT, sync as EventListener);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORE_EVT, sync as EventListener);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return val;
}

export const STORE_KEYS = KEYS;
