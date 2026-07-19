import { customerApi } from "@/lib/api/server";
import WishlistClient from "./WishlistClient";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const res = await customerApi.likedProducts({ limit: 100 });
  return (
    <WishlistClient
      initialItems={res?.items ?? []}
      initialTotal={res?.total ?? 0}
    />
  );
}
