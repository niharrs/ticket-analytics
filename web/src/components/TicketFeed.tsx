"use client";

import { useEffect, useState } from "react";
import TicketCard from "./TicketCard";
import Filters from "./Filters";

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

interface TicketFilters {
  category: string;
  severity: string;
  resolved: string;
  days: string;
}

export default function TicketFeed() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [filters, setFilters] = useState<TicketFilters>({
    category: "",
    severity: "",
    resolved: "",
    days: "30",
  });

  async function loadTickets() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.severity) params.set("severity", filters.severity);
    if (filters.resolved) params.set("resolved", filters.resolved);
    if (filters.days) params.set("days", filters.days);

    try {
      const res = await fetch(`/api/tickets?${params}`);
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setSyncResult(`Error: ${data.error}`);
      } else {
        setSyncResult(`${data.processed} new tickets synced`);
      }
      await loadTickets();
    } catch (err) {
      setSyncResult(`Sync failed: ${(err as Error).message}`);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => { loadTickets(); }, [filters]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Filters filters={filters} onChange={setFilters} />
        <div className="flex items-center gap-3 shrink-0">
          {syncResult && (
            <span className="animate-fade-in text-[13px] text-gray-500">{syncResult}</span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`group relative flex items-center gap-2 rounded-lg bg-indigo-500/10 px-4 py-2.5 text-[13px] font-medium text-indigo-300 ring-1 ring-indigo-500/20 transition-all hover:bg-indigo-500/15 hover:ring-indigo-500/30 disabled:opacity-50 ${syncing ? "animate-pulse-ring" : ""}`}
          >
            <svg className={`h-4 w-4 ${syncing ? "animate-spin" : "transition-transform group-hover:rotate-180"}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            {syncing ? "Syncing..." : "Pull Latest"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-28 w-full" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-800/50 ring-1 ring-gray-700/50">
            <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </div>
          <p className="mt-4 text-sm text-gray-500">No tickets found</p>
          <p className="mt-1 text-xs text-gray-600">Try adjusting your filters or pull latest tickets</p>
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}
