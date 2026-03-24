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
import { Creative } from "@/lib/types";

interface Props {
  data: Creative[];
  metric: "ROAS" | "COST" | "CV" | "CVR" | "CTVR";
}

const COLORS = ["#6c63ff", "#7d75ff", "#8e87ff", "#9f99ff", "#b0abff", "#c1bdff", "#d2d0ff", "#e3e2ff", "#a78bfa", "#818cf8"];

function shortLabel(crName: string): string {
  // Extract a short readable label from CR名
  const afterDash = crName.split("-").slice(1);
  // find the human-readable part (Japanese characters)
  const jp = afterDash.find((s) => /[\u3040-\u30ff\u4e00-\u9fff]/.test(s));
  return jp || afterDash[0] || crName.slice(0, 20);
}

const metricLabels: Record<string, string> = {
  ROAS: "ROAS (%)",
  COST: "コスト (¥)",
  CV: "CV数",
  CVR: "CVR (%)",
  CTVR: "CTVR (%)",
};

const PCT_METRICS = new Set(["ROAS", "CVR", "CTVR"]);

export default function TopChart({ data, metric }: Props) {
  const active = data
    .filter((d) => d[metric] > 0)
    .sort((a, b) => b[metric] - a[metric])
    .slice(0, 10)
    .map((d) => ({
      name: shortLabel(d["CR名"]),
      value: PCT_METRICS.has(metric) ? +(d[metric] * 100).toFixed(4) : +d[metric].toFixed(2),
      size: d["CRサイズ"],
      crName: d["CR名"],
    }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { crName: string; size: string; value: number } }> }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="card p-3 text-xs max-w-xs" style={{ borderColor: "#6c63ff" }}>
          <p className="font-bold text-white mb-1">{p.crName.slice(0, 60)}...</p>
          <p style={{ color: "#8888aa" }}>サイズ: {p.size}</p>
          <p style={{ color: "#43d9ad" }} className="mt-1 font-bold">
            {metricLabels[metric]}: {p.value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--muted-text)" }}>
        TOP 10 クリエイティブ — {metricLabels[metric]}
      </h3>
      {active.length === 0 ? (
        <p className="text-center py-8" style={{ color: "var(--muted-text)" }}>データなし</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={active} layout="vertical" margin={{ left: 8, right: 24 }}>
            <XAxis type="number" tick={{ fill: "#8888aa", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fill: "#ccccee", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(108,99,255,0.1)" }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {active.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
