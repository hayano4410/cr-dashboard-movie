"use client";
import { useState, useMemo } from "react";
import { Creative, SortKey, SortDir } from "@/lib/types";
import CreativePanel from "@/components/CreativePanel";

interface Props {
  data: Creative[];
}

function fmt(n: number, type: "num" | "pct" | "yen" | "raw" = "num") {
  if (!isFinite(n) || n === 0) return <span style={{ color: "#4a4a6a" }}>—</span>;
  if (type === "pct") return <span>{(n * 100).toFixed(2)}%</span>;
  if (type === "yen") return <span>¥{Math.round(n).toLocaleString()}</span>;
  if (type === "raw") return <span>{n.toLocaleString()}</span>;
  return <span>{n.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>;
}

function shortCRName(crName: string): string {
  const parts = crName.split("_");
  const lastPart = parts.slice(8).join("_");
  const segments = lastPart.split("-");
  // find Japanese title segments
  const jpParts = segments.filter((s) => /[\u3040-\u30ff\u4e00-\u9fff]/.test(s));
  return jpParts.length > 0 ? jpParts.slice(0, 2).join("-") : segments.slice(0, 2).join("-");
}

const SORT_KEYS: { key: SortKey; label: string }[] = [
  { key: "ROAS", label: "ROAS" },
  { key: "CV", label: "CV" },
  { key: "COST", label: "COST" },
  { key: "IMP", label: "IMP" },
  { key: "Click", label: "Click" },
  { key: "CTR", label: "CTR" },
  { key: "CVR", label: "CVR" },
  { key: "CTVR", label: "CTVR" },
  { key: "CPA", label: "CPA" },
  { key: "LTV", label: "LTV" },
];

const SIZE_COLORS: Record<string, string> = {
  "600x500": "#6c63ff",
  "640x100": "#43d9ad",
  "640x200": "#ff9f43",
  "160x600": "#ff6584",
  "300x600": "#ffd700",
  "728x80": "#a78bfa",
};

export default function CreativeTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("ROAS");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);

  const sizes = useMemo(() => ["all", ...Array.from(new Set(data.map((d) => d["CRサイズ"])))], [data]);
  const targets = useMemo(() => ["all", "男性向けSP", "男性向けPC", "女性向けSP"], []);

  const sorted = useMemo(() => {
    let filtered = data.filter((d) => {
      const matchSearch = search === "" || d["CR名"].toLowerCase().includes(search.toLowerCase());
      const matchSize = sizeFilter === "all" || d["CRサイズ"] === sizeFilter;
      const matchTarget = targetFilter === "all" || d.target === targetFilter;
      return matchSearch && matchSize && matchTarget;
    });
    filtered.sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortDir === "desc" ? -diff : diff;
    });
    return filtered;
  }, [data, sortKey, sortDir, search, sizeFilter, targetFilter]);

  const displayed = showAll ? sorted : sorted.slice(0, 30);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span style={{ color: "#4a4a6a" }}>↕</span>;
    return <span style={{ color: "#6c63ff" }}>{sortDir === "desc" ? "↓" : "↑"}</span>;
  }

  return (
    <>
    <CreativePanel creative={selectedCreative} onClose={() => setSelectedCreative(null)} />
    <div className="card overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b flex flex-col gap-3" style={{ borderColor: "var(--card-border)" }}>
        {/* Row 1: search + count */}
        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="CR名で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm flex-1 min-w-48"
            style={{ background: "#0f0f13", border: "1px solid var(--card-border)", color: "var(--foreground)" }}
          />
          <span className="text-xs whitespace-nowrap" style={{ color: "var(--muted-text)" }}>
            {sorted.length}件
          </span>
        </div>
        {/* Row 2: target filter */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs font-semibold" style={{ color: "var(--muted-text)" }}>ターゲット：</span>
          {targets.map((t) => {
            const TARGET_COLORS: Record<string, string> = {
              "男性向けSP": "#6c63ff",
              "男性向けPC": "#43d9ad",
              "女性向けSP": "#ff6584",
            };
            const color = TARGET_COLORS[t] || "#6c63ff";
            const active = targetFilter === t;
            return (
              <button
                key={t}
                onClick={() => setTargetFilter(t)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: active ? color : "#1a1a24",
                  color: active ? "#fff" : "var(--muted-text)",
                  border: `1px solid ${active ? color : "var(--card-border)"}`,
                }}
              >
                {t === "all" ? "すべて" : t}
              </button>
            );
          })}
        </div>
        {/* Row 3: size filter */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs font-semibold" style={{ color: "var(--muted-text)" }}>サイズ：</span>
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSizeFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: sizeFilter === s ? (SIZE_COLORS[s] || "#6c63ff") : "#1a1a24",
                color: sizeFilter === s ? "#fff" : "var(--muted-text)",
                border: `1px solid ${sizeFilter === s ? (SIZE_COLORS[s] || "#6c63ff") : "var(--card-border)"}`,
              }}
            >
              {s === "all" ? "すべて" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", background: "#14141e" }}>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--muted-text)", minWidth: 200 }}>
                CR名
              </th>
              <th className="px-3 py-3 text-xs font-semibold" style={{ color: "var(--muted-text)" }}>ターゲット</th>
              <th className="px-3 py-3 text-xs font-semibold" style={{ color: "var(--muted-text)" }}>サイズ</th>
              {SORT_KEYS.map(({ key, label }) => (
                <th
                  key={key}
                  className="px-3 py-3 text-xs font-semibold cursor-pointer select-none text-right"
                  style={{ color: sortKey === key ? "#6c63ff" : "var(--muted-text)" }}
                  onClick={() => handleSort(key)}
                >
                  {label} <SortIcon k={key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((row) => (
              <tr
                key={row.id}
                className="table-row-hover"
                style={{ borderBottom: "1px solid rgba(42,42,58,0.5)" }}
              >
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedCreative(row)}
                    className="text-left group"
                    title={row["CR名"]}
                  >
                    <div
                      className="font-medium text-xs leading-snug max-w-xs group-hover:underline"
                      style={{ color: "var(--accent)" }}
                    >
                      {shortCRName(row["CR名"]) || row["CR名"].slice(0, 40)}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--muted-text)" }}>
                      {row["期間"]}
                    </div>
                  </button>
                </td>
                <td className="px-3 py-3 text-center">
                  {(() => {
                    const TARGET_COLORS: Record<string, string> = {
                      "男性向けSP": "#6c63ff",
                      "男性向けPC": "#43d9ad",
                      "女性向けSP": "#ff6584",
                    };
                    const c = TARGET_COLORS[row.target] || "#8888aa";
                    return (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: c + "22", color: c }}
                      >
                        {row.target}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-3 py-3 text-center">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: (SIZE_COLORS[row["CRサイズ"]] || "#6c63ff") + "22",
                      color: SIZE_COLORS[row["CRサイズ"]] || "#6c63ff",
                    }}
                  >
                    {row["CRサイズ"]}
                  </span>
                </td>
                <td className="px-3 py-3 text-right text-xs font-mono">
                  <span style={{ color: row.ROAS >= 3 ? "#43d9ad" : row.ROAS > 0 ? "#ff9f43" : "var(--muted-text)" }}>
                    {row.ROAS > 0 ? (row.ROAS * 100).toFixed(0) + "%" : "—"}
                  </span>
                </td>
                <td className="px-3 py-3 text-right text-xs font-mono">
                  <span style={{ color: row.CV > 0 ? "#ffd700" : "var(--muted-text)" }}>
                    {row.CV > 0 ? row.CV : "—"}
                  </span>
                </td>
                <td className="px-3 py-3 text-right text-xs font-mono">{fmt(row.COST, "yen")}</td>
                <td className="px-3 py-3 text-right text-xs font-mono">{fmt(row.IMP, "raw")}</td>
                <td className="px-3 py-3 text-right text-xs font-mono">{fmt(row.Click, "raw")}</td>
                <td className="px-3 py-3 text-right text-xs font-mono">{fmt(row.CTR, "pct")}</td>
                <td className="px-3 py-3 text-right text-xs font-mono">{fmt(row.CVR, "pct")}</td>
                <td className="px-3 py-3 text-right text-xs font-mono">{fmt(row.CTVR, "pct")}</td>
                <td className="px-3 py-3 text-right text-xs font-mono">{fmt(row.CPA, "yen")}</td>
                <td className="px-3 py-3 text-right text-xs font-mono">{fmt(row.LTV, "yen")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length > 30 && (
        <div className="p-4 text-center border-t" style={{ borderColor: "var(--card-border)" }}>
          <button
            onClick={() => setShowAll((v) => !v)}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: "#1a1a24", color: "#6c63ff", border: "1px solid #6c63ff" }}
          >
            {showAll ? "▲ 折りたたむ" : `▼ 残り ${sorted.length - 30}件を表示`}
          </button>
        </div>
      )}
    </div>
    </>
  );
}
