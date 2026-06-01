"use client";

import { useCallback, useEffect, useState } from "react";
import { apiAdmin } from "@/lib/api";
import type { AdminReport } from "@/lib/api/admin";
import { MaterialSymbol } from "@/components/MaterialSymbol";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: { resolved?: boolean; limit?: number } = { limit: 100 };
      if (filter === "open") params.resolved = false;
      else if (filter === "resolved") params.resolved = true;
      const res = await apiAdmin.listReports(params);
      setReports(res.items);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (id: string) => {
    try {
      await apiAdmin.resolveReport(id);
      load();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Product Reports</h1>
          <p className="mt-1 text-sm text-muted">Review and resolve listing reports from users.</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(["open", "resolved", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              filter === f ? "bg-accent text-white" : "bg-foreground/[0.06] text-muted hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : f === "open" ? "Open" : "Resolved"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading reports...</p>
      ) : reports.length === 0 ? (
        <div className="dm-card p-8 text-center text-sm text-muted">No reports found.</div>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className={`dm-card flex items-start gap-4 p-4 ${r.resolved ? "opacity-50" : ""}`}>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    r.resolved ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                  }`}>
                    {r.resolved ? "Resolved" : "Open"}
                  </span>
                  <span className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium">{r.reason}</p>
                {r.description && <p className="text-xs text-muted">{r.description}</p>}
                <div className="flex gap-3 text-[10px] text-muted">
                  {r.product?.title && <span>Product: {r.product.title}</span>}
                  {r.reporter?.full_name && <span>By: {r.reporter.full_name}</span>}
                </div>
              </div>
              {!r.resolved && (
                <button
                  type="button"
                  onClick={() => handleResolve(r.id)}
                  className="dm-focus shrink-0 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20"
                >
                  Resolve
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
