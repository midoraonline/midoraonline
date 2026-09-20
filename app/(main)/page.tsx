import { Suspense } from "react";
import HomeLanding from "@/components/home/HomeLanding";
import HomeFeedSkeleton from "@/components/skeletons/HomeFeedSkeleton";
import { loadHomeFeed } from "@/lib/productFeed";

async function AlgorithmFeed() {
  const feed = await loadHomeFeed();
  return (
    <HomeLanding
      initialProducts={feed.products}
      initialHasMore={feed.hasMore}
      initialCursor={feed.nextCursor}
    />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeFeedSkeleton />}>
      <AlgorithmFeed />
    </Suspense>
  );
}
