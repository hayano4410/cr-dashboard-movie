"use client";
import { useState, useEffect, useMemo } from "react";
import { Creative, MediaRow } from "@/lib/types";
import SummaryCards from "@/components/SummaryCards";
import TopChart from "@/components/TopChart";
import CreativeTable from "@/components/CreativeTable";
import MediaDashboard from "@/components/MediaDashboard";

type ActiveTab = "cr" | "media";
type Company = "geniee" | "bypass";

const COMPANIES: { key: Company; label: string }[] = [
  { key: "geniee", label: "Geniee" },
  { key: "bypass", label: "Bypass" },
];

const DATA_FILES: Record<Company, { cr: string; media: string }> = {
  geniee: { cr: "/data/all-data.json", media: "/data/all-media-data.json" },
  bypass: {
    cr: "/data/all-bypass-data.json",
    media: "/data/all-bypass-media-data.json",
  },
};

interface CompanyData {
  cr: Creative[];
  media: MediaRow[];
}

function aggregateByCR(rows: Creative[]): Creative[] {
  const map = new Map<string, Creative>();
  for (const row of rows) {
    const acc = map.get(row.CR名);
    if (acc) {
      acc.IMP += row.IMP;
      acc.Click += row.Click;
      acc.CV += row.CV;
      acc.COST += row.COST;
      acc.LTV += row.LTV;
    } else {
      map.set(row.CR名, { ...row });
    }
  }
  return Array.from(map.values()).map((r) => ({
    ...r,
    CTR: r.IMP > 0 ? r.Click / r.IMP : 0,
    CVR: r.Click > 0 ? r.CV / r.Click : 0,
    CPA: r.CV > 0 ? r.COST / r.CV : 0,
    ROAS: r.COST > 0 ? r.LTV / r.COST : 0,
    CTVR: r.IMP > 0 ? r.CV / r.IMP : 0,
  }));
}

