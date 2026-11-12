import type { OrderLine, OrderRecord } from "@/lib/orderTypes";

export interface DbOrder {
  code: string;
  status: OrderRecord["status"];
  kind: OrderRecord["kind"];
  template: string;
  title: string;
  total: number;
  lines: OrderLine[] | null;
  created_at: string;
  updated_at: string;
  reported_at: string | null;
  decided_at: string | null;
  sender_name: string;
  customer_note: string;
  admin_note: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  snapshot: Record<string, string> | null;
  user_id?: string | null;
}

function iso(v: string | null | undefined): string {
  if (!v) return new Date(0).toISOString();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toISOString();
}

function isoOrNull(v: string | null | undefined): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toISOString();
}

export function toOrder(row: DbOrder): OrderRecord {
  return {
    code: row.code,
    status: row.status,
    kind: row.kind,
    template: row.template,
    title: row.title,
    total: Number(row.total) || 0,
    lines: Array.isArray(row.lines) ? row.lines : [],
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    reportedAt: isoOrNull(row.reported_at),
    decidedAt: isoOrNull(row.decided_at),
    senderName: row.sender_name || "",
    customerNote: row.customer_note || "",
    adminNote: row.admin_note || "",
    customer: {
      name: row.customer_name || "",
      email: row.customer_email || "",
      phone: row.customer_phone || "",
    },
    snapshot: row.snapshot && typeof row.snapshot === "object" && !Array.isArray(row.snapshot) ? row.snapshot : {},
  };
}

export function asDbOrder(data: unknown): DbOrder | null {
  if (!data) return null;
  let row = data;
  if (typeof data === "string") {
    try {
      row = JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (!row || typeof row !== "object") return null;
  const o = row as DbOrder;
  if (typeof o.code !== "string") return null;
  return o;
}
