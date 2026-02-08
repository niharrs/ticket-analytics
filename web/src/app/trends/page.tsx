"use client";

import { useEffect, useState } from "react";
import TrendChart from "@/components/TrendChart";
import CategoryChart from "@/components/CategoryChart";
import TranscriptLinks from "@/components/TranscriptLinks";

interface TrendData { date: string; count: number; }
interface CategoryData { name: string; ticket_count: number; }
interface SeverityData { severity: string; count: number; }
interface Ticket {
  id: string;
  summary: string | null;
  severity: string | null;
  sentiment: string | null;
  participant_count: number | null;
  message_count: number | null;
  discord_message_id: string | null;
  discord_posted_at: string | null;
  transcript_url: string | null;
  categories?: { name: string }[];
}

const severityColors: Record<string, string> = {
  critical: "bg-rose-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

export default function TrendsPage() {
  const [dailyTrend, setDailyTrend] = useState<TrendData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [severityDist, setSeverityDist] = useState<SeverityData[]>([]);
  const [unresolvedTickets, setUnresolvedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTickets, setTotalTickets] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [ticketsRes, catsRes, unresolvedRes] = await Promise.all([
          fetch("/api/tickets?days=30"),
          fetch("/api/categories"),
          fetch("/api/tickets?resolved=false&days=30"),
        ]);
        const ticketsData = await ticketsRes.json();
        const catsData = await catsRes.json();
        const unresolvedData = await unresolvedRes.json();
        setUnresolvedTickets(unresolvedData.tickets || []);

        const byDate: Record<string, number> = {};
        const bySeverity: Record<string, number> = {};
        let resolved = 0;

        for (const t of ticketsData.tickets || []) {
          if (t.discord_posted_at) {
            const date = t.discord_posted_at.split("T")[0];
            byDate[date] = (byDate[date] || 0) + 1;
          }
          if (t.severity) bySeverity[t.severity] = (bySeverity[t.severity] || 0) + 1;
          if (t.resolved) resolved++;
        }

        setDailyTrend(
          Object.entries(byDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, count]) => ({ date, count }))
        );
        setCategories(catsData.categories || []);
        setSeverityDist(
          Object.entries(bySeverity)
            .map(([severity, count]) => ({ severity, count }))
            .sort((a, b) => {
              const order = ["critical", "high", "medium", "low"];
              return order.indexOf(a.severity) - order.indexOf(b.severity);
            })
        );
        setTotalTickets((ticketsData.tickets || []).length);
        setResolvedCount(resolved);
      } catch (err) {
        console.error("Failed to load trend data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="skeleton h-80 rounded-xl" />
          <div className="skeleton h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const avgPerDay = dailyTrend.length > 0
    ? (dailyTrend.reduce((s, d) => s + d.count, 0) / dailyTrend.length).toFixed(1)
    : "0";
  const criticalCount = severityDist.find((s) => s.severity === "critical")?.count || 0;
  const resolutionRate = totalTickets > 0 ? Math.round((resolvedCount / totalTickets) * 100) : 0;

  const stats = [
    { label: "Total Tickets", value: totalTickets, sub: "Last 30 days", glow: "glow-indigo", accent: "text-indigo-400" },
    { label: "Avg Per Day", value: avgPerDay, sub: "Daily average", glow: "glow-emerald", accent: "text-emerald-400" },
    { label: "Resolution Rate", value: `${resolutionRate}%`, sub: `${resolvedCount} resolved`, glow: "glow-amber", accent: "text-amber-400" },
    { label: "Critical", value: criticalCount, sub: "Needs attention", glow: "glow-rose", accent: "text-rose-400" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight gradient-text">Trends</h1>
        <p className="mt-1 text-sm text-gray-500">Ticket volume and distribution over time</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        {stats.map((stat) => (
          <div key={stat.label} className={`glass-card rounded-xl p-5 ${stat.glow}`}>
            <p className="text-[12px] font-medium text-gray-500">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
            <p className="mt-1 text-[11px] text-gray-600">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart data={dailyTrend} title="Ticket Volume" subtitle="Daily ticket count over 30 days" />
        <CategoryChart data={categories.filter((c) => c.ticket_count > 0)} />

        <div className="glass-card rounded-xl p-5">
          <h3 className="mb-1 text-[14px] font-semibold text-gray-200">Severity Breakdown</h3>
          <p className="mb-5 text-[12px] text-gray-500">Distribution across severity levels</p>
          <div className="space-y-4">
            {severityDist.map((s) => {
              const maxCount = Math.max(...severityDist.map((x) => x.count));
              const pct = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
              return (
                <div key={s.severity}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[13px] font-medium capitalize text-gray-300">{s.severity}</span>
                    <span className="text-[13px] tabular-nums text-gray-500">{s.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/[0.04]">
                    <div
                      className={`h-2 rounded-full ${severityColors[s.severity] || "bg-gray-500"} transition-all duration-500`}
                      style={{ width: `${Math.max(pct, 2)}%`, opacity: 0.7 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="mb-1 text-[14px] font-semibold text-gray-200">Active Categories</h3>
          <p className="mb-5 text-[12px] text-gray-500">Categories with tickets in the last 30 days</p>
          <div className="flex flex-wrap gap-2">
            {categories
              .filter((c) => c.ticket_count > 0)
              .map((c) => (
                <span
                  key={c.name}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/8 px-3 py-1.5 text-[12px] font-medium text-indigo-300 ring-1 ring-inset ring-indigo-500/15"
                >
                  {c.name}
                  <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-200">
                    {c.ticket_count}
                  </span>
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Unresolved tickets grouped by severity */}
      {unresolvedTickets.length > 0 && <UnresolvedSection tickets={unresolvedTickets} />}
    </div>
  );
}

/* ── Unresolved Section ─────────────────────────────────────────── */

const severityOrder = ["critical", "high", "medium", "low"] as const;

const severityGroupConfig: Record<string, { label: string; desc: string; accent: string; dot: string; ringBg: string; ring: string }> = {
  critical: { label: "Critical", desc: "Requires immediate attention", accent: "text-rose-400", dot: "bg-rose-400", ringBg: "bg-rose-500/10", ring: "ring-rose-500/20" },
  high: { label: "High", desc: "Should be addressed soon", accent: "text-orange-400", dot: "bg-orange-400", ringBg: "bg-orange-500/10", ring: "ring-orange-500/20" },
  medium: { label: "Medium", desc: "Normal priority", accent: "text-amber-400", dot: "bg-amber-400", ringBg: "bg-amber-500/10", ring: "ring-amber-500/20" },
  low: { label: "Low", desc: "Can be addressed later", accent: "text-emerald-400", dot: "bg-emerald-400", ringBg: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
};

const sentimentWeight: Record<string, number> = { frustrated: 0, negative: 1, neutral: 2, positive: 3 };

function UnresolvedSection({ tickets }: { tickets: Ticket[] }) {
  // Group by severity
  const groups: Record<string, Ticket[]> = {};
  for (const t of tickets) {
    const sev = t.severity || "low";
    if (!groups[sev]) groups[sev] = [];
    groups[sev].push(t);
  }

  // Within each group, sort: frustrated/negative sentiment first, then by date (newest first)
  for (const sev of Object.keys(groups)) {
    groups[sev].sort((a, b) => {
      const sw = (sentimentWeight[a.sentiment || "neutral"] ?? 2) - (sentimentWeight[b.sentiment || "neutral"] ?? 2);
      if (sw !== 0) return sw;
      return (b.discord_posted_at || "").localeCompare(a.discord_posted_at || "");
    });
  }

  return (
    <div className="mt-8">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-200">
          Unresolved Tickets
          <span className="ml-2 rounded-full bg-rose-500/10 px-2 py-0.5 text-[12px] font-semibold text-rose-400 ring-1 ring-inset ring-rose-500/20">
            {tickets.length}
          </span>
        </h2>
        <p className="mt-1 text-[12px] text-gray-500">
          Open tickets grouped by severity — frustrated users surfaced first
        </p>
      </div>

      <div className="space-y-6">
        {severityOrder.map((sev) => {
          const group = groups[sev];
          if (!group || group.length === 0) return null;
          const cfg = severityGroupConfig[sev];

          return (
            <div key={sev}>
              {/* Group header */}
              <div className="mb-2 flex items-center gap-2">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${cfg.ringBg} ring-1 ${cfg.ring}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                </span>
                <span className={`text-[13px] font-semibold ${cfg.accent}`}>{cfg.label}</span>
                <span className="text-[11px] text-gray-600">{cfg.desc}</span>
                <span className="ml-auto text-[12px] tabular-nums text-gray-600">{group.length} ticket{group.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Tickets in group */}
              <div className="space-y-1.5">
                {group.map((ticket) => (
                  <UnresolvedTicketRow key={ticket.id} ticket={ticket} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UnresolvedTicketRow({ ticket }: { ticket: Ticket }) {
  const postedAt = ticket.discord_posted_at
    ? new Date(ticket.discord_posted_at).toLocaleDateString("en-US", {
        month: "short", day: "numeric",
      })
    : null;

  const isFrustrated = ticket.sentiment === "frustrated";
  const isNegative = ticket.sentiment === "negative";

  return (
    <div className={`glass-card rounded-xl p-4 ${isFrustrated ? "!border-rose-500/15" : ""}`}>
      <div className="flex items-start gap-3">
        {/* Sentiment indicator */}
        {isFrustrated && (
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/15">
            <svg className="h-3 w-3 text-rose-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className={`text-[13px] leading-relaxed ${isFrustrated ? "text-gray-200" : "text-gray-300"}`}>
            {ticket.summary || "No summary"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {(isFrustrated || isNegative) && (
              <span className={`text-[11px] font-medium ${isFrustrated ? "text-rose-400/80" : "text-orange-400/70"}`}>
                {ticket.sentiment}
              </span>
            )}
            {postedAt && <span className="text-[11px] text-gray-600">{postedAt}</span>}
            {ticket.participant_count && (
              <span className="text-[11px] text-gray-600">{ticket.participant_count} participants</span>
            )}
            {ticket.categories?.map((cat) => (
              <span key={cat.name} className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-gray-500">
                {cat.name}
              </span>
            ))}
            <TranscriptLinks
              transcriptUrl={ticket.transcript_url}
              discordMessageId={ticket.discord_message_id}
              className="ml-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
