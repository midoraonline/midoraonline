import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { adminApi } from "@/lib/api/server";
import ListingTypeTag from "@/components/ListingTypeTag";
import { listingTypeTagKind } from "@/lib/listingType";
import { productPageSlug } from "@/lib/productUrl";
import { BTN_SECONDARY, CARD, StatusDot } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

type Rec = Record<string, unknown>;

const str = (v: unknown) => (v === null || v === undefined || v === "" ? null : String(v));
const ugx = (v: unknown) => (typeof v === "number" ? `UGX ${v.toLocaleString()}` : null);
const date = (v: unknown) => {
  if (typeof v !== "string") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString("en-GB", { timeZone: "Africa/Kampala", dateStyle: "medium", timeStyle: "short" }) + " EAT";
};
const urls = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];

function Row({ label, value }: { label: string; value: import("react").ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex gap-3 py-1.5 text-sm">
      <dt className="w-32 shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{value}</dd>
    </div>
  );
}

function Card({ title, children }: { title: string; children: import("react").ReactNode }) {
  return (
    <section className={`${CARD} p-4 sm:p-5`}>
      <h2 className="mb-2 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

const TONE: Record<string, "ok" | "warn" | "bad" | "neutral"> = {
  active: "ok",
  pending_review: "warn",
  rejected: "bad",
  hidden: "neutral",
};

export default async function AdminListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await adminApi.getListing(id);
  if (!data?.listing) notFound();
  const l = data.listing as Rec & { id: string };
  const shop = data.shop as Rec | null;
  const owner = data.owner as Rec | null;
  const images = urls(l.image_urls);
  const videos = urls(l.video_urls);
  const status = str(l.status) ?? "unknown";
  const title = str(l.title) ?? "Untitled listing";
  const attrs = l.attributes && typeof l.attributes === "object" ? Object.entries(l.attributes as Rec) : [];

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-0 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/reports" className={BTN_SECONDARY}>
          <ArrowLeft className="size-4" aria-hidden /> Back to reports
        </Link>
        {status === "active" ? (
          <a href={`/products/${productPageSlug({ id: l.id, title })}`} target="_blank" rel="noreferrer" className={BTN_SECONDARY}>
            <ExternalLink className="size-4" aria-hidden /> Public page
          </a>
        ) : null}
      </div>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <ListingTypeTag kind={listingTypeTagKind(str(l.item_type), (l.meta ?? null) as never)} />
          <StatusDot tone={TONE[status] ?? "neutral"}>{status.replace(/_/g, " ")}</StatusDot>
          {status !== "active" ? <span className="text-xs text-muted">Not visible to the public</span> : null}
        </div>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{title}</h1>
        <p className="text-base font-semibold text-foreground">
          {ugx(l.discount_price) ? (
            <>
              {ugx(l.discount_price)} <span className="text-sm font-normal text-muted line-through">{ugx(l.price_ugx)}</span>
            </>
          ) : (
            ugx(l.price_ugx)
          )}
        </p>
      </header>

      {images.length || videos.length ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {images.map((src) => (
            <a key={src} href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-border bg-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="aspect-square w-full object-cover" />
            </a>
          ))}
          {videos.map((src) => (
            <video key={src} src={src} controls className="aspect-square w-full rounded-lg border border-border bg-black object-cover" />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Listing">
          <dl>
            <Row label="Description" value={<span className="whitespace-pre-line">{str(l.description)}</span>} />
            <Row label="Category" value={str(l.category_name) ?? str(l.category) ?? str(l.category_id)} />
            <Row label="Condition" value={str(l.condition)} />
            <Row label="Location" value={str(l.location)} />
            <Row label="Stock" value={str(l.stock_quantity)} />
            {attrs.map(([k, v]) => (
              <Row key={k} label={k.replace(/_/g, " ")} value={str(typeof v === "object" ? JSON.stringify(v) : v)} />
            ))}
            <Row label="Created" value={date(l.created_at)} />
            <Row label="Updated" value={date(l.updated_at)} />
            <Row label="Listing ID" value={<span className="font-mono text-xs">{l.id}</span>} />
          </dl>
        </Card>

        <div className="space-y-4">
          <Card title="Seller">
            {owner ? (
              <dl>
                <Row label="Name" value={str(owner.full_name)} />
                <Row label="Email" value={str(owner.email) ? `${owner.email}${owner.email_verified ? " (verified)" : ""}` : null} />
                <Row label="Phone" value={str(owner.phone_number) ? `${owner.phone_number}${owner.phone_verified ? " (verified)" : ""}` : null} />
                <Row label="Account" value={[str(owner.user_role), str(owner.status)].filter(Boolean).join(" · ")} />
                <Row label="Joined" value={date(owner.created_at)} />
                <Row label="Businesses" value={str(owner.business_count)} />
                <Row label="Total ads" value={str(owner.listing_count)} />
                <Row label="Seller ID" value={<span className="font-mono text-xs">{String(owner.id)}</span>} />
              </dl>
            ) : (
              <p className="text-sm text-muted">Seller account not found (may be deleted).</p>
            )}
          </Card>
          <Card title="Business">
            {shop ? (
              <dl>
                <Row label="Name" value={str(shop.name)} />
                <Row label="Status" value={shop.is_active ? "Active" : "Inactive"} />
                <Row label="Location" value={str(shop.location)} />
                <Row label="WhatsApp" value={str(shop.whatsapp_number)} />
                <Row label="Email" value={str(shop.shop_email) ?? str(shop.email)} />
                <Row label="Badges" value={Array.isArray(shop.trust_badges) ? (shop.trust_badges as string[]).join(", ").replace(/_/g, " ") : null} />
                <Row label="Created" value={date(shop.created_at)} />
                <Row label="About" value={str(shop.description)} />
                {str(shop.slug) ? (
                  <Row label="Page" value={<a className="text-accent underline" href={`/shops/${shop.slug}`} target="_blank" rel="noreferrer">/shops/{String(shop.slug)}</a>} />
                ) : null}
              </dl>
            ) : (
              <p className="text-sm text-muted">Business not found.</p>
            )}
          </Card>
        </div>
      </div>

      <Card title={`Reports (${data.reports.length})`}>
        {data.reports.length ? (
          <ul className="divide-y divide-border">
            {data.reports.map((r) => (
              <li key={r.id} className="py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{r.reason}</span>
                  <StatusDot tone={r.resolved ? "neutral" : "warn"}>{r.resolved ? "Resolved" : "Open"}</StatusDot>
                  <span className="text-xs text-muted">{date(r.created_at)}</span>
                </div>
                {r.description ? <p className="mt-0.5 text-muted">{r.description}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No reports.</p>
        )}
      </Card>
    </div>
  );
}
