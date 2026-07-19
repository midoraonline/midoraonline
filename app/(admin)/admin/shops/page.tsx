import { adminApi } from "@/lib/api/server";
import AdminShopsClient from "./AdminShopsClient";

export const dynamic = "force-dynamic";

export default async function AdminShopsPage() {
  const res = await adminApi.listShops();
  return <AdminShopsClient initialShops={res?.items ?? []} />;
}
