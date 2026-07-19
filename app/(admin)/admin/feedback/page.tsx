import { adminApi } from "@/lib/api/server";
import AdminFeedbackClient from "./AdminFeedbackClient";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const res = await adminApi.listFeedback(100);
  return <AdminFeedbackClient initialItems={res?.items ?? []} />;
}
