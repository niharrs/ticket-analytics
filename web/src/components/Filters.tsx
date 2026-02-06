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
    "rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none";

  return (
    <div className="mb-6 flex flex-wrap gap-3">
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
        <option value="false">Unresolved</option>
      </select>

      <select
        className={selectClass}
        value={filters.days}
        onChange={(e) => update("days", e.target.value)}
      >
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
        <option value="">All time</option>
      </select>
    </div>
  );
}
