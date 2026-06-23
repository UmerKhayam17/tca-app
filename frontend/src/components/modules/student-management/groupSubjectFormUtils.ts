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

export function groupSubjectRowsValid(rows: GroupSubjectRow[]): boolean {
  return rows.length >= 2 && rows.every((r) => r.subjectName.trim() && r.subjectCode.trim());
}
