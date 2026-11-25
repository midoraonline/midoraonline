"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import StepFrame, { ActionBar, FormError } from "@/components/post/StepFrame";
import EmailContactRow from "@/components/post/contacts/EmailContactRow";
import WhatsAppContactRow from "@/components/post/contacts/WhatsAppContactRow";
import ExtraPhoneNumbers, { extraPhonesFromContacts, extraPhonesToContacts, type ExtraPhone } from "@/components/shop/ExtraPhoneNumbers";
import { BTN_PRIMARY, BTN_SECONDARY } from "@/components/dashboard/ui";
import { track } from "@/lib/analytics";
import { contactPreviewParts, displayPhone, fetchContactCheck, saveShopContacts, type ContactCheck } from "@/lib/shop/contactCheck";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "How will customers reach you?" — runs before the form, for the chosen shop or the personal profile. */
export default function ContactsStep({
  shopId,
  onContinue,
  onBack,
}: {
  /** null = personal profile. */
  shopId: string | null;
  onContinue: () => void;
  onBack: () => void;
}) {
  const [check, setCheck] = useState<ContactCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [extras, setExtras] = useState<ExtraPhone[]>([]);
  const [shopEmail, setShopEmail] = useState("");
  const [skipped, setSkipped] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const initial = useRef<{ check: ContactCheck; extras: string; shopEmail: string } | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);
    fetchContactCheck(shopId)
      .then((next) => {
        if (!active) return;
        const nextExtras = extraPhonesFromContacts(next.extra_phones);
        initial.current = { check: next, extras: JSON.stringify(nextExtras), shopEmail: next.shop_email ?? "" };
        setCheck(next);
        setExtras(nextExtras);
        setShopEmail(next.shop_email ?? "");
      })
      .catch(() => active && setError("We couldn't load your contact details. Try again."));
    return () => {
      active = false;
    };
  }, [shopId, attempt]);

  const target = check?.shop_id ?? null;
  const allSet = !!check && check.whatsapp.verified && check.account_email.verified;
  const compact = allSet && !expanded;
  const live: ContactCheck | null = check && {
    ...check,
    extra_phones: extraPhonesToContacts(extras),
    shop_email: shopEmail.trim() || null,
  };

  async function finish() {
    if (!check || !initial.current) return;
    const email = shopEmail.trim();
    if (email && !EMAIL.test(email)) {
      setError("Enter a valid public email, or leave it empty.");
      return;
    }
    const extrasChanged = JSON.stringify(extras) !== initial.current.extras;
    const emailChanged = email !== initial.current.shopEmail;
    setSaving(true);
    setError(null);
    try {
      if (target && (extrasChanged || emailChanged)) {
        await saveShopContacts(target, {
          ...(extrasChanged ? { contacts: extraPhonesToContacts(extras) } : {}),
          ...(emailChanged ? { shop_email: email || null } : {}),
        });
      }
      const was = initial.current.check;
      const numberChanged = was.whatsapp.verified && was.whatsapp.number !== check.whatsapp.number;
      const outcome = !check.whatsapp.verified
        ? "skipped"
        : numberChanged || extrasChanged || emailChanged
          ? "changed"
          : "verified";
      track("post_flow:contacts_step", {
        shopId: target ?? undefined,
        outcome,
        isPersonal: check.is_personal,
        hasWhatsApp: check.whatsapp.verified,
      });
      onContinue();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save your contacts.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  const accountPhone = check?.account_phone.number;
  return (
    <StepFrame
      title="How will customers reach you?"
      subtitle={compact ? "Everything is set. Check it once more before you post." : "Check how buyers can contact you about this listing."}
      onBack={onBack}
    >
      {!check ? (
        error ? (
          <div className="space-y-3">
            <FormError>{error}</FormError>
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className={BTN_SECONDARY}>
              Try again
            </button>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Checking your contacts…
          </p>
        )
      ) : (
        <>
          {compact ? null : (
            <div className="space-y-5 [&>*+*]:border-t [&>*+*]:border-border [&>*+*]:pt-5">
              <WhatsAppContactRow
                shopId={target}
                number={check.whatsapp.number}
                verified={check.whatsapp.verified}
                suggestedNumber={accountPhone ?? null}
                skipped={skipped}
                onSkip={setSkipped}
                onNumberSaved={(number) => setCheck((c) => c && { ...c, whatsapp: { number, verified: false } })}
                onVerified={(shop) =>
                  setCheck((c) => c && { ...c, whatsapp: { number: shop.whatsapp_number ?? c.whatsapp.number, verified: true } })
                }
              />
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Phone className="size-4 text-muted" aria-hidden /> Phone numbers
                </p>
                {accountPhone ? (
                  <p className="flex items-center gap-1.5 text-sm text-foreground">
                    {check.account_phone.verified ? (
                      <CheckCircle2 className="size-4 text-[color:var(--success)]" aria-label="Verified" />
                    ) : null}
                    {displayPhone(accountPhone)}
                    <span className="text-xs text-muted">· account number</span>
                  </p>
                ) : null}
                {target ? <ExtraPhoneNumbers value={extras} onChange={setExtras} idPrefix="contacts-extra-phone" /> : null}
              </div>
              <EmailContactRow
                address={check.account_email.address}
                verified={check.account_email.verified}
                shopEmail={shopEmail}
                onShopEmailChange={setShopEmail}
                canEditShopEmail={!!target}
                onVerified={(status) =>
                  setCheck((c) => c && { ...c, account_email: { address: status.email, verified: status.email_verified } })
                }
              />
            </div>
          )}
          <div className="rounded-lg bg-surface-subtle px-3 py-2.5 text-sm text-foreground" aria-live="polite">
            <span className="text-muted">Customers will see: </span>
            {live ? contactPreviewParts(live).join(" · ") : null}
          </div>
          {compact ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="dm-focus rounded text-sm font-medium text-accent underline-offset-2 hover:underline"
            >
              Edit contacts
            </button>
          ) : null}
          {error ? <FormError>{error}</FormError> : null}
          <ActionBar>
            <button type="button" onClick={() => void finish()} disabled={saving} className={BTN_PRIMARY}>
              {saving ? "Saving…" : "Looks good, continue"}
            </button>
          </ActionBar>
        </>
      )}
    </StepFrame>
  );
}
