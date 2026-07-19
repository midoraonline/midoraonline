"use client";

import { useCallback, useEffect, useState } from "react";
import { apiShops, apiLeads } from "@/lib/api";
import type { Lead } from "@/lib/api/leads";

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
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">Track inquiries from customers across your shops.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {shops.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelectedShop(s.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              selectedShop === s.id ? "bg-accent text-white" : "bg-foreground/[0.06] text-muted hover:text-foreground"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {!stats ? (
        <div className="dm-card p-8 text-center text-sm text-muted">No lead data available.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="dm-card p-4">
              <p className="text-2xl font-semibold">{stats.total_leads}</p>
              <p className="text-xs text-muted">Total Leads</p>
            </div>
            <div className="dm-card p-4">
              <p className="text-2xl font-semibold">{stats.new_leads}</p>
              <p className="text-xs text-muted">New Leads</p>
            </div>
            <div className="dm-card p-4">
              <p className="text-2xl font-semibold">{stats.today_leads}</p>
              <p className="text-xs text-muted">Today</p>
            </div>
          </div>

          {leads.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Recent Leads</h2>
              {leads.map((lead) => (
                <div key={lead.id} className="dm-card p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium capitalize">{lead.source} inquiry</p>
                      <p className="text-xs text-muted">{new Date(lead.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      lead.lead_status === "new" ? "bg-blue-500/10 text-blue-600"
                      : lead.lead_status === "responded" ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-foreground/[0.06] text-muted"
                    }`}>
                      {lead.lead_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
