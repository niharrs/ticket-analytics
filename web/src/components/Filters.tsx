"use client";

import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  ticket_count: number;
}

interface TicketFilters {
  category: string;
  severity: string;
  resolved: string;
  days: string;
}

export default function Filters({
  filters,
  onChange,
}: {
  filters: TicketFilters;
  onChange: (f: TicketFilters) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  function update(key: keyof TicketFilters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const selectClass =
    "appearance-none rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[13px] text-gray-300 outline-none transition-all hover:bg-white/[0.05] focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer";

  return (
    <div className="flex flex-wrap gap-2">
      <select
        className={selectClass}
        value={filters.category}
        onChange={(e) => update("category", e.target.value)}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.name}>
            {c.name} ({c.ticket_count})
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={filters.severity}
        onChange={(e) => update("severity", e.target.value)}
      >
        <option value="">All Severities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <select
        className={selectClass}
        value={filters.resolved}
        onChange={(e) => update("resolved", e.target.value)}
      >
        <option value="">All Status</option>
        <option value="true">Resolved</option>
        <option value="false">Open</option>
      </select>

      <select
        className={selectClass}
        value={filters.days}
        onChange={(e) => update("days", e.target.value)}
      >
        <option value="7">7 days</option>
        <option value="30">30 days</option>
        <option value="90">90 days</option>
        <option value="">All time</option>
      </select>
    </div>
  );
}
