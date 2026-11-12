import { Suspense } from "react";
import OrdersView from "@/components/admin/OrdersView";

export default function Page() {
  return (
    <Suspense fallback={<p role="status">Yükleniyor…</p>}>
      <OrdersView />
    </Suspense>
  );
}
