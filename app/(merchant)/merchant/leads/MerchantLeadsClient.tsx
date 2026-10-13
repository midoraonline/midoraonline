"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiShops, apiLeads } from "@/lib/api";
import type { Lead, LeadSource, LeadStatus } from "@/lib/api/leads";
import {
  EmptyState,
  FilterBar,
  LIST,
  PageHeader,
  Section,
  StatStrip,
  Select,
  StatusDot,
  formatCount as fmt,
  relativeTime,
} from "@/components/dashboard/ui";

type LeadStats = {
  total_leads: number;
  today_leads: number;
  new_leads: number;
};

type ShopSummary = { id: string; name: string };

const STATUS_OPTIONS: readonly { value: "all" | LeadStatus; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "responded", label: "Responded" },
  { value: "closed", label: "Closed" },
  { value: "ignored", label: "Ignored" },
];

const SOURCE_OPTIONS: readonly { value: "all" | LeadSource; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "call", label: "Call" },
  { value: "contact_form", label: "Contact form" },
  { value: "email", label: "Email" },
];

const SOURCE_LABEL: Record<LeadSource, string> = {
  whatsapp: "WhatsApp",
  call: "Call",
  contact_form: "Contact form",
  email: "Email",
};

type Props = {
  initialShops: ShopSummary[];
  initialShopId: string | null;
  initialStats: LeadStats | null;
  initialLeads: Lead[];
};

export default function MerchantLeadsClient({
  initialShops,
  initialShopId,
  initialStats,
  initialLeads,
}: Props) {
  const [shops, setShops] = useState<ShopSummary[]>(initialShops);
  const [selectedShop, setSelectedShop] = useState<string | null>(initialShopId);
  const [stats, setStats] = useState<LeadStats | null>(initialStats);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const statusParam = params.get("status");
  const sourceParam = params.get("type");
  const status = STATUS_OPTIONS.some((o) => o.value === statusParam) ? (statusParam as "all" | LeadStatus) : "all";
  const source = SOURCE_OPTIONS.some((o) => o.value === sourceParam) ? (sourceParam as "all" | LeadSource) : "all";

  /** Filters live in the URL so they survive refresh and can be shared. */
  const setParam = useCallback(
    (key: string, value: string, fallback: string) => {
      const next = new URLSearchParams(params.toString());
      if (value === fallback) next.delete(key);
      else next.set(key, value);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const visibleLeads = useMemo(
    () =>
      leads.filter(
        (l) => (status === "all" || l.lead_status === status) && (source === "all" || l.source === source),
      ),
    [leads, source, status],
  );

  // Refresh shops list once on mount (SSR seed may be stale).
  useEffect(() => {
    let cancelled = false;
    apiShops.myShops()
      .then((res) => {
        if (cancelled) return;
        const list = (res.items ?? []).map((s) => ({ id: s.id, name: s.name }));
        setShops(list);
        if (!selectedShop && list.length > 0) setSelectedShop(list[0].id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    if (!selectedShop) return;
    try {
      const [statsRes, leadsRes] = await Promise.all([
        apiLeads.getShopLeadStats(selectedShop),
        apiLeads.listShopLeads(selectedShop).catch(() => ({ items: [] as Lead[] })),
      ]);
      setStats(statsRes);
      setLeads(leadsRes.items ?? []);
    } catch {
      setStats(null);
      setLeads([]);
    }
  }, [selectedShop]);

  // Reload when the selected shop changes AFTER the initial SSR value.
  useEffect(() => {
    if (selectedShop && selectedShop !== initialShopId) {
      void load();
    }
  }, [selectedShop, initialShopId, load]);

  return (
    <div>
      <PageHeader title="Leads" description="Inquiries from buyers, per shop." />

      <FilterBar>
        {shops.length > 1 ? (
          <Select
            label="Shop"
            className="sm:w-64"
            value={selectedShop ?? ""}
            onChange={(v) => setSelectedShop(v)}
            options={shops.map((s) => ({ value: s.id, label: s.name }))}
          />
        ) : null}
        <Select
          label="Status"
          className="sm:w-48"
          value={status}
          onChange={(v) => setParam("status", v, "all")}
          options={STATUS_OPTIONS}
        />
        <Select
          label="Lead type"
          className="sm:w-48"
          value={source}
          onChange={(v) => setParam("type", v, "all")}
          options={SOURCE_OPTIONS}
        />
      </FilterBar>

      {!stats ? (
        <EmptyState message={shops.length ? "No lead data for this shop yet." : "Open a shop to start tracking leads."} />
      ) : (
        <>
          <StatStrip
            items={[
              { label: "New", value: fmt(stats.new_leads) },
              { label: "Today", value: fmt(stats.today_leads) },
              { label: "All time", value: fmt(stats.total_leads) },
            ]}
          />
          <Section title="Recent leads">
            {leads.length === 0 ? (
              <EmptyState message="No leads yet. They appear when buyers tap WhatsApp or message you." />
            ) : visibleLeads.length === 0 ? (
              <EmptyState message="No leads match these filters." />
            ) : (
              <ul className={LIST}>
                {visibleLeads.map((lead) => (
                  <li key={lead.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{SOURCE_LABEL[lead.source] ?? lead.source} inquiry</span>
                      <span
                        className="block text-xs tabular-nums text-muted"
                        title={new Date(lead.created_at).toLocaleString()}
                      >
                        {relativeTime(lead.created_at)}
                      </span>
                    </span>
                    <StatusDot tone={lead.lead_status === "new" ? "warn" : lead.lead_status === "responded" ? "ok" : "neutral"}>
                      <span className="capitalize">{lead.lead_status}</span>
                    </StatusDot>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
