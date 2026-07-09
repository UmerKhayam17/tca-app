import { parseJson } from "@/lib/api";
import { authedFetch } from "@/lib/auth";
import type { CreatedByUser } from "@/lib/createdBy";

export interface Datasheet {
  _id: string;
  name: string;
  columns: string[];
  rows: string[][];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: CreatedByUser | string;
}

export interface DatasheetPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authedFetch(path, init);
  const body = await parseJson<{ success?: boolean; data?: T; message?: string }>(res);
  if (!res.ok) throw new Error(body.message || `Request failed (${res.status})`);
  return body.data as T;
}

export const fetchDatasheets = async (params?: { search?: string; page?: number; limit?: number }) => {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const res = await authedFetch(`/datasheets?${q}`);
  const body = await parseJson<{
    success?: boolean;
    data?: Datasheet[];
    pagination?: DatasheetPagination;
    message?: string;
  }>(res);
  if (!res.ok) throw new Error(body.message || "Failed to load datasheets");
  return { sheets: body.data || [], pagination: body.pagination };
};

export const fetchDatasheet = (id: string) => api<Datasheet>(`/datasheets/${id}`);

export const createDatasheet = (body: {
  name: string;
  columns: string[];
  initialRows?: number;
}) =>
  api<Datasheet>("/datasheets", { method: "POST", body: JSON.stringify(body) });

export const updateDatasheet = (
  id: string,
  body: { name?: string; columns?: string[]; rows?: string[][] }
) => api<Datasheet>(`/datasheets/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteDatasheet = (id: string) =>
  api<{ deleted: boolean }>(`/datasheets/${id}`, { method: "DELETE" });
