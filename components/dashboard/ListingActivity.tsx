"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Eye, Flag, Heart, MessageCircle, MessagesSquare, MousePointerClick, Phone, Share2, Star, Users } from "lucide-react";

import type { ActivityDay, ListingActivity } from "@/lib/api/shops";
import { CARD, LIST, StatStrip, formatCount as fmt } from "@/components/dashboard/ui";

export const PERIODS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "12 months" },
] as const;

export type Period = (typeof PERIODS)[number]["value"];

const AXIS = "var(--foreground-muted)";

function pct(rate: number) {
  return `${(rate * 100).toFixed(1)}%`;
}

function formatDay(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ActivityHeadline({ stats }: { stats: ListingActivity }) {
  return (
    <StatStrip
      items={[
        { label: "Impressions", value: fmt(stats.impressions), hint: `${fmt(stats.reach)} people reached`, icon: Eye },
        { label: "Listing views", value: fmt(stats.views), hint: `${pct(stats.view_rate)} of impressions`, icon: MousePointerClick },
        { label: "Contacts", value: fmt(stats.contacts), hint: `${pct(stats.contact_rate)} of views`, icon: MessageCircle },
        { label: "Likes", value: fmt(stats.likes), hint: `${fmt(stats.comments)} comments`, icon: Heart },
      ]}
    />
  );
}

export function ActivityBreakdown({ stats }: { stats: ListingActivity }) {
  const rows = [
    { label: "Impressions", hint: "Times the ad was on someone's screen for at least a second", value: stats.impressions, icon: Eye },
    { label: "People reached", hint: "Different people or devices that saw it", value: stats.reach, icon: Users },
    { label: "Boosted impressions", hint: "Impressions from boosted spots", value: stats.boosted_impressions, icon: Eye },
    { label: "Listing views", hint: "Times someone opened the ad", value: stats.views, icon: MousePointerClick },
    { label: "Unique viewers", hint: "Different people who opened it", value: stats.unique_viewers, icon: Users },
    { label: "WhatsApp clicks", value: stats.whatsapp_clicks, icon: MessageCircle },
    { label: "Calls", value: stats.call_clicks, icon: Phone },
    { label: "Messages", value: stats.messages, icon: MessagesSquare },
    { label: "Shares", value: stats.shares, icon: Share2 },
    { label: "Likes", value: stats.likes, icon: Heart },
    { label: "Comments", value: stats.comments, icon: MessagesSquare },
    { label: "Reviews", value: stats.reviews, icon: Star },
    { label: "Reports", hint: "People who reported the ad to Midora", value: stats.reports, icon: Flag },
  ];
  return (
    <ul className={LIST}>
      {rows.map(({ label, hint, value, icon: Icon }) => (
        <li key={label} className="flex items-center gap-3 px-4 py-2.5 text-sm">
          <Icon className="size-4 shrink-0 text-muted" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block">{label}</span>
            {hint ? <span className="block truncate text-xs text-muted">{hint}</span> : null}
          </span>
          <span className={`tabular-nums font-medium ${label === "Reports" && value > 0 ? "text-[color:var(--error)]" : ""}`}>
            {fmt(value)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ActivityChart({ daily }: { daily: ActivityDay[] }) {
  return (
    <div className={`${CARD} h-64 w-full p-4 sm:p-5`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={daily} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" strokeOpacity={0.8} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} tickFormatter={formatDay} minTickGap={28} />
          <YAxis tick={{ fontSize: 11, fill: AXIS }} allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip
            labelFormatter={(v) => formatDay(String(v))}
            contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 12, boxShadow: "var(--shadow-md)" }}
          />
          <Area type="monotone" dataKey="impressions" name="Impressions" stroke="var(--accent)" strokeWidth={2} fill="url(#activityFill)" />
          <Area type="monotone" dataKey="views" name="Views" stroke={AXIS} strokeWidth={1.5} strokeDasharray="4 3" fill="transparent" />
          <Area type="monotone" dataKey="contacts" name="Contacts" stroke="var(--success)" strokeWidth={1.5} fill="transparent" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
