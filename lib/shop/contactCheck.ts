import { apiFetch, ApiError } from "@/lib/api/base";
import { getShop, updateShop, type Contact, type Paginated, type Shop } from "@/lib/api/shops";
import { fetchVerificationStatus } from "@/lib/verification";

/** GET /api/v1/shops/{id}/contact-check: how buyers can reach the seller of this shop/profile. */
export type ContactCheck = {
  /** null: the personal profile does not exist yet (it is created on the first post). */
  shop_id: string | null;
  is_personal: boolean;
  whatsapp: { number: string | null; verified: boolean };
  account_phone: { number: string | null; verified: boolean };
  extra_phones: Contact[];
  account_email: { address: string | null; verified: boolean };
  shop_email: string | null;
};

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

function normalize(raw: Partial<ContactCheck> | null | undefined, shopId: string | null): ContactCheck {
  return {
    shop_id: text(raw?.shop_id) ?? shopId,
    is_personal: Boolean(raw?.is_personal),
    whatsapp: { number: text(raw?.whatsapp?.number), verified: Boolean(raw?.whatsapp?.verified) },
    account_phone: { number: text(raw?.account_phone?.number), verified: Boolean(raw?.account_phone?.verified) },
    extra_phones: Array.isArray(raw?.extra_phones) ? raw.extra_phones.filter((c) => text(c?.value)) : [],
    account_email: { address: text(raw?.account_email?.address), verified: Boolean(raw?.account_email?.verified) },
    shop_email: text(raw?.shop_email),
  };
}

/** The hidden personal seller profile ("Other" / no shops). `myShops()` filters it out. */
export async function findPersonalShopId(): Promise<string | null> {
  const res = await apiFetch<Paginated<Shop>>("/api/v1/shops/me?limit=100");
  return res.items?.find((s) => s.is_personal === true)?.id ?? null;
}

/** Same shape from shop detail + verification status, for APIs without contact-check. */
async function buildFallback(shopId: string | null, isPersonal: boolean): Promise<ContactCheck> {
  const [shop, status] = await Promise.all([
    shopId ? getShop(shopId).catch(() => null) : Promise.resolve(null),
    fetchVerificationStatus(),
  ]);
  return normalize(
    {
      shop_id: shopId,
      is_personal: shop?.is_personal ?? isPersonal,
      whatsapp: {
        number: shop?.whatsapp_number ?? null,
        verified: Boolean(shop?.whatsapp_verified || shop?.whatsapp_registered === true),
      },
      account_phone: { number: status.phone, verified: status.phone_verified },
      extra_phones: shop?.contacts ?? [],
      account_email: { address: status.email, verified: status.email_verified },
      shop_email: shop?.shop_email ?? null,
    },
    shopId,
  );
}

/** `shopId` null = post on the personal profile. */
export async function fetchContactCheck(shopId: string | null): Promise<ContactCheck> {
  if (!shopId) {
    // Creates the personal profile on first post, so WhatsApp can be verified before posting.
    try {
      const raw = await apiFetch<Partial<ContactCheck>>("/api/v1/shops/personal/contact-check");
      if (raw?.shop_id) return normalize(raw, raw.shop_id);
    } catch (err) {
      if (!(err instanceof ApiError && (err.status === 404 || err.status === 405))) throw err;
    }
  }
  const id = shopId ?? (await findPersonalShopId().catch(() => null));
  if (!id) return buildFallback(null, true);
  try {
    const raw = await apiFetch<Partial<ContactCheck>>(`/api/v1/shops/${encodeURIComponent(id)}/contact-check`);
    return normalize(raw, id);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 405)) return buildFallback(id, !shopId);
    throw err;
  }
}

export function saveShopContacts(shopId: string, patch: { contacts?: Contact[]; shop_email?: string | null }) {
  return updateShop(shopId, patch);
}

/** +256700123456 → 0700 123 456; other countries stay international. */
export function displayPhone(e164: string): string {
  const m = /^\+256(\d{3})(\d{3})(\d{3})$/.exec(e164.replace(/\s/g, ""));
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : e164;
}

/** "WhatsApp ✓ · Call 0700 123 456 · Email ✓". Unverified WhatsApp stays hidden from buyers. */
export function contactPreviewParts(check: ContactCheck): string[] {
  const parts: string[] = [];
  if (check.whatsapp.verified && check.whatsapp.number) parts.push("WhatsApp ✓");
  const call = (check.account_phone.verified ? check.account_phone.number : null) ?? text(check.extra_phones[0]?.value);
  if (call) parts.push(`Call ${displayPhone(call)}`);
  if (check.shop_email || check.account_email.verified) parts.push("Email ✓");
  parts.push("Midora messages");
  return parts;
}
