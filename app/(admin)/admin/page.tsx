import { adminApi } from "@/lib/api/server";
import AdminOverviewClient from "./AdminOverviewClient";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const data = await adminApi.statsOverview();
  return <AdminOverviewClient initialData={data ?? null} />;
}
