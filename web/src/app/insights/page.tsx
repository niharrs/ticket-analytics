"use client";

import { useEffect, useState } from "react";
import InsightsList from "@/components/InsightsList";

interface Insight {
  id: string;
  insight_text: string;
  insight_type: string;
  created_at: string;
  ticket_summary?: string;
}

const insightTypes = [
  { value: "", label: "All", icon: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" },
  { value: "feature_request", label: "Features", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
  { value: "pain_point", label: "Pain Points", icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" },
  { value: "ux_issue", label: "UX", icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" },
  { value: "bug_report", label: "Bugs", icon: "M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75z" },
  { value: "general", label: "General", icon: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" },
];

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [allInsights, setAllInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (typeFilter) params.set("type", typeFilter);
        const res = await fetch(`/api/insights?${params}`);
        const data = await res.json();
        setInsights(data.insights || []);
        if (!typeFilter) setAllInsights(data.insights || []);
      } catch (err) {
        console.error("Failed to load insights:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [typeFilter]);

  const typeCounts: Record<string, number> = {};
  for (const i of allInsights) {
    typeCounts[i.insight_type] = (typeCounts[i.insight_type] || 0) + 1;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight gradient-text">Insights</h1>
        <p className="mt-1 text-sm text-gray-500">Product insights extracted from support conversations</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {insightTypes.map((t) => {
          const count = t.value ? typeCounts[t.value] || 0 : allInsights.length;
          const isActive = typeFilter === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                isActive
                  ? "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/25"
                  : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-300"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
              </svg>
              {t.label}
              {count > 0 && (
                <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  isActive ? "bg-indigo-500/20 text-indigo-200" : "bg-white/[0.04] text-gray-600"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : (
        <InsightsList insights={insights} />
      )}
    </div>
  );
}
