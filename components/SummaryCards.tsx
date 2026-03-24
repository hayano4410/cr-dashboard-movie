"use client";
import { Creative } from "@/lib/types";

interface Props {
  data: Creative[];
}

function fmt(n: number, type: "num" | "pct" | "yen" = "num") {
  if (!isFinite(n) || n === 0) return "—";
  if (type === "pct") return (n * 100).toFixed(2) + "%";
  if (type === "yen") return "¥" + Math.round(n).toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function SummaryCards({ data }: Props) {
  const active = data.filter((d) => d.IMP > 0);
  const totalIMP = data.reduce((s, d) => s + d.IMP, 0);
  const totalClick = data.reduce((s, d) => s + d.Click, 0);
  const totalCV = data.reduce((s, d) => s + d.CV, 0);
  const totalCOST = data.reduce((s, d) => s + d.COST, 0);
  const totalLTV = data.reduce((s, d) => s + d.LTV, 0);
  const avgROAS = totalCOST > 0 ? totalLTV / totalCOST : 0;
  const avgCTR = totalIMP > 0 ? totalClick / totalIMP : 0;
  const avgCPA = totalCV > 0 ? totalCOST / totalCV : 0;

  const cards = [
    { label: "IMP", value: fmt(totalIMP), sub: "総インプレッション", color: "#6c63ff" },
    { label: "Click", value: fmt(totalClick), sub: "総クリック数", color: "#43d9ad" },
    { label: "CV", value: fmt(totalCV, "num"), sub: "総コンバージョン", color: "#ffd700" },
    { label: "COST", value: fmt(totalCOST, "yen"), sub: "総コスト", color: "#ff6584" },
    { label: "ROAS", value: fmt(avgROAS * 100, "num") + "%", sub: "平均ROAS", color: "#43d9ad" },
    { label: "CTR", value: fmt(avgCTR, "pct"), sub: "平均CTR", color: "#6c63ff" },
    { label: "CPA", value: fmt(avgCPA, "yen"), sub: "平均CPA", color: "#ff9f43" },
    { label: "CR数", value: active.length + "/" + data.length, sub: "配信中/総数", color: "#8888aa" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="card p-4">
          <p className="text-xs font-semibold tracking-widest" style={{ color: c.color }}>
            {c.label}
          </p>
          <p className="text-2xl font-bold mt-1 text-white">{c.value}</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted-text)" }}>
            {c.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
