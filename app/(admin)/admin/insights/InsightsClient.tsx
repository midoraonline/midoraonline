"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { apiAnalytics } from "@/lib/api";
import { platformActionMessage } from "@/lib/platformMessages";
import type {
  CategoryFillRateResponse,
  DiscountEngagementResponse,
  RatingCoverageResponse,
  ReportRateResponse,
  SearchToContactResponse,
  ShopConversionResponse,
  StaleListingResponse,
  VerificationFunnelResponse,
} from "@/lib/api/analytics";
import { BTN_TEXT, EmptyState, ErrorState, PageHeader, Section as UiSection, StatStrip, UnderlineTabs } from "@/components/dashboard/ui";

const PALETTE = Array.from({ length: 8 }, (_, i) => (i === 0 ? "var(--accent)" : "var(--foreground-muted)"));

const CARTESIAN_STROKE = "var(--border)";
const AXIS_STROKE = "var(--foreground-muted)";

const WINDOWS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

function pct(n: number): string {
  if (!isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function fmt(n: number): string {
  return new Intl.NumberFormat().format(n);
}

function useLoader<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList,
): { data: T | null; error: string | null; refresh: () => void; loading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      setData(res);
    } catch (e) {
      setError(platformActionMessage(e, "Request failed"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void run();
  }, [run]);

  return { data, error, refresh: () => void run(), loading };
}

export default function InsightsClient() {
  const [window_, setWindow] = useState<number>(30);
  const [reportDim, setReportDim] = useState<"category" | "shop">("category");

  const fillRate = useLoader<CategoryFillRateResponse>(
    () => apiAnalytics.categoryFillRate({ window_days: window_ }),
    [window_],
  );
  const searchToContact = useLoader<SearchToContactResponse>(
    () => apiAnalytics.searchToContact(window_),
    [window_],
  );
  const verification = useLoader<VerificationFunnelResponse>(
    () => apiAnalytics.verificationFunnel(Math.max(30, window_)),
    [window_],
  );
  const stale = useLoader<StaleListingResponse>(
    () => apiAnalytics.staleListingRate(14),
    [],
  );
  const shopConv = useLoader<ShopConversionResponse>(
    () => apiAnalytics.shopConversion({ window_days: window_, limit: 15 }),
    [window_],
  );
  const rating = useLoader<RatingCoverageResponse>(
    () => apiAnalytics.ratingCoverage(window_),
    [window_],
  );
  const reports = useLoader<ReportRateResponse>(
    () => apiAnalytics.reportRate({ window_days: window_, dimension: reportDim }),
    [window_, reportDim],
  );
  const discount = useLoader<DiscountEngagementResponse>(
    () => apiAnalytics.discountEngagement(window_),
    [window_],
  );

  return (
    <div>
      <Header window={window_} onChange={setWindow} />

      <KpiStrip
        searchToContact={searchToContact.data}
        stale={stale.data}
        rating={rating.data}
        verification={verification.data}
      />

      {/* Discovery — category fill rate */}
      <Section
        title="Category fill rate"
        description="Share of category/search browses that surface enough real listings. Low fill rate → thin supply → merchant recruitment target."
        error={fillRate.error}
        loading={fillRate.loading}
        onRefresh={fillRate.refresh}
      >
        {fillRate.data && fillRate.data.rows.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={fillRate.data.rows.slice(0, 12).map((r) => ({
                  category: r.category,
                  fillRate: Math.round(r.fill_rate * 100),
                  browses: r.browses,
                }))}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid stroke={CARTESIAN_STROKE} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke={AXIS_STROKE} domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={130}
                  tick={{ fontSize: 11 }}
                  stroke={AXIS_STROKE}
                />
                <Tooltip
                  formatter={(v: number, name: string) =>
                    name === "fillRate" ? `${v}%` : fmt(v)
                  }
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="fillRate" fill={PALETTE[0]} radius={[0, 6, 6, 0]}>
                  <LabelList dataKey="fillRate" position="right" fontSize={11} formatter={(v: unknown) => `${v as number}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty message="No search events yet — waiting for shoppers to browse categories." />
        )}
      </Section>

      {/* Verification funnel */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Verification funnel"
          description="Merchant journey from starting verification to approval. Big drop between started → submitted = bad UX or docs friction."
          error={verification.error}
          loading={verification.loading}
          onRefresh={verification.refresh}
        >
          {verification.data && verification.data.steps.some((s) => s.count > 0) ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Funnel
                    dataKey="count"
                    data={verification.data.steps.map((s, i) => ({
                      name: s.step,
                      count: s.count,
                      fill: PALETTE[i % PALETTE.length],
                    }))}
                    isAnimationActive
                  >
                    <LabelList
                      position="right"
                      fill="var(--foreground)"
                      stroke="none"
                      fontSize={12}
                      dataKey="name"
                    />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty message="No verification events logged yet." />
          )}
        </Section>

        <Section
          title="Discount engagement"
          description="Does the discount badge move buyers? Compare view→WhatsApp click for discounted vs non-discounted listings."
          error={discount.error}
          loading={discount.loading}
          onRefresh={discount.refresh}
        >
          {discount.data ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      bucket: "With discount",
                      views: discount.data.with_discount.views,
                      clicks: discount.data.with_discount.clicks,
                      rate: Math.round(
                        discount.data.with_discount.view_to_click_rate * 1000,
                      ) / 10,
                    },
                    {
                      bucket: "Without discount",
                      views: discount.data.without_discount.views,
                      clicks: discount.data.without_discount.clicks,
                      rate: Math.round(
                        discount.data.without_discount.view_to_click_rate * 1000,
                      ) / 10,
                    },
                  ]}
                  margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                >
                  <CartesianGrid stroke={CARTESIAN_STROKE} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} stroke={AXIS_STROKE} />
                  <YAxis tick={{ fontSize: 11 }} stroke={AXIS_STROKE} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="views" fill={PALETTE[1]} name="Views" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="clicks" fill={PALETTE[2]} name="WhatsApp clicks" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </Section>
      </div>

      {/* Shop conversion */}
      <Section
        title="Top shops by conversion"
        description={`Best view-to-WhatsApp-click ratios over the last ${window_} days — the shops actually turning views into deals.`}
        error={shopConv.error}
        loading={shopConv.loading}
        onRefresh={shopConv.refresh}
      >
        {shopConv.data && shopConv.data.rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="pb-2">Shop</th>
                  <th className="pb-2 text-right">Views</th>
                  <th className="pb-2 text-right">WhatsApp clicks</th>
                  <th className="pb-2 text-right">View → click</th>
                </tr>
              </thead>
              <tbody>
                {shopConv.data.rows.map((r) => (
                  <tr key={r.shop_id} className="border-b border-border/30">
                    <td className="py-2 pr-3">
                      <div className="font-medium text-foreground">{r.shop_name ?? r.shop_id.slice(0, 8)}</div>
                      <div className="text-[11px] text-muted">{r.shop_id.slice(0, 12)}</div>
                    </td>
                    <td className="py-2 text-right tabular-nums">{fmt(r.views)}</td>
                    <td className="py-2 text-right tabular-nums">{fmt(r.whatsapp_clicks)}</td>
                    <td className="py-2 text-right tabular-nums font-semibold" style={{ color: PALETTE[0] }}>
                      {pct(r.view_to_click_rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty message="No shop-level view/click data yet." />
        )}
      </Section>

      {/* Report rate */}
      <Section
        title="Report rate"
        description="Reports per 1,000 active listings — a spike is an early warning before it becomes churn."
        error={reports.error}
        loading={reports.loading}
        onRefresh={reports.refresh}
        toolbar={
          <select
            value={reportDim}
            onChange={(e) => setReportDim(e.target.value as "category" | "shop")}
            className="dm-input h-9 w-36 text-sm"
          >
            <option value="category">By category</option>
            <option value="shop">By shop</option>
          </select>
        }
      >
        {reports.data && reports.data.rows.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={reports.data.rows.slice(0, 12).map((r) => ({
                  bucket: r.bucket,
                  perK: Math.round(r.reports_per_thousand * 10) / 10,
                  reports: r.reports,
                }))}
                margin={{ top: 8, right: 24, left: 8, bottom: 40 }}
              >
                <CartesianGrid stroke={CARTESIAN_STROKE} />
                <XAxis
                  dataKey="bucket"
                  tick={{ fontSize: 10 }}
                  stroke={AXIS_STROKE}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11 }} stroke={AXIS_STROKE} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, name: string) => (name === "perK" ? `${v} / 1k` : fmt(v))}
                />
                <Bar dataKey="perK" name="Reports / 1k listings" radius={[6, 6, 0, 0]}>
                  {reports.data.rows.slice(0, 12).map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty message="No reports in this window." />
        )}
      </Section>
    </div>
  );
}

const tooltipStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(102, 121, 143, 0.25)",
  backgroundColor: "rgba(255,255,255,0.98)",
  fontSize: 12,
};

function Header({ window: w, onChange }: { window: number; onChange: (n: number) => void }) {
  return (
    <div>
      <PageHeader
        title="Insights"
        description="Discovery, conversion (WhatsApp clicks), verification drop-off and trust health from analytics events."
      />
      <UnderlineTabs
        tabs={WINDOWS.map((o) => ({ value: String(o.value), label: `${o.value} days` }))}
        value={String(w)}
        onChange={(v) => onChange(Number(v))}
      />
    </div>
  );
}

function KpiStrip({
  searchToContact,
  stale,
  rating,
  verification,
}: {
  searchToContact: SearchToContactResponse | null;
  stale: StaleListingResponse | null;
  rating: RatingCoverageResponse | null;
  verification: VerificationFunnelResponse | null;
}) {
  const verifStart = verification?.steps.find((s) => s.step === "started")?.count ?? 0;
  const verifApproved = verification?.steps.find((s) => s.step === "approved")?.count ?? 0;
  const verifRate = verifStart ? verifApproved / verifStart : 0;

  return (
    <StatStrip
      items={[
        {
          label: "Search to contact",
          value: searchToContact ? pct(searchToContact.conversion_rate) : "…",
          hint: searchToContact
            ? `${fmt(searchToContact.sessions_with_contact)} of ${fmt(searchToContact.sessions_with_search)} sessions`
            : undefined,
        },
        {
          label: "Stale listings (14 days)",
          value: (
            <span className={(stale?.stale_rate ?? 0) > 0.4 ? "text-[color:var(--warning)]" : undefined}>
              {stale ? pct(stale.stale_rate) : "…"}
            </span>
          ),
          hint: stale ? `${fmt(stale.stale_listings)} of ${fmt(stale.active_listings)} live` : undefined,
        },
        {
          label: "Rating coverage",
          value: rating ? pct(rating.coverage_rate) : "…",
          hint: rating ? `${fmt(rating.submitted)} of ${fmt(rating.prompted)} prompts` : undefined,
        },
        {
          label: "Verification completed",
          value: verifStart ? pct(verifRate) : "None yet",
          hint: verifStart ? `${fmt(verifApproved)} of ${fmt(verifStart)} started` : undefined,
        },
      ]}
    />
  );
}

function Section({
  title,
  description,
  error,
  loading,
  onRefresh,
  toolbar,
  children,
}: {
  title: string;
  description?: string;
  error: string | null;
  loading: boolean;
  onRefresh?: () => void;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <UiSection
      title={title}
      description={description}
      action={
        <div className="flex items-center gap-3">
          {toolbar}
          {onRefresh ? (
            <button type="button" onClick={onRefresh} className={BTN_TEXT} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          ) : null}
        </div>
      }
    >
      {error ? <ErrorState message={error} onRetry={onRefresh} /> : children}
    </UiSection>
  );
}

function Empty({ message }: { message: string }) {
  return <EmptyState message={message} />;
}
