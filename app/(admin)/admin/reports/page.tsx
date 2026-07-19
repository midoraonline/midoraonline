import { adminApi } from "@/lib/api/server";
import AdminReportsClient from "./AdminReportsClient";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const res = await adminApi.listReports({ resolved: false, limit: 100 });
  return <AdminReportsClient initialReports={res?.items ?? []} />;
}
