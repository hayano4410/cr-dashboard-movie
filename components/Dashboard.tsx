"use client";
import { useState, useEffect } from "react";
import { Creative, MediaRow } from "@/lib/types";
import SummaryCards from "@/components/SummaryCards";
import TopChart from "@/components/TopChart";
import CreativeTable from "@/components/CreativeTable";
import MediaDashboard from "@/components/MediaDashboard";

interface WeekEntry {
  id: string;
  label: string;
  file?: string;
  mediaFile?: string;
}

type ActiveTab = "cr" | "media";

interface Props {
  weeks: WeekEntry[];
}

export default function Dashboard({ weeks }: Props) {
  const [selectedWeek, setSelectedWeek] = useState<WeekEntry>(weeks[0]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("cr");
  const [data, setData] = useState<Creative[]>([]);
  const [mediaData, setMediaData] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);

  useEffect(() => {
    if (!selectedWeek.file) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/data/${selectedWeek.file}`)
      .then((r) => r.json())
      .then((d: Creative[]) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => { setData([]); setLoading(false); });
  }, [selectedWeek]);

  useEffect(() => {
    if (!selectedWeek.mediaFile) {
      setMediaData([]);
      return;
    }
    setMediaLoading(true);
    fetch(`/data/${selectedWeek.mediaFile}`)
      .then((r) => r.json())
      .then((d: MediaRow[]) => {
        setMediaData(d);
        setMediaLoading(false);
      })
      .catch(() => {
        setMediaData([]);
        setMediaLoading(false);
      });
  }, [selectedWeek]);

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-8 rounded-full" style={{ background: "var(--accent)" }} />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Creative Dashboard
          </h1>
        </div>

        {/* Week selector */}
        <div className="ml-5 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: "var(--muted-text)" }}>
            週次：
          </span>
          {weeks.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWeek(w)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: selectedWeek.id === w.id ? "var(--accent)" : "var(--card)",
                color: selectedWeek.id === w.id ? "#fff" : "var(--muted-text)",
                border: `1px solid ${selectedWeek.id === w.id ? "var(--accent)" : "var(--card-border)"}`,
              }}
            >
              {w.label}
            </button>
          ))}
        </div>
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
                borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
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
          {!selectedWeek.file ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-sm" style={{ color: "var(--muted-text)" }}>
                この週のCRデータは未登録です
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-sm" style={{ color: "var(--muted-text)" }}>
                読み込み中...
              </div>
            </div>
          ) : (
            <>
              <section className="mb-8">
                <SectionLabel>サマリー</SectionLabel>
                <SummaryCards data={data} />
              </section>

              <section className="mb-8">
                <SectionLabel>TOP クリエイティブ</SectionLabel>
                <div className="grid md:grid-cols-2 gap-4">
                  <TopChart data={data} metric="COST" />
                  <TopChart data={data} metric="CV" />
                </div>
              </section>

              <section>
                <SectionLabel>クリエイティブ一覧</SectionLabel>
                <CreativeTable data={data} />
              </section>
            </>
          )}
        </>
      )}

      {/* メディアレポート */}
      {activeTab === "media" && (
        <>
          {mediaLoading ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-sm" style={{ color: "var(--muted-text)" }}>
                読み込み中...
              </div>
            </div>
          ) : !selectedWeek.mediaFile ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-sm" style={{ color: "var(--muted-text)" }}>
                この週のメディアデータは未登録です
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
