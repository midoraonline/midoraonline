import { chatApi } from "@/lib/api/server";
import MerchantConversationsClient from "./MerchantConversationsClient";

export const dynamic = "force-dynamic";

export default async function MerchantConversationsPage() {
  const list = await chatApi.listConversations();
  return <MerchantConversationsClient initialConversations={list ?? []} />;
}
