import { customerApi } from "@/lib/api/server";
import CustomerOverviewClient from "./CustomerOverviewClient";

export const dynamic = "force-dynamic";

export default async function CustomerOverviewPage() {
  const [followedRes, likedRes] = await Promise.all([
    customerApi.followedShops(),
    customerApi.likedShops(),
  ]);

  const initialFollowed = followedRes?.total ?? followedRes?.items?.length ?? 0;
  const initialLiked = likedRes?.total ?? likedRes?.items?.length ?? 0;

  return <CustomerOverviewClient initialFollowed={initialFollowed} initialLiked={initialLiked} />;
}
