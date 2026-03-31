"use client";
import { useMemo, useState } from "react";
import { MediaRow, Creative } from "@/lib/types"; // Creative は toCreative の戻り値型として使用
import CreativePanel from "@/components/CreativePanel";

/** MediaRow → CreativePanel が受け付ける Creative 型へ変換 */
function toCreative(row: MediaRow): Creative {
  const cpa = row.CV > 0 ? row.COST / row.CV : 0;
  const ctr = row.IMP > 0 ? row.Click / row.IMP : 0;
  const cvr = row.Click > 0 ? row.CV / row.Click : 0;
  const ctvr = row.IMP > 0 ? row.CV / row.IMP : 0;
  return {
    id: 0,
    日付: row.日付,
    CR名: row.CR名,
    計測URL: "",
    計測用URL: "",
    LTV: 0,
    COST: row.COST,
    ROAS: 0,
    CV: row.CV,
    CPA: cpa,
    IMP: row.IMP,
    Click: row.Click,
    CRサイズ: row.CRサイズ,
    CTR: ctr,
    CVR: cvr,
    CTVR: ctvr,
    media: row.メディア,
    device: "",
    listType: "",
    shortName: "",
    creativePart: "",
    target: row.target,
  };
}

interface MediaStats {
  メディア: string;
  COST: number;
  IMP: number;
  Click: number;
  CV: number;
  CTR: number;
  CPC: number;
  CPM: number;
  CVR: number;
  CPA: number;
  CTVR: number;
  cvBySize: Record<string, number>;
}

type MediaSortKey = "COST" | "IMP" | "Click" | "CV" | "CTR" | "CPC" | "CPM" | "CVR" | "CPA" | "CTVR";

const TARGETS = ["すべて", "男性向けSP", "男性向けPC", "女性向けSP"];
const TARGET_COLORS: Record<string, string> = {
  "男性向けSP": "#6c63ff",
  "男性向けPC": "#43d9ad",
  "女性向けSP": "#ff6584",
};

const MEDIA_SORT_COLS: { key: MediaSortKey; label: string }[] = [
  { key: "COST", label: "COST" },
  { key: "IMP", label: "IMP" },
  { key: "Click", label: "Click" },
  { key: "CV", label: "CV" },
  { key: "CTR", label: "CTR" },
  { key: "CPC", label: "CPC" },
  { key: "CPM", label: "CPM" },
  { key: "CVR", label: "CVR" },
  { key: "CPA", label: "CPA" },
  { key: "CTVR", label: "CTVR" },
];

function fmtYen(n: number) {
  return isFinite(n) && n > 0 ? "¥" + Math.round(n).toLocaleString() : "—";
}
function fmtNum(n: number) {
  return n > 0 ? n.toLocaleString() : "—";
}
function fmtPct(n: number) {
  return isFinite(n) && n > 0 ? (n * 100).toFixed(2) + "%" : "—";
}

function shortCRLabel(crName: string): string {
  const parts = crName.split("_");
  const tail = parts.slice(8).join("_");
  const segs = tail.split("-");
  const jp = segs.filter((s) => /[\u3040-\u30ff\u4e00-\u9fff]/.test(s));
  return jp.length > 0 ? jp.slice(0, 2).join("-") : segs.slice(0, 2).join("-");
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xs font-bold tracking-widest mb-3 uppercase"
      style={{ color: "var(--muted-text)" }}
    >
      {children}
    </h2>
  );
}

interface Props {
  mediaData: MediaRow[];
}

