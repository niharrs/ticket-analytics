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
  const [filters, setFilters] = useState<TicketFilters>({
    category: "",
    severity: "",
    resolved: "",
    days: "30",
  });

  useEffect(() => {
    async function load() {
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
    load();
  }, [filters]);

  return (
    <div>
      <Filters filters={filters} onChange={setFilters} />
      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No tickets found</div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}
