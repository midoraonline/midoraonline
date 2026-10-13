"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiShops } from "@/lib/api";
import { useAppSession } from "@/lib/state";
import { LIST, PageHeader, ROW, Section, StatStrip, formatCount as fmt } from "@/components/dashboard/ui";

type Props = {
  initialFollowed: number;
  initialLiked: number;
};

export default function CustomerOverviewClient({ initialFollowed, initialLiked }: Props) {
  const session = useAppSession();

  const [followed, setFollowed] = useState<number>(initialFollowed);
  const [liked, setLiked] = useState<number>(initialLiked);

  // Client-side refresh once hydrated — SSR provided the initial counts.
  useEffect(() => {
    if (!(session.hydrated && session.isAuthenticated)) return;
    let cancelled = false;
    void (async () => {
      try {
        const [f, l] = await Promise.all([
          apiShops.myFollowedShops(),
          apiShops.myLikedShops(),
        ]);
        if (cancelled) return;
        setFollowed(f.total ?? f.items?.length ?? 0);
        setLiked(l.total ?? l.items?.length ?? 0);
      } catch {
        // Non-critical: SSR value stays.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session.hydrated, session.isAuthenticated]);

  return (
    <div>
      <PageHeader title="Overview" description="Shops you follow, items you saved and your profile." />
      <StatStrip
        items={[
          { label: "Following", value: fmt(followed) },
          { label: "Liked shops", value: fmt(liked) },
        ]}
      />
      <Section title="Go to">
        <ul className={LIST}>
          {[
            { href: "/customer/saved", title: "Saved shops", meta: "Shops you follow or liked" },
            { href: "/customer/wishlist", title: "Wishlist", meta: "Items you tapped the heart on" },
            { href: "/customer/profile", title: "Profile", meta: "Your name and contact details" },
            { href: "/shops", title: "Discover shops", meta: "Browse shops on Midora" },
          ].map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={ROW}>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{l.title}</span>
                  <span className="block truncate text-xs text-muted">{l.meta}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