export default function MediaDashboard({ mediaData }: Props) {
  const [targetFilter, setTargetFilter] = useState("すべて");
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
  const [sortKey, setSortKey] = useState<MediaSortKey>("COST");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // ターゲットフィルタ適用
  const filtered = useMemo(
    () =>
      mediaData.filter((r) => {
        if (targetFilter === "すべて") return true;
        return r.target === targetFilter;
      }),
    [mediaData, targetFilter]
  );

  // メディア別集計
  const mediaStats = useMemo((): MediaStats[] => {
    const map = new Map<
      string,
      { COST: number; IMP: number; Click: number; CV: number; cvBySize: Record<string, number> }
    >();
    for (const row of filtered) {
      const s = map.get(row.メディア) ?? { COST: 0, IMP: 0, Click: 0, CV: 0, cvBySize: {} };
      s.COST += row.COST;
      s.IMP += row.IMP;
      s.Click += row.Click;
      s.CV += row.CV;
      if (row.CV > 0) {
        s.cvBySize[row.CRサイズ] = (s.cvBySize[row.CRサイズ] ?? 0) + row.CV;
      }
      map.set(row.メディア, s);
    }
    return Array.from(map.entries()).map(([media, s]) => ({
      メディア: media,
      COST: s.COST,
      IMP: s.IMP,
      Click: s.Click,
      CV: s.CV,
      CTR: s.IMP > 0 ? s.Click / s.IMP : 0,
      CPC: s.Click > 0 ? s.COST / s.Click : 0,
      CPM: s.IMP > 0 ? (s.COST / s.IMP) * 1000 : 0,
      CVR: s.Click > 0 ? s.CV / s.Click : 0,
      CPA: s.CV > 0 ? s.COST / s.CV : 0,
      CTVR: s.IMP > 0 ? s.CV / s.IMP : 0,
      cvBySize: s.cvBySize,
    }));
  }, [filtered]);

  // CV≥1 または COST上位20 に絞り込み
  const displayedMedia = useMemo(() => {
    const byCost = [...mediaStats].sort((a, b) => b.COST - a.COST);
    const top20 = new Set(byCost.slice(0, 20).map((m) => m.メディア));
    return mediaStats.filter((m) => m.CV >= 1 || top20.has(m.メディア));
  }, [mediaStats]);

  // ソート
  const sortedMedia = useMemo(
    () =>
      [...displayedMedia].sort((a, b) => {
        const diff = a[sortKey] - b[sortKey];
        return sortDir === "desc" ? -diff : diff;
      }),
    [displayedMedia, sortKey, sortDir]
  );

  // CV発生CR一覧（CV>0）
  const cvCRRows = useMemo(() => {
    const map = new Map<string, MediaRow & { IMP: number; Click: number; COST: number; CV: number }>();
    for (const r of filtered) {
      if (r.CV <= 0) continue;
      const key = `${r.CR名}__${r.メディア}`;
      const acc = map.get(key);
      if (acc) {
        acc.IMP += r.IMP;
        acc.Click += r.Click;
        acc.COST += r.COST;
        acc.CV += r.CV;
      } else {
        map.set(key, { ...r });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.CV - a.CV);
  }, [filtered]);

  function handleMediaSort(key: MediaSortKey) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function handleCRClick(row: MediaRow) {
    setSelectedCreative(toCreative(row));
  }

  function SortIcon({ k }: { k: MediaSortKey }) {
    if (sortKey !== k) return <span style={{ color: "#4a4a6a" }}>↕</span>;
    return <span style={{ color: "#6c63ff" }}>{sortDir === "desc" ? "↓" : "↑"}</span>;
  }

  return (
    <>
      <CreativePanel creative={selectedCreative} onClose={() => setSelectedCreative(null)} />

      {/* ターゲットフィルタ */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        <span className="text-xs font-semibold" style={{ color: "var(--muted-text)" }}>
          ターゲット：
        </span>
        {TARGETS.map((t) => {
          const color = TARGET_COLORS[t] || "var(--accent)";
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
              {t}
            </button>
          );
        })}
      </div>

      {/* セクション①: メディアパフォーマンス */}
      <section className="mb-8">
        <SectionLabel>メディアパフォーマンス</SectionLabel>
        <p className="text-xs mb-3" style={{ color: "var(--muted-text)" }}>
          CV1件以上 または COST上位20メディアを表示（{sortedMedia.length}件）
        </p>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--card-border)",
                    background: "#14141e",
                  }}
                >
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold"
                    style={{ color: "var(--muted-text)", minWidth: 160 }}
                  >
                    メディア
                  </th>
                  {MEDIA_SORT_COLS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleMediaSort(col.key)}
                      className="px-3 py-3 text-xs font-semibold cursor-pointer select-none text-right"
                      style={{
                        color: sortKey === col.key ? "#6c63ff" : "var(--muted-text)",
                      }}
                    >
                      {col.label} <SortIcon k={col.key} />
                    </th>
                  ))}
                  <th
                    className="px-4 py-3 text-xs font-semibold text-left"
                    style={{ color: "var(--muted-text)", minWidth: 180 }}
                  >
                    CV発生サイズ
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedMedia.length === 0 && (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-4 py-12 text-center text-xs"
                      style={{ color: "var(--muted-text)" }}
                    >
                      データがありません
                    </td>
                  </tr>
                )}
                {sortedMedia.map((m) => (
                  <tr
                    key={m.メディア}
                    style={{
                      borderBottom: "1px solid rgba(42,42,58,0.5)",
                      background: m.CV > 0 ? "rgba(67,217,173,0.03)" : undefined,
                    }}
                  >
                    <td
                      className="px-4 py-3 text-xs font-medium max-w-[160px] truncate"
                      style={{ color: "var(--foreground)" }}
                      title={m.メディア}
                    >
                      {m.CV > 0 && (
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-0.5 shrink-0"
                          style={{ background: "#43d9ad" }}
                        />
                      )}
                      {m.メディア}
                    </td>
                    <td className="px-3 py-3 text-right text-xs font-mono">
                      {fmtYen(m.COST)}
                    </td>
                    <td
                      className="px-3 py-3 text-right text-xs font-mono"
                      style={{ color: "var(--muted-text)" }}
                    >
                      {fmtNum(m.IMP)}
                    </td>
                    <td
                      className="px-3 py-3 text-right text-xs font-mono"
                      style={{ color: "var(--muted-text)" }}
                    >
                      {fmtNum(m.Click)}
                    </td>
                    <td className="px-3 py-3 text-right text-xs font-mono">
                      <span
                        style={{
                          color: m.CV > 0 ? "#ffd700" : "var(--muted-text)",
                          fontWeight: m.CV > 0 ? 700 : 400,
                        }}
                      >
                        {m.CV > 0 ? m.CV : "—"}
                      </span>
                    </td>
                    <td
                      className="px-3 py-3 text-right text-xs font-mono"
                      style={{ color: "var(--muted-text)" }}
                    >
                      {fmtPct(m.CTR)}
                    </td>
                    <td
                      className="px-3 py-3 text-right text-xs font-mono"
                      style={{ color: "var(--muted-text)" }}
                    >
                      {fmtYen(m.CPC)}
                    </td>
                    <td
                      className="px-3 py-3 text-right text-xs font-mono"
                      style={{ color: "var(--muted-text)" }}
                    >
                      {fmtYen(m.CPM)}
                    </td>
                    <td
                      className="px-3 py-3 text-right text-xs font-mono"
                      style={{ color: "var(--muted-text)" }}
                    >
                      {fmtPct(m.CVR)}
                    </td>
                    <td
                      className="px-3 py-3 text-right text-xs font-mono"
                      style={{ color: "var(--muted-text)" }}
                    >
                      {fmtYen(m.CPA)}
                    </td>
                    <td
                      className="px-3 py-3 text-right text-xs font-mono"
                      style={{ color: "var(--muted-text)" }}
                    >
                      {fmtPct(m.CTVR)}
                    </td>
                    <td className="px-4 py-3">
                      {m.CV > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {Object.entries(m.cvBySize)
                            .sort((a, b) => b[1] - a[1])
                            .map(([size, cv]) => (
                              <span
                                key={size}
                                className="text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
                                style={{
                                  background: "#43d9ad22",
                                  color: "#43d9ad",
                                  border: "1px solid #43d9ad44",
                                }}
                              >
                                {size}: {cv}CV
                              </span>
                            ))}
                        </div>
                      ) : (
                        <span style={{ color: "#4a4a6a" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* セクション②: CV発生CR一覧 */}
      <section>
        <SectionLabel>CV発生CR一覧</SectionLabel>
        <p className="text-xs mb-3" style={{ color: "var(--muted-text)" }}>
          CV1件以上のクリエイティブ（{cvCRRows.length}件）
        </p>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--card-border)",
                    background: "#14141e",
                  }}
                >
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold"
                    style={{ color: "var(--muted-text)", minWidth: 200 }}
                  >
                    CR名
                  </th>
                  <th
                    className="text-left px-3 py-3 text-xs font-semibold"
                    style={{ color: "var(--muted-text)", minWidth: 120 }}
                  >
                    メディア
                  </th>
                  <th
                    className="text-center px-3 py-3 text-xs font-semibold"
                    style={{ color: "var(--muted-text)" }}
                  >
                    サイズ
                  </th>
                  <th
                    className="text-right px-3 py-3 text-xs font-semibold"
                    style={{ color: "var(--muted-text)" }}
                  >
                    CV
                  </th>
                  <th
                    className="text-right px-3 py-3 text-xs font-semibold"
                    style={{ color: "var(--muted-text)" }}
                  >
                    COST
                  </th>
                  <th
                    className="text-right px-3 py-3 text-xs font-semibold"
                    style={{ color: "var(--muted-text)" }}
                  >
                    CPA
                  </th>
                  <th
                    className="text-right px-3 py-3 text-xs font-semibold"
                    style={{ color: "var(--muted-text)" }}
                  >
                    CVR
                  </th>
                  <th
                    className="text-right px-3 py-3 text-xs font-semibold"
                    style={{ color: "var(--muted-text)" }}
                  >
                    CTR
                  </th>
                  <th
                    className="text-right px-3 py-3 text-xs font-semibold"
                    style={{ color: "var(--muted-text)" }}
                  >
                    IMP
                  </th>
                  <th
                    className="text-right px-3 py-3 text-xs font-semibold"
                    style={{ color: "var(--muted-text)" }}
                  >
                    Click
                  </th>
                </tr>
              </thead>
              <tbody>
                {cvCRRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-12 text-center text-xs"
                      style={{ color: "var(--muted-text)" }}
                    >
                      CV発生CRがありません
                    </td>
                  </tr>
                )}
                {cvCRRows.map((row, i) => {
                  const cpa = row.CV > 0 ? row.COST / row.CV : 0;
                  const cvr = row.Click > 0 ? row.CV / row.Click : 0;
                  const ctr = row.IMP > 0 ? row.Click / row.IMP : 0;
                  return (
                    <tr
                      key={i}
                      className="table-row-hover"
                      style={{ borderBottom: "1px solid rgba(42,42,58,0.5)" }}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleCRClick(row)}
                          className="text-left group"
                          title={row.CR名}
                        >
                          <div
                            className="font-medium text-xs leading-snug max-w-xs group-hover:underline"
                            style={{ color: "var(--accent)" }}
                          >
                            {shortCRLabel(row.CR名) || row.CR名.slice(0, 40)}
                          </div>
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: "var(--muted-text)" }}
                          >
                            {row.日付}
                          </div>
                        </button>
                      </td>
                      <td
                        className="px-3 py-3 text-xs max-w-[120px] truncate"
                        style={{ color: "var(--muted-text)" }}
                        title={row.メディア}
                      >
                        {row.メディア}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: "#1a1a24",
                            color: "var(--muted-text)",
                            border: "1px solid var(--card-border)",
                          }}
                        >
                          {row.CRサイズ}
                        </span>
                      </td>
                      <td
                        className="px-3 py-3 text-right text-xs font-mono font-bold"
                        style={{ color: "#ffd700" }}
                      >
                        {row.CV}
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-mono">
                        {fmtYen(row.COST)}
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-mono">
                        {fmtYen(cpa)}
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-mono">
                        {fmtPct(cvr)}
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-mono">
                        {fmtPct(ctr)}
                      </td>
                      <td
                        className="px-3 py-3 text-right text-xs font-mono"
                        style={{ color: "var(--muted-text)" }}
                      >
                        {fmtNum(row.IMP)}
                      </td>
                      <td
                        className="px-3 py-3 text-right text-xs font-mono"
                        style={{ color: "var(--muted-text)" }}
                      >
                        {fmtNum(row.Click)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
