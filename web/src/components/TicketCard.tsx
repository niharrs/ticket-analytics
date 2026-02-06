"use client";

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

const severityColors: Record<string, string> = {
  low: "bg-green-900 text-green-300",
  medium: "bg-yellow-900 text-yellow-300",
  high: "bg-orange-900 text-orange-300",
  critical: "bg-red-900 text-red-300",
};

const sentimentColors: Record<string, string> = {
  positive: "text-green-400",
  neutral: "text-gray-400",
  negative: "text-orange-400",
  frustrated: "text-red-400",
};

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  const postedAt = ticket.discord_posted_at
    ? new Date(ticket.discord_posted_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Unknown date";

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-100">{ticket.summary || "No summary"}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ticket.categories?.map((cat) => (
              <span
                key={cat.name}
                className="inline-flex rounded-full bg-blue-900/50 px-2 py-0.5 text-xs text-blue-300"
              >
                {cat.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {ticket.severity && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityColors[ticket.severity] || ""}`}>
              {ticket.severity}
            </span>
          )}
          {ticket.resolved !== null && (
            <span className={`text-xs ${ticket.resolved ? "text-green-400" : "text-gray-500"}`}>
              {ticket.resolved ? "Resolved" : "Unresolved"}
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span>{postedAt}</span>
        {ticket.sentiment && (
          <span className={sentimentColors[ticket.sentiment] || ""}>
            {ticket.sentiment}
          </span>
        )}
        {ticket.participant_count && <span>{ticket.participant_count} participants</span>}
        {ticket.message_count && <span>{ticket.message_count} msgs</span>}
        {ticket.transcript_url && (
          <a
            href={ticket.transcript_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            transcript
          </a>
        )}
      </div>
    </div>
  );
}
