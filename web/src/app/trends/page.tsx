"use client";

import { useEffect, useState } from "react";
import TrendChart from "@/components/TrendChart";
import CategoryChart from "@/components/CategoryChart";

interface TrendData {
  date: string;
  count: number;
}

interface CategoryData {
  name: string;
  ticket_count: number;
}

interface SeverityData {
  severity: string;
  count: number;
}

export default function TrendsPage() {
  const [dailyTrend, setDailyTrend] = useState<TrendData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [severityDist, setSeverityDist] = useState<SeverityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ticketsRes, catsRes] = await Promise.all([
          fetch("/api/tickets?days=30"),
          fetch("/api/categories"),
        ]);
        const ticketsData = await ticketsRes.json();
        const catsData = await catsRes.json();

        // Build daily trend from tickets
        const byDate: Record<string, number> = {};
        const bySeverity: Record<string, number> = {};

        for (const t of ticketsData.tickets || []) {
          if (t.discord_posted_at) {
            const date = t.discord_posted_at.split("T")[0];
            byDate[date] = (byDate[date] || 0) + 1;
          }
          if (t.severity) {
            bySeverity[t.severity] = (bySeverity[t.severity] || 0) + 1;
          }
        }

        const trend = Object.entries(byDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, count }));

        const severity = Object.entries(bySeverity).map(([severity, count]) => ({
          severity,
          count,
        }));

        setDailyTrend(trend);
        setCategories(catsData.categories || []);
        setSeverityDist(severity);
      } catch (err) {
        console.error("Failed to load trend data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading trends...</div>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Trends</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart data={dailyTrend} title="Tickets per Day (Last 30 Days)" />
        <CategoryChart data={categories.filter((c) => c.ticket_count > 0)} />
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h3 className="mb-4 text-sm font-medium text-gray-300">Severity Distribution</h3>
          <div className="space-y-2">
            {severityDist.map((s) => (
              <div key={s.severity} className="flex items-center justify-between">
                <span className="text-sm capitalize text-gray-300">{s.severity}</span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{
                      width: `${Math.max(
                        (s.count / Math.max(...severityDist.map((x) => x.count))) * 200,
                        8
                      )}px`,
                    }}
                  />
                  <span className="text-sm text-gray-400">{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h3 className="mb-4 text-sm font-medium text-gray-300">Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-white">{dailyTrend.reduce((s, d) => s + d.count, 0)}</p>
              <p className="text-xs text-gray-500">Total Tickets (30d)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {dailyTrend.length > 0
                  ? (dailyTrend.reduce((s, d) => s + d.count, 0) / dailyTrend.length).toFixed(1)
                  : 0}
              </p>
              <p className="text-xs text-gray-500">Avg/Day</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{categories.filter((c) => c.ticket_count > 0).length}</p>
              <p className="text-xs text-gray-500">Active Categories</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {severityDist.find((s) => s.severity === "critical")?.count || 0}
              </p>
              <p className="text-xs text-gray-500">Critical Tickets</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
