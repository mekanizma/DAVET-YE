export const ORDER_STATUSES = ["bekliyor", "bildirildi", "onaylandi", "reddedildi"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  bekliyor: "Havale bekleniyor",
  bildirildi: "Onay bekliyor",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi",
  "test-success": "Test siparişi",
  "test-failed": "Başarısız test",
};

export function isOrderStatus(v: string): v is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(v);
}
