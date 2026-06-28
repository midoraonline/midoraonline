import { cookies } from "next/headers";
import HomeLanding from "@/components/home/HomeLanding";
import { apiProducts } from "@/lib/api";
import { homeFeedProductToCard } from "@/lib/homeFeedCards";
import { publicSiteOrigin } from "@/lib/publicSite";

const EMPTY_FEED = {
  products: [] as ReturnType<typeof homeFeedProductToCard>[],
};

async function loadFeed(token?: string) {
  try {
    const site = publicSiteOrigin();
    const data = await apiProducts.getHomeFeed(72, undefined, token);
    return {
      products: (data.algorithm ?? []).map((p) => homeFeedProductToCard(p, site)),
    };
  } catch (e) {
    console.error("Failed to load home feed", e);
    return EMPTY_FEED;
  }
}

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("midora_access")?.value;
  const feed = await loadFeed(token);

  return <HomeLanding initialProducts={feed.products} />;
}
