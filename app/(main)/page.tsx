import { Suspense } from "react";
import { cookies } from "next/headers";
import HomeLanding from "@/components/home/HomeLanding";
import { apiProducts } from "@/lib/api";
import { homeFeedProductToCard } from "@/lib/homeFeedCards";
import { publicSiteOrigin } from "@/lib/publicSite";

// Opt out of static caching so that each user request runs the feed
export const dynamic = "force-dynamic";

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

/**
 * AlgorithmFeed is an async Server Component — it's the ONLY part of the
 * page that awaits the slow personalized feed API call. Wrapping it in
 * <Suspense> lets Next.js stream the shell to the browser immediately and
 * inject the feed HTML as soon as it's ready, without blocking rendering.
 */
async function AlgorithmFeed() {
  const cookieStore = await cookies();
  const token = cookieStore.get("midora_access")?.value;
  const feed = await loadFeed(token);
  return <HomeLanding initialProducts={feed.products} />;
}

function FeedSkeleton() {
  return (
    <div className="w-full animate-pulse px-4 pt-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="aspect-[4/3] w-full rounded-2xl bg-foreground/[0.06]" />
            <div className="h-3 w-3/4 rounded bg-foreground/[0.06]" />
            <div className="h-3 w-1/2 rounded bg-foreground/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <AlgorithmFeed />
    </Suspense>
  );
}
