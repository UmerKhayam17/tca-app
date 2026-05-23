/** Shared client-side search for panel lists and tables. */

export function normalizePanelSearch(query: string): string {
  return query.trim().toLowerCase();
}

export function matchesPanelSearch(query: string, ...values: unknown[]): boolean {
  const needle = normalizePanelSearch(query);
  if (!needle) return true;
  const haystack = values
    .flatMap((v) => (Array.isArray(v) ? v : [v]))
    .filter((v) => v != null && v !== "")
    .map((v) => String(v).toLowerCase())
    .join(" ");
  return haystack.includes(needle);
}
