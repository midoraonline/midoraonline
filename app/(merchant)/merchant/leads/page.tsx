"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppSession } from "@/lib/state";
import { apiShops, apiLeads } from "@/lib/api";

type LeadStat = {
  total_leads: number;
  today_leads: number;
  new_leads: number;
};

export default function MerchantLeadsPage() {
  const session = useAppSession();
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [stats, setStats] = useState<LeadStat | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session.isAuthenticated) return;
    apiShops.myShops()
      .then((res) => {
        const shopList = (res.items || []).map((s: any) => ({ id: s.id, name: s.name }));
        setShops(shopList);
        if (shopList.length > 0) setSelectedShop(shopList[0].id);
      })
      .catch(() => {});
  }, [session.isAuthenticated]);

  const load = useCallback(async () => {
    if (!selectedShop) return;
    setLoading(true);
    try {
      const [statsRes, leadsRes] = await Promise.all([
        apiLeads.getShopLeadStats(selectedShop),
        apiLeads.listShopLeads(selectedShop).catch(() => ({ items: [] })),
      ]);
      setStats(statsRes);
      setLeads(leadsRes.items || []);
    } catch {
      setStats(null);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [selectedShop]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customer Leads</h1>
        <p className="mt-1 text-sm text-muted">Track inquiries from customers across your shops.</p>
      </div>

      {/* Shop selector */}
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

      {loading ? (
        <p className="text-sm text-muted">Loading leads...</p>
      ) : !stats ? (
        <div className="dm-card p-8 text-center text-sm text-muted">No lead data available.</div>
      ) : (
        <>
          {/* Stats cards */}
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

          {/* Leads list */}
          {leads.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Recent Leads</h2>
              {leads.map((lead: any) => (
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
