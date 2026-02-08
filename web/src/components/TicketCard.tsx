"use client";

import TranscriptLinks from "./TranscriptLinks";

interface Ticket {
  id: string;
  discord_message_id: string;
  summary: string | null;
  severity: string | null;
  resolved: boolean | null;
  sentiment: string | null;
  participant_count: number | null;
  message_count: number | null;
  discord_posted_at: string | null;
  transcript_url: string | null;
  categories?: { name: string }[];
}

const severityConfig: Record<string, { bg: string; text: string; dot: string }> = {
  low: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  high: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400" },
  critical: { bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-400" },
};

const sentimentConfig: Record<string, { icon: string; color: string }> = {
  positive: { icon: "^", color: "text-emerald-400" },
  neutral: { icon: "-", color: "text-gray-500" },
  negative: { icon: "v", color: "text-orange-400" },
  frustrated: { icon: "!", color: "text-rose-400" },
};

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  const postedAt = ticket.discord_posted_at
    ? new Date(ticket.discord_posted_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Unknown";

  const severity = ticket.severity ? severityConfig[ticket.severity] : null;
  const sentiment = ticket.sentiment ? sentimentConfig[ticket.sentiment] : null;

  return (
    <div className="glass-card group rounded-xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] leading-relaxed text-gray-200 group-hover:text-white transition-colors">
            {ticket.summary || "No summary available"}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {ticket.categories?.map((cat) => (
              <span
                key={cat.name}
                className="inline-flex items-center rounded-md bg-indigo-500/8 px-2 py-0.5 text-[11px] font-medium text-indigo-300 ring-1 ring-inset ring-indigo-500/15"
              >
                {cat.name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {severity && (
            <span className={`inline-flex items-center gap-1.5 rounded-md ${severity.bg} px-2 py-1 text-[11px] font-semibold ${severity.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${severity.dot}`} />
              {ticket.severity}
            </span>
          )}
          {ticket.resolved !== null && (
            <span className={`text-[11px] font-medium ${ticket.resolved ? "text-emerald-400/80" : "text-gray-600"}`}>
              {ticket.resolved ? "Resolved" : "Open"}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-white/[0.04] pt-3">
        <span className="text-[12px] text-gray-500">{postedAt}</span>
        <span className="text-gray-800">|</span>

        {sentiment && (
          <span className={`text-[12px] font-medium ${sentiment.color}`}>
            {ticket.sentiment}
          </span>
        )}

        {ticket.participant_count && (
          <span className="flex items-center gap-1 text-[12px] text-gray-500">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-1.053M18 9.75a3 3 0 11-6 0 3 3 0 016 0zM6.75 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {ticket.participant_count}
          </span>
        )}

        {ticket.message_count && (
          <span className="flex items-center gap-1 text-[12px] text-gray-500">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            {ticket.message_count}
          </span>
        )}

        <div className="flex-1" />

        <TranscriptLinks
          transcriptUrl={ticket.transcript_url}
          discordMessageId={ticket.discord_message_id}
        />
      </div>
    </div>
  );
}
