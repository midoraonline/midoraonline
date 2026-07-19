import { adminApi } from "@/lib/api/server";
import AdminSubscriptionsClient from "./AdminSubscriptionsClient";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const res = await adminApi.listSubscriptions();
  return <AdminSubscriptionsClient initialItems={res?.items ?? []} />;
}
