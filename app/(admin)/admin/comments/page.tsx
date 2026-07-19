import { adminApi } from "@/lib/api/server";
import AdminCommentsClient from "./AdminCommentsClient";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  const res = await adminApi.listComments({ limit: 100 });
  return (
    <AdminCommentsClient
      initialProductComments={res?.product_comments ?? []}
      initialShopComments={res?.shop_comments ?? []}
    />
  );
}
