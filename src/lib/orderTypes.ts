import type { OrderStatus } from "./orderStatus";

export interface OrderLine {
  id: string;
  label: string;
  amount: number;
  was?: number;
}

export interface OrderRecord {
  code: string;
  status: OrderStatus;
  kind: "davetiye" | "gazete";
  template: string;
  title: string;
  total: number;
  lines: OrderLine[];
  createdAt: string;
  updatedAt: string;
  reportedAt: string | null;
  decidedAt: string | null;
  senderName: string;
  customerNote: string;
  adminNote: string;
  customer: { name: string; email: string; phone: string };
  snapshot: Record<string, string>;
}
