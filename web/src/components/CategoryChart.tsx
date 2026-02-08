"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CategoryData {
  name: string;
  ticket_count: number;
}

const COLORS = [
  "#818cf8", "#a78bfa", "#f472b6", "#fbbf24", "#34d399",
  "#22d3ee", "#fb923c", "#818cf8", "#2dd4bf", "#fb7185",
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#1a1a25] px-3 py-2 shadow-xl">
      <p className="text-[12px] font-medium text-gray-200">{label}</p>
      <p className="text-[12px] text-gray-400">{payload[0].value} tickets</p>
    </div>
  );
};

export default function CategoryChart({ data }: { data: CategoryData[] }) {
  if (data.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="mb-1 text-[14px] font-semibold text-gray-200">By Category</h3>
      <p className="mb-5 text-[12px] text-gray-500">Ticket distribution across categories</p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 16 }}>
          <XAxis type="number" stroke="#2a2a3e" fontSize={11} tick={{ fill: "#6b7280" }} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="transparent"
            fontSize={11}
            tick={{ fill: "#9ca3af" }}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
          <Bar dataKey="ticket_count" radius={[0, 6, 6, 0]} barSize={20}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
