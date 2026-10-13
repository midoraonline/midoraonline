"use client";

import { useCallback, useEffect, useState } from "react";
import { apiShops, apiLeads } from "@/lib/api";
import type { Lead } from "@/lib/api/leads";
import {
  EmptyState,
  LIST,
  PageHeader,
  Section,
  StatStrip,
  StatusDot,
  UnderlineTabs,
  formatCount as fmt,
  relativeTime,
} from "@/components/dashboard/ui";

type LeadStats = {
  total_leads: number;
  today_leads: number;
  new_leads: number;
};

type ShopSummary = { id: string; name: string };

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

      {shops.length > 1 ? (
        <UnderlineTabs
          tabs={shops.map((s) => ({ value: s.id, label: s.name }))}
          value={selectedShop ?? ""}
          onChange={(v) => setSelectedShop(v)}
        />
      ) : null}

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
            ) : (
              <ul className={LIST}>
                {leads.map((lead) => (
                  <li key={lead.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium capitalize">{lead.source} inquiry</span>
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
