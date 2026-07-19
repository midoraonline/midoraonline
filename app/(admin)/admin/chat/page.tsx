import { adminApi } from "@/lib/api/server";
import AdminChatClient from "./AdminChatClient";

export const dynamic = "force-dynamic";

export default async function AdminChatPage() {
  const [convRes, msgRes] = await Promise.all([
    adminApi.listConversations(100),
    adminApi.messageCount(),
  ]);
  return (
    <AdminChatClient
      initialConversations={convRes?.items ?? []}
      initialMessageCount={msgRes?.count ?? 0}
    />
  );
}
