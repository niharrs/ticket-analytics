"use client";

interface Insight {
  id: string;
  insight_text: string;
  insight_type: string;
  created_at: string;
  ticket_summary?: string;
}

const typeColors: Record<string, string> = {
  feature_request: "bg-purple-900/50 text-purple-300",
  pain_point: "bg-red-900/50 text-red-300",
  ux_issue: "bg-orange-900/50 text-orange-300",
  bug_report: "bg-yellow-900/50 text-yellow-300",
  general: "bg-gray-800 text-gray-300",
};

const typeLabels: Record<string, string> = {
  feature_request: "Feature Request",
  pain_point: "Pain Point",
  ux_issue: "UX Issue",
  bug_report: "Bug Report",
  general: "General",
};

export default function InsightsList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return <div className="py-8 text-center text-gray-500">No insights yet</div>;
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => (
        <div
          key={insight.id}
          className="rounded-lg border border-gray-800 bg-gray-900 p-4"
        >
          <div className="flex items-start gap-3">
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                typeColors[insight.insight_type] || typeColors.general
              }`}
            >
              {typeLabels[insight.insight_type] || insight.insight_type}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-gray-200">{insight.insight_text}</p>
              {insight.ticket_summary && (
                <p className="mt-1 text-xs text-gray-500">
                  From: {insight.ticket_summary}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
