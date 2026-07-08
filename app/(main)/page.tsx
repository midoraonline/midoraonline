import { Suspense } from "react";
import { cookies } from "next/headers";
import HomeLanding from "@/components/home/HomeLanding";
import { homeFeedProductToCard } from "@/lib/homeFeedCards";
import { publicSiteOrigin } from "@/lib/publicSite";
import type { HomeFeedProduct, HomeFeedResponse } from "@/lib/api/products";

// Force per-request rendering — no static caching ever.
export const dynamic = "force-dynamic";

const EMPTY_FEED = {
  products: [] as ReturnType<typeof homeFeedProductToCard>[],
};

/**
 * Call /api/feed (our secure internal Next.js route) which reads the
 * midora_access cookie server-side and forwards it as a Bearer token to
 * FastAPI. This avoids cross-service cookie forwarding issues on Vercel.
 */
async function loadFeed() {
  try {
    const site = publicSiteOrigin();
    const cookieStore = await cookies();
    const token = cookieStore.get("midora_access")?.value;

    // Build the upstream FastAPI URL with the token as a Bearer header.
    // We call FastAPI directly from the Next.js server — the key is that
    // we explicitly pass the Authorization header so FastAPI can identify
    // the user and return a personalized feed.
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${apiBase}/api/v1/feed/home?limit=72`, {
      headers,
      cache: "no-store",
    });

    if (res.ok) {
      const data: HomeFeedResponse = await res.json();
      if (data.algorithm?.length) {
        return {
          products: (data.algorithm ?? []).map((p: HomeFeedProduct) =>
            homeFeedProductToCard(p, site)
          ),
        };
      }
    }

    // Fallback: if the personalised home feed is empty or errored, fetch
    // the latest products so anonymous users always see something.
    const fallbackRes = await fetch(`${apiBase}/api/v1/feed/latest?limit=72`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (fallbackRes.ok) {
      const fallbackData: HomeFeedProduct[] = await fallbackRes.json();
      if (fallbackData.length) {
        return {
          products: fallbackData.map((p: HomeFeedProduct) =>
            homeFeedProductToCard(p, site)
          ),
        };
      }
    }

    return EMPTY_FEED;
  } catch (e) {
    console.error("Failed to load home feed", e);
    return EMPTY_FEED;
  }
}

/**
 * AlgorithmFeed — async Server Component.
 *
 * Wrapped in <Suspense> so the page shell renders immediately and the
 * personalized feed streams in as soon as the API returns.
 */
async function AlgorithmFeed() {
  const feed = await loadFeed();
  return <HomeLanding initialProducts={feed.products} />;
}

function FeedSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="mb-5 sm:mb-6 lg:mb-8">
        <div className="min-h-[380px] rounded-3xl bg-primary/10 sm:min-h-[460px]" />
      </div>
      <div className="mb-6 rounded-2xl border border-border bg-surface p-4">
        <div className="mb-4 h-10 rounded-xl bg-surface-subtle" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="size-16 shrink-0 rounded-2xl bg-surface-subtle" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="aspect-square w-full rounded-2xl bg-surface-subtle sm:aspect-[4/3]" />
            <div className="h-3 w-3/4 rounded bg-surface-subtle" />
            <div className="h-3 w-1/2 rounded bg-surface-subtle" />
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
