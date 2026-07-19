import { customerApi } from "@/lib/api/server";
import CustomerSavedClient from "./CustomerSavedClient";

export const dynamic = "force-dynamic";

export default async function CustomerSavedPage() {
  const [followedRes, likedRes] = await Promise.all([
    customerApi.followedShops(),
    customerApi.likedShops(),
  ]);

  return (
    <CustomerSavedClient
      initialFollowed={followedRes?.items ?? []}
      initialLiked={likedRes?.items ?? []}
    />
  );
}
