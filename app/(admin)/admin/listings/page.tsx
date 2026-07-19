import { adminApi } from "@/lib/api/server";
import AdminListingsClient from "./AdminListingsClient";

export const dynamic = "force-dynamic";

export default async function AdminListingsPage() {
  const res = await adminApi.listListings({
    status: "pending_review",
    limit: 20,
    page: 1,
  });
  return (
    <AdminListingsClient
      initialItems={res?.items ?? []}
      initialTotalPages={res?.total_pages ?? 0}
    />
  );
}
