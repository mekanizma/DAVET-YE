import OrderDetail from "@/components/admin/OrderDetail";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <OrderDetail code={decodeURIComponent(code)} />;
}
