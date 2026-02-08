"use client";

import TranscriptLinks from "./TranscriptLinks";

interface InsightTicket {
  summary: string;
  severity: string;
  resolved: boolean;
  transcript_url: string;
  discord_message_id: string;
  discord_posted_at: string;
  categories: string[];
}

interface Insight {
  id: string;
  insight_text: string;
  insight_type: string;
  created_at: string;
  ticket?: InsightTicket;
  /** @deprecated use ticket.summary */
  ticket_summary?: string;
}

const typeConfig: Record<string, { bg: string; text: string; ring: string; label: string; icon: string }> = {
  feature_request: {
    bg: "bg-violet-500/8",
    text: "text-violet-300",
    ring: "ring-violet-500/15",
    label: "Feature Request",
    icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
  },
  pain_point: {
    bg: "bg-rose-500/8",
    text: "text-rose-300",
    ring: "ring-rose-500/15",
    label: "Pain Point",
    icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  },
  ux_issue: {
    bg: "bg-amber-500/8",
    text: "text-amber-300",
    ring: "ring-amber-500/15",
    label: "UX Issue",
    icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
  bug_report: {
    bg: "bg-orange-500/8",
    text: "text-orange-300",
    ring: "ring-orange-500/15",
    label: "Bug Report",
    icon: "M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75z",
  },
  general: {
    bg: "bg-gray-500/8",
    text: "text-gray-400",
    ring: "ring-gray-500/15",
    label: "General",
    icon: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z",
  },
};

const severityDot: Record<string, string> = {
  low: "bg-emerald-400",
  medium: "bg-amber-400",
  high: "bg-orange-400",
  critical: "bg-rose-400",
};

export default function InsightsList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-800/50 ring-1 ring-gray-700/50">
          <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
        </div>
        <p className="mt-4 text-sm text-gray-500">No insights yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 stagger-children">
      {insights.map((insight) => {
        const config = typeConfig[insight.insight_type] || typeConfig.general;
        const ticket = insight.ticket;
        const postedAt = ticket?.discord_posted_at
          ? new Date(ticket.discord_posted_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : null;

        return (
          <div key={insight.id} className="glass-card rounded-xl p-4">
            {/* Insight content */}
            <div className="flex items-start gap-3">
              <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md ${config.bg} px-2 py-1 text-[11px] font-semibold ${config.text} ring-1 ring-inset ${config.ring}`}>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                </svg>
                {config.label}
              </span>
              <p className="text-[13px] leading-relaxed text-gray-300">{insight.insight_text}</p>
            </div>

            {/* Source ticket */}
            {ticket && (
              <div className="mt-3 border-t border-white/[0.04] pt-3">
                <div className="flex items-start gap-2">
                  <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] leading-relaxed text-gray-500">
                      {ticket.summary}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {ticket.severity && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                          <span className={`h-1.5 w-1.5 rounded-full ${severityDot[ticket.severity] || "bg-gray-500"}`} />
                          {ticket.severity}
                        </span>
                      )}
                      {ticket.resolved !== undefined && (
                        <span className={`text-[11px] ${ticket.resolved ? "text-emerald-500/70" : "text-gray-600"}`}>
                          {ticket.resolved ? "Resolved" : "Open"}
                        </span>
                      )}
                      {postedAt && (
                        <span className="text-[11px] text-gray-600">{postedAt}</span>
                      )}
                      {ticket.categories.map((cat) => (
                        <span
                          key={cat}
                          className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-gray-500"
                        >
                          {cat}
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
            )}
          </div>
        );
      })}
    </div>
  );
}
