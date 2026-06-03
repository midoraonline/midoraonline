"use client";

import Link from "next/link";
import { useAppSession } from "@/lib/state";
import { MaterialSymbol } from "@/components/MaterialSymbol";

type Props = {
  shopOwnerId: string | null | undefined;
  shopSlug?: string;
  shopId: string;
};

export default function ProductOwnerActions({ shopOwnerId, shopSlug, shopId }: Props) {
  const session = useAppSession();

  const canManage =
    session.hydrated &&
    session.isAuthenticated &&
    (session.user?.user_role === "admin" || (shopOwnerId != null && session.user?.id === shopOwnerId));

  if (!canManage) return null;

  return (
    <div className="flex gap-2">
      <Link
        href={`/shops/${shopSlug}/edit`}
        className="dm-focus inline-flex items-center gap-1.5 rounded-lg border border-foreground/[0.12] px-3 py-2 text-[11px] font-semibold text-foreground/80 hover:bg-foreground/[0.04]"
      >
        <MaterialSymbol name="edit" className="!text-sm" />
        Edit
      </Link>
      <Link
        href={`/shops/${shopSlug}/analytics`}
        className="dm-focus inline-flex items-center gap-1.5 rounded-lg border border-foreground/[0.12] px-3 py-2 text-[11px] font-semibold text-foreground/80 hover:bg-foreground/[0.04]"
      >
        <MaterialSymbol name="analytics" className="!text-sm" />
        Analytics
      </Link>
    </div>
  );
}
