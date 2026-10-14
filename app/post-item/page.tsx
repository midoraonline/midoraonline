"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import StandaloneShell from "@/components/StandaloneShell";
import { BTN_SECONDARY } from "@/components/dashboard/ui";
import LeaveLinks from "@/components/LeaveLinks";
import ListingTypeStep from "@/components/post/ListingTypeStep";
import ShopPickStep from "@/components/post/ShopPickStep";
import VerifyChannelStep from "@/components/post/VerifyChannelStep";
import ProductFormPage from "@/components/shop/ProductFormPage";
import { useAppSession } from "@/lib/state";
import { leaveFlow, useUrlStep } from "@/lib/hooks/useUrlStep";
import { fetchMyShopSummaries, type UserShopSummary } from "@/lib/shop/personalShop";
import { normalizeListingKind, type ListingKind } from "@/lib/listingMeta";
import { fetchVerificationStatus, type VerificationStatus } from "@/lib/verification";

type Step = "verify" | "shop" | "type" | "form";
const ORDER: Step[] = ["verify", "type", "shop", "form"];
const isStep = (v: string | null): v is Step => !!v && (ORDER as string[]).includes(v);

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
  const { value: urlStep, go, back } = useUrlStep();
  const [initialStep, setInitialStep] = useState<Step | null>(null);
  const [visited, setVisited] = useState<Step[]>([]);
  const [shopId, setShopId] = useState<string | null>(paramShopId);
  const [kind, setKind] = useState<ListingKind | null>(
    paramType ? normalizeListingKind(paramType) : null,
  );
  const [formReady, setFormReady] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const backUrl =
    session.user?.user_role === "merchant" || session.user?.user_role === "admin"
      ? "/merchant/listings"
      : "/";

  // Step lives in ?step= so the browser back button moves between steps.
  // Fall back to the computed first step when the URL has none (or one that
  // isn't reachable yet, e.g. the form before a type is chosen).
  let step: Step | null = isStep(urlStep) && initialStep ? urlStep : initialStep;
  if (step === "form" && !kind) step = "type";
  if (step === "shop" && shops.length <= 1) step = kind ? "form" : "type";
  if (step === "verify" && !status) step = initialStep;

  const setStep = useCallback(
    (next: Step, opts?: { replace?: boolean }) => {
      setVisited((v) => (v.includes(next) ? v : [...v, next]));
      go(next, opts);
    },
    [go],
  );

  /** Previous step the user actually saw, in flow order; none → leave the flow. */
  function goBack(from: Step) {
    const idx = ORDER.indexOf(from);
    const prev = ORDER.slice(0, idx)
      .reverse()
      .find((s) => visited.includes(s) && (s !== "shop" || shops.length > 1));
    if (prev) back(prev);
    else leaveFlow(router);
  }

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
        // Exactly one business: pick it automatically. None: post personally.
        if (list.length === 1 && !paramShopId) setShopId(list[0].id);
        // Order: verify → listing type → business (only when >1) → form.
        const first: Step = !verification.can_post
          ? "verify"
          : !paramType
            ? "type"
            : list.length > 1 && !paramShopId
              ? "shop"
              : "form";
        setInitialStep(first);
        setVisited([first]);
        if (!isStep(new URLSearchParams(window.location.search).get("step"))) {
          go(first, { replace: true });
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `go` changes with the URL; load once per attempt
  }, [session.hydrated, session.isAuthenticated, paramShopId, paramType, attempt]);

  useEffect(() => {
    if (step === "form") setFormReady(true);
  }, [step]);

  function afterVerify(next: VerificationStatus) {
    setStatus(next);
    if (!kind) setStep("type");
    else if (shops.length > 1 && !shopId) setStep("shop");
    else setStep("form");
  }


  const shop = shops.find((s) => s.id === shopId) ?? (shops.length === 1 ? shops[0] : null);
  const showShopChange = shops.length > 1;

  if (!session.hydrated || !session.isAuthenticated || (loading && !status)) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-3 py-24 text-muted">
        <Loader2 className="size-5 animate-spin" aria-hidden />
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
          onClick={() => setAttempt((n) => n + 1)}
          className={`${BTN_SECONDARY} mt-4`}
        >
          Try again
        </button>
        <LeaveLinks className="mt-6" />
      </div>
    );
  }

  return (
    <>
      {step === "verify" && status ? (
        <VerifyChannelStep status={status} onVerified={afterVerify} onBack={() => goBack("verify")} />
      ) : null}
      {step === "shop" ? (
        <ShopPickStep
          shops={shops}
          onSelect={(id) => {
            setShopId(id);
            setStep("form");
          }}
          onBack={() => goBack("shop")}
        />
      ) : null}
      {step === "type" ? (
        <ListingTypeStep
          selected={kind}
          onSelect={(next) => {
            setKind(next);
            setStep(shops.length > 1 && !shopId ? "shop" : "form");
          }}
          onBack={() => goBack("type")}
        />
      ) : null}
      {formReady && kind ? (
        <div className={step === "form" ? "w-full px-4 py-6 sm:py-10" : "hidden"}>
          <ProductFormPage
            mode="add"
            shopId={shopId ?? undefined}
            itemType={kind}
            listingKind={kind}
            shopLabel={shop?.name ?? null}
            onChangeType={() => setStep("type")}
            onChangeShop={showShopChange ? () => setStep("shop") : undefined}
            contactVerified={status?.can_post}
            onVerificationRequired={() => {
              // Re-check instead of assuming: a verified phone or email must
              // never be asked for twice.
              void fetchVerificationStatus()
                .then((fresh) => {
                  setStatus(fresh);
                  if (!fresh.can_post) setStep("verify");
                })
                .catch(() => setStep("verify"));
            }}
            backUrl={backUrl}
            onBack={() => goBack("form")}
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
            <Loader2 className="size-5 animate-spin" aria-hidden />
            <p className="text-sm font-medium">Loading page…</p>
          </div>
        }
      >
        <PostItemFlow />
      </Suspense>
    </StandaloneShell>
  );
}