export default function Dashboard() {
  const [dataByCompany, setDataByCompany] = useState<
    Partial<Record<Company, CompanyData>>
  >({});
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateRangeCompany, setDateRangeCompany] = useState<Company | null>(
    null,
  );
  const [company, setCompany] = useState<Company>("geniee");
  const [activeTab, setActiveTab] = useState<ActiveTab>("cr");

  useEffect(() => {
    if (dataByCompany[company]) return;
    const files = DATA_FILES[company];
    Promise.all([
      fetch(files.cr)
        .then((r) => r.json())
        .catch(() => []),
      fetch(files.media)
        .then((r) => r.json())
        .catch(() => []),
    ]).then(([cr, media]) => {
      setDataByCompany((prev) => ({ ...prev, [company]: { cr, media } }));
    });
  }, [company, dataByCompany]);

  const loading = !dataByCompany[company];

  const allCRData = useMemo(
    () => dataByCompany[company]?.cr ?? [],
    [dataByCompany, company],
  );
  const allMediaData = useMemo(
    () => dataByCompany[company]?.media ?? [],
    [dataByCompany, company],
  );

  // 企業切替（初回読み込み含む）時は、その企業のデータ全期間にリセット
  if (dataByCompany[company] && dateRangeCompany !== company) {
    setDateRangeCompany(company);
    const dates = allCRData.map((d) => d.日付).sort();
    setDateFrom(dates[0] ?? "");
    setDateTo(dates[dates.length - 1] ?? "");
  }

  const availableDates = useMemo(() => {
    const dates = [...new Set(allCRData.map((d) => d.日付))].sort();
    return { min: dates[0] ?? "", max: dates[dates.length - 1] ?? "" };
  }, [allCRData]);

  const crData = useMemo(() => {
    if (!dateFrom || !dateTo) return [];
    const filtered = allCRData.filter(
      (d) => d.日付 >= dateFrom && d.日付 <= dateTo,
    );
    return aggregateByCR(filtered);
  }, [allCRData, dateFrom, dateTo]);

  const mediaData = useMemo(() => {
    if (!dateFrom || !dateTo) return allMediaData;
    return allMediaData.filter((d) => d.日付 >= dateFrom && d.日付 <= dateTo);
  }, [allMediaData, dateFrom, dateTo]);

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-2 h-8 rounded-full"
            style={{ background: "var(--accent)" }}
          />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Creative Dashboard
          </h1>
        </div>

        {/* 日付範囲ピッカー */}
        <div className="ml-5 flex items-center gap-3 flex-wrap">
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--muted-text)" }}
          >
            期間：
          </span>
          <input
            type="date"
            value={dateFrom}
            min={availableDates.min}
            max={dateTo || availableDates.max}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-xs px-3 py-1.5 rounded"
            style={{
              background: "var(--card)",
              color: "var(--foreground)",
              border: "1px solid var(--card-border)",
              colorScheme: "dark",
            }}
          />
          <span className="text-xs" style={{ color: "var(--muted-text)" }}>
            〜
          </span>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || availableDates.min}
            max={availableDates.max}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-xs px-3 py-1.5 rounded"
            style={{
              background: "var(--card)",
              color: "var(--foreground)",
              border: "1px solid var(--card-border)",
              colorScheme: "dark",
            }}
          />
          {availableDates.min && (
            <span className="text-xs" style={{ color: "var(--muted-text)" }}>
              （データ範囲: {availableDates.min} 〜 {availableDates.max}）
            </span>
          )}
        </div>
      </div>

      {/* 企業タブ */}
      <div className="ml-5 flex items-center gap-1 mb-4">
        {COMPANIES.map(({ key, label }) => {
          const active = company === key;
          return (
            <button
              key={key}
              onClick={() => setCompany(key)}
              className="px-5 py-1.5 text-xs font-semibold rounded-full transition-all"
              style={{
                color: active ? "#fff" : "var(--muted-text)",
                background: active ? "var(--accent)" : "var(--card)",
                border: active
                  ? "1px solid var(--accent)"
                  : "1px solid var(--card-border)",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab switcher */}
      <div className="ml-5 flex items-center gap-1 mb-8">
        {(["cr", "media"] as ActiveTab[]).map((tab) => {
          const label = tab === "cr" ? "CRレポート" : "メディアレポート";
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2 text-xs font-semibold transition-all"
              style={{
                color: active ? "#fff" : "var(--muted-text)",
                borderBottom: active
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
                background: "transparent",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* CRレポート */}
      {activeTab === "cr" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-sm" style={{ color: "var(--muted-text)" }}>
                読み込み中...
              </div>
            </div>
          ) : crData.length === 0 ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-sm" style={{ color: "var(--muted-text)" }}>
                指定期間のCRデータがありません
              </div>
            </div>
          ) : (
            <>
              <section className="mb-8">
                <SectionLabel>サマリー</SectionLabel>
                <SummaryCards data={crData} />
              </section>

              <section className="mb-8">
                <SectionLabel>TOP クリエイティブ</SectionLabel>
                <div className="grid md:grid-cols-2 gap-4">
                  <TopChart data={crData} metric="COST" />
                  <TopChart data={crData} metric="CV" />
                </div>
              </section>

              <section>
                <SectionLabel>クリエイティブ一覧</SectionLabel>
                <CreativeTable data={crData} />
              </section>
            </>
          )}
        </>
      )}

      {/* メディアレポート */}
      {activeTab === "media" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-sm" style={{ color: "var(--muted-text)" }}>
                読み込み中...
              </div>
            </div>
          ) : mediaData.length === 0 ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-sm" style={{ color: "var(--muted-text)" }}>
                指定期間のメディアデータがありません
              </div>
            </div>
          ) : (
            <MediaDashboard mediaData={mediaData} />
          )}
        </>
      )}
    </>
  );
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
