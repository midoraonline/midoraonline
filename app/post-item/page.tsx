"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import StandaloneShell from "@/components/StandaloneShell";
import ListingTypeStep from "@/components/post/ListingTypeStep";
import ShopPickStep from "@/components/post/ShopPickStep";
import VerifyChannelStep from "@/components/post/VerifyChannelStep";
import ProductFormPage from "@/components/shop/ProductFormPage";
import { useAppSession } from "@/lib/state";
import { fetchMyShopSummaries, type UserShopSummary } from "@/lib/shop/personalShop";
import { normalizeListingKind, type ListingKind } from "@/lib/listingMeta";
import { fetchVerificationStatus, type VerificationStatus } from "@/lib/verification";

type Step = "verify" | "shop" | "type" | "form";

function PostItemFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const session = useAppSession();

  const paramShopId = searchParams.get("shop_id") || searchParams.get("shopId");
  const paramType = searchParams.get("item_type") || searchParams.get("itemType");

  const [shops, setShops] = useState<UserShopSummary[]>([]);
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step | null>(null);
  const [shopId, setShopId] = useState<string | null>(paramShopId);
  const [kind, setKind] = useState<ListingKind | null>(
    paramType ? normalizeListingKind(paramType) : null,
  );
  const [formReady, setFormReady] = useState(false);

  const backUrl =
    session.user?.user_role === "merchant" || session.user?.user_role === "admin"
      ? "/merchant/listings"
      : "/";

  useEffect(() => {
    if (!session.hydrated || session.isAuthenticated) return;
    router.replace(`/login?next=${encodeURIComponent("/post-item")}`);
  }, [session.hydrated, session.isAuthenticated, router]);

  useEffect(() => {
    if (!session.hydrated || !session.isAuthenticated) return;
    let active = true;
    setLoading(true);
    Promise.all([
      fetchMyShopSummaries().catch(() => [] as UserShopSummary[]),
      fetchVerificationStatus(),
    ])
      .then(([list, verification]) => {
        if (!active) return;
        setShops(list);
        setStatus(verification);
        setLoadError(null);
        if (!verification.can_post) setStep("verify");
        else if (list.length > 1 && !paramShopId) setStep("shop");
        else if (!paramType) setStep("type");
        else setStep("form");
      })
      .catch(() => {
        if (!active) return;
        setLoadError("We couldn't check verification. Try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session.hydrated, session.isAuthenticated, paramShopId, paramType]);

  useEffect(() => {
    if (step === "form") setFormReady(true);
  }, [step]);

  function afterVerify(next: VerificationStatus) {
    setStatus(next);
    if (shops.length > 1 && !shopId) setStep("shop");
    else if (!kind) setStep("type");
    else setStep("form");
  }

  function backFromShop() {
    if (status && !status.can_post) setStep("verify");
    else router.push(backUrl);
  }

  function backFromType() {
    if (shops.length > 1 && !paramShopId) setStep("shop");
    else if (status && !status.can_post) setStep("verify");
    else router.push(backUrl);
  }

  const shop = shops.find((s) => s.id === shopId) ?? (shops.length === 1 ? shops[0] : null);
  const showShopChange = shops.length > 1;

  if (!session.hydrated || !session.isAuthenticated || (loading && !status)) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-3 py-24 text-muted">
        <Loader2 className="size-6 animate-spin text-accent" />
        <p className="text-sm font-medium">Loading page…</p>
      </div>
    );
  }

  if (loadError && !status) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-[color:var(--error)]">{loadError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="dm-btn dm-btn-primary mt-4 min-h-11"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      {step === "verify" && status ? (
        <VerifyChannelStep status={status} onVerified={afterVerify} onBack={() => router.push(backUrl)} />
      ) : null}
      {step === "shop" ? (
        <ShopPickStep
          shops={shops}
          onSelect={(id) => {
            setShopId(id);
            setStep(kind ? "form" : "type");
          }}
          onBack={backFromShop}
        />
      ) : null}
      {step === "type" ? (
        <ListingTypeStep
          selected={kind}
          onSelect={(next) => {
            setKind(next);
            setStep("form");
          }}
          onBack={backFromType}
        />
      ) : null}
      {formReady && kind ? (
        <div className={step === "form" ? "w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10" : "hidden"}>
          <ProductFormPage
            mode="add"
            shopId={shopId ?? undefined}
            itemType={kind}
            listingKind={kind}
            shopLabel={shop?.name ?? null}
            onChangeType={() => setStep("type")}
            onChangeShop={showShopChange ? () => setStep("shop") : undefined}
            onVerificationRequired={() => {
              setStatus((prev) =>
                prev
                  ? {
                      ...prev,
                      can_post: false,
                      phone_verified: false,
                      email_verified: false,
                      required_channel: prev.phone ? "phone" : "email",
                    }
                  : prev,
              );
              setStep("verify");
            }}
            backUrl={backUrl}
            hasBottomNav={false}
          />
        </div>
      ) : null}
    </>
  );
}

export default function PostItemPage() {
  return (
    <StandaloneShell eyebrow="Post an item" closeHref="/">
      <Suspense
        fallback={
          <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-3 py-24 text-muted">
            <Loader2 className="size-6 animate-spin text-accent" />
            <p className="text-sm font-medium">Loading page…</p>
          </div>
        }
      >
        <PostItemFlow />
      </Suspense>
    </StandaloneShell>
  );
}
