import { adminApi } from "@/lib/api/server";
import AdminVerificationsClient from "./AdminVerificationsClient";

export const dynamic = "force-dynamic";

export default async function AdminVerificationsPage() {
  const res = await adminApi.listVerifications({
    status: "all",
    limit: 500,
    includeUnverified: true,
  });
  return <AdminVerificationsClient initialItems={res?.items ?? []} />;
}
