import { AdminDashboard } from "@/components/admin-dashboard";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function AdminPage() {
  const supabase = await createClient();
  const defaultMetrics = { revenue: 0, orders: 0, customers: 0, pending: 0 };
  if (!supabase) return <AdminDashboard metrics={defaultMetrics} initialProducts={[]} />;

  const [productsResult, ordersResult, profilesResult] = await Promise.all([
    supabase.from("products").select("id, name, category, price_cents, inventory_count, active").order("created_at", { ascending: false }),
    supabase.from("orders").select("total_cents, status"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  const orders = ordersResult.data ?? [];
  const metrics = {
    revenue: orders.filter((order) => order.status !== "cancelled").reduce((total, order) => total + order.total_cents, 0),
    orders: orders.length,
    customers: profilesResult.count ?? 0,
    pending: orders.filter((order) => ["new", "quoted", "confirmed", "in_production"].includes(order.status)).length,
  };

  return <AdminDashboard metrics={metrics} initialProducts={productsResult.data ?? []} />;
}