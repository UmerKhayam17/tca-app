export interface CreatedByUser {
  _id: string;
  name?: string;
  email?: string;
}

export function createdByLabel(createdBy?: CreatedByUser | string | null): string {
  if (!createdBy) return "—";
  if (typeof createdBy === "string") return "—";
  return createdBy.name || createdBy.email || "—";
}
