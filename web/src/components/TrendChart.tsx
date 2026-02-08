"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface TrendData {
  date: string;
  count: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#1a1a25] px-3 py-2 shadow-xl">
      <p className="text-[12px] font-medium text-gray-200">{label}</p>
      <p className="text-[12px] text-gray-400">{payload[0].value} tickets</p>
    </div>
  );
};

export default function TrendChart({
  data,
  title,
  subtitle,
}: {
  data: TrendData[];
  title: string;
  subtitle?: string;
}) {
  if (data.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="mb-1 text-[14px] font-semibold text-gray-200">{title}</h3>
      {subtitle && <p className="mb-5 text-[12px] text-gray-500">{subtitle}</p>}
      {!subtitle && <div className="mb-5" />}
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="transparent"
            fontSize={11}
            tick={{ fill: "#6b7280" }}
            tickFormatter={(v) => {
              const d = new Date(v);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
          />
          <YAxis stroke="transparent" fontSize={11} tick={{ fill: "#6b7280" }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#818cf8"
            strokeWidth={2}
            fill="url(#ticketGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "#818cf8", stroke: "#0a0a0f", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
