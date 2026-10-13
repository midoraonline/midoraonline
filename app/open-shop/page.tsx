"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, PenLine, Sparkles } from "lucide-react";

import StandaloneShell from "@/components/StandaloneShell";
import CreateShopConcierge from "@/components/createShopConcierge";
import OpenShopWizard from "@/components/openShopWizard";
import VerifyChannelStep from "@/components/post/VerifyChannelStep";
import StepFrame from "@/components/post/StepFrame";
import { BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY, BTN_TEXT } from "@/components/dashboard/ui";
import { useAppSession } from "@/lib/state";
import type { apiShops } from "@/lib/api";
import { fetchVerificationStatus, type VerificationStatus } from "@/lib/verification";

type CreationMode = "choose" | "quick" | "manual";

export default function OpenShopPage() {
  const router = useRouter();
  const session = useAppSession();
  const [mode, setMode] = useState<CreationMode>("choose");
  const [createdShop, setCreatedShop] = useState<apiShops.Shop | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const stillResolving =
    !session.hydrated || (session.isAuthenticated && session.user === undefined);

  useEffect(() => {
    if (stillResolving) return;
    if (!session.isAuthenticated) {
      router.replace("/login?next=/open-shop");
    }
  }, [stillResolving, session.isAuthenticated, router]);

  useEffect(() => {
    if (!session.hydrated || !session.isAuthenticated) return;
    let active = true;
    fetchVerificationStatus()
      .then((status) => {
        if (!active) return;
        setVerificationError(null);
        setVerificationStatus(status);
      })
      .catch(() => {
        if (active) setVerificationError("We couldn't check verification. Try again.");
      });
    return () => {
      active = false;
    };
  }, [session.hydrated, session.isAuthenticated, attempt]);

  if (stillResolving) {
    return (
      <StandaloneShell eyebrow="Merchant Studio">
        <div className="grid min-h-[calc(100dvh-64px)] place-items-center p-6">
          <div className="flex flex-col items-center gap-3 text-muted">
            <div className="dm-skeleton h-5 w-48 rounded-lg" />
            <p className="text-sm font-medium">Opening shop builder…</p>
          </div>
        </div>
      </StandaloneShell>
    );
  }

  if (!session.isAuthenticated) return null;

  if (!verificationStatus) {
    return (
      <StandaloneShell eyebrow="Merchant Studio">
        <div className="grid min-h-[calc(100dvh-64px)] place-items-center p-6">
          <div className="flex flex-col items-center gap-3 text-center text-muted">
            {verificationError ? (
              <>
                <p className="text-sm" role="alert">{verificationError}</p>
                <button type="button" onClick={() => setAttempt((n) => n + 1)} className={BTN_SECONDARY}>
                  Try again
                </button>
              </>
            ) : (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden />
                <p className="text-sm font-medium">Checking verified contact…</p>
              </>
            )}
          </div>
        </div>
      </StandaloneShell>
    );
  }

  if (!verificationStatus.can_post) {
    return (
      <StandaloneShell eyebrow="Merchant Studio">
        <VerifyChannelStep
          status={verificationStatus}
          onVerified={setVerificationStatus}
          onBack={() => router.push("/")}
        />
      </StandaloneShell>
    );
  }

  const verifiedContacts = {
    email: verificationStatus.email_verified ? verificationStatus.email : null,
    phone: verificationStatus.phone_verified ? verificationStatus.phone : null,
  };

  return (
    <StandaloneShell eyebrow="Merchant Studio">
      {createdShop ? (
        <CreatedSuccess shop={createdShop} onCreateAnother={() => { setCreatedShop(null); setMode("choose"); }} />
      ) : (
        <>
          {mode === "choose" ? <ChooseStart onPick={setMode} onBack={() => router.push("/")} /> : null}
          <div className={mode === "quick" ? "" : "hidden"}>
            <div className="min-h-[calc(100dvh-4rem)] bg-surface-page">
            <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
              <button type="button" onClick={() => setMode("choose")} className={`${BTN_GHOST} -ml-2 mb-4`}>
                Back
              </button>
              <CreateShopConcierge
                onShopCreated={setCreatedShop}
                verifiedContacts={verifiedContacts}
                enabled={mode === "quick"}
              />
              <button type="button" onClick={() => setMode("manual")} className={`${BTN_TEXT} mt-6`}>
                Fill in the form myself instead
              </button>
            </div>
            </div>
          </div>
          <div className={mode === "manual" ? "" : "hidden"}>
            <OpenShopWizard
              onPreferAi={() => setMode("quick")}
              onExit={() => setMode("choose")}
              verifiedContacts={verifiedContacts}
            />
          </div>
        </>
      )}
    </StandaloneShell>
  );
}

function ChooseStart({ onPick, onBack }: { onPick: (m: CreationMode) => void; onBack: () => void }) {
  const options = [
    {
      mode: "quick" as const,
      icon: Sparkles,
      title: "Use AI",
      text: "Describe your business in a sentence or two. We draft the shop and you check it before it goes live.",
      badge: "Fastest",
    },
    {
      mode: "manual" as const,
      icon: PenLine,
      title: "Set up manually",
      text: "Fill in your shop details yourself, one short step at a time.",
      badge: null,
    },
  ];
  return (
    <StepFrame
      title="How do you want to set up your shop?"
      subtitle="You can change everything later."
      onBack={onBack}
      wide
      plain
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((o) => (
          <button
            key={o.mode}
            type="button"
            onClick={() => onPick(o.mode)}
            className="dm-focus relative flex min-h-40 flex-col items-start rounded-xl border border-border bg-surface p-5 text-left shadow-xs transition-colors hover:border-accent/60"
          >
            <span className="grid size-10 place-items-center rounded-lg bg-accent/10 text-accent" aria-hidden>
              <o.icon className="size-5" />
            </span>
            {o.badge ? (
              <span className="absolute right-4 top-4 rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                {o.badge}
              </span>
            ) : null}
            <span className="mt-4 text-sm font-semibold text-foreground">{o.title}</span>
            <span className="mt-1 text-sm text-muted">{o.text}</span>
          </button>
        ))}
      </div>
    </StepFrame>
  );
}

function CreatedSuccess({ shop, onCreateAnother }: { shop: apiShops.Shop; onCreateAnother: () => void }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm text-muted">Your shop is live</p>
      <h1 className="mt-1 text-xl font-semibold text-foreground">{shop.name}</h1>
      <p className="mt-1 text-sm text-muted">Add your first listing or finish your shop details whenever you&apos;re ready.</p>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link href={`/merchant/shops/${shop.id}`} className={BTN_PRIMARY}>
          Manage shop
        </Link>
        <Link href={`/shops/${encodeURIComponent(shop.slug)}`} className={BTN_SECONDARY}>
          View public page
        </Link>
      </div>
      <button type="button" onClick={onCreateAnother} className={`${BTN_TEXT} mt-6`}>
        Create another shop
      </button>
    </div>
  );
}
