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
  { value: "", label: "All Types" },
  { value: "feature_request", label: "Feature Requests" },
  { value: "pain_point", label: "Pain Points" },
  { value: "ux_issue", label: "UX Issues" },
  { value: "bug_report", label: "Bug Reports" },
  { value: "general", label: "General" },
];

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
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
      } catch (err) {
        console.error("Failed to load insights:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [typeFilter]);

  // Group insights by type for summary
  const typeCounts: Record<string, number> = {};
  for (const i of insights) {
    typeCounts[i.insight_type] = (typeCounts[i.insight_type] || 0) + 1;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Product Insights</h1>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-2">
          {insightTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                typeFilter === t.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
              {t.value && typeCounts[t.value] ? ` (${typeCounts[t.value]})` : ""}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading insights...</div>
      ) : (
        <InsightsList insights={insights} />
      )}
    </div>
  );
}
