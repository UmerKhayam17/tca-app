export type GroupSubjectRow = {
  subjectName: string;
  subjectCode: string;
  codeManual: boolean;
};

export function emptyGroupSubjectRow(): GroupSubjectRow {
  return { subjectName: "", subjectCode: "", codeManual: false };
}

export function defaultGroupSubjectCount() {
  return "2";
}

export function parseGroupSubjectCount(value: string): number {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return 2;
  return Math.min(10, Math.max(2, n));
}

export function resizeGroupSubjectRows(count: number, prev: GroupSubjectRow[]): GroupSubjectRow[] {
  const n = parseGroupSubjectCount(String(count));
  const next = [...prev];
  while (next.length < n) next.push(emptyGroupSubjectRow());
  return next.slice(0, n);
}

/** Extra subjects when converting one existing subject into a new choice group (total − 1). */
export function resizeSiblingSubjectRows(totalCount: number, prev: GroupSubjectRow[]): GroupSubjectRow[] {
  const extra = Math.max(1, parseGroupSubjectCount(String(totalCount)) - 1);
  const next = [...prev];
  while (next.length < extra) next.push(emptyGroupSubjectRow());
  return next.slice(0, extra);
}

export function groupSubjectRowsValid(rows: GroupSubjectRow[]): boolean {
  return rows.length >= 2 && rows.every((r) => r.subjectName.trim() && r.subjectCode.trim());
}

export function siblingSubjectRowsValid(rows: GroupSubjectRow[]): boolean {
  return rows.length >= 1 && rows.every((r) => r.subjectName.trim() && r.subjectCode.trim());
}
