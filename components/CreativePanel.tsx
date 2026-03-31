"use client";
import { useEffect, useRef, useState } from "react";
import { Creative } from "@/lib/types";
import { getCreativeUrl } from "@/lib/matchCreative";

interface Props {
  creative: Creative | null;
  onClose: () => void;
}

function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center py-2.5" style={{ borderBottom: "1px solid var(--card-border)" }}>
      <span className="text-xs" style={{ color: "var(--muted-text)" }}>{label}</span>
      <span className="text-sm font-semibold font-mono" style={{ color: color || "var(--foreground)" }}>
        {value}
      </span>
    </div>
  );
}

function fmtNum(n: number, type: "raw" | "yen" | "pct" | "roas"): string {
  if (!isFinite(n) || n === 0) return "—";
  if (type === "yen") return "¥" + Math.round(n).toLocaleString();
  if (type === "pct") return (n * 100).toFixed(2) + "%";
  if (type === "roas") return (n * 100).toFixed(0) + "%";
  return n.toLocaleString();
}

const TARGET_COLORS: Record<string, string> = {
  "男性向けSP": "#6c63ff",
  "男性向けPC": "#43d9ad",
  "女性向けSP": "#ff6584",
};

export default function CreativePanel({ creative, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // reset image state when creative changes
  useEffect(() => {
    setImgError(false);
    setImgLoaded(false);
  }, [creative?.id]);

  // close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // close on backdrop click
  function onBackdrop(e: React.MouseEvent) {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose();
    }
  }

  const isOpen = !!creative;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onBackdrop}
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.5)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          width: "min(480px, 100vw)",
          background: "var(--card)",
          borderLeft: "1px solid var(--card-border)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {creative && (
          <>
            {/* Header */}
            <div className="p-4 flex items-center justify-between shrink-0" style={{ borderBottom: "1px solid var(--card-border)" }}>
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: (TARGET_COLORS[creative.target] || "#6c63ff") + "22",
                    color: TARGET_COLORS[creative.target] || "#6c63ff",
                  }}
                >
                  {creative.target}
                </span>
                <span className="text-xs truncate" style={{ color: "var(--muted-text)" }}>
                  {creative["日付"]}
                </span>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 ml-2 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                style={{ color: "var(--muted-text)", background: "transparent" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#2a2a3a")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                ✕
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Creative name */}
              <div className="mb-4 p-3 rounded-lg text-xs leading-relaxed" style={{ background: "#14141e", color: "var(--muted-text)", wordBreak: "break-all" }}>
                {creative["CR名"]}
              </div>

              {/* Creative image */}
              <div
                className="mb-5 rounded-xl overflow-hidden flex items-center justify-center"
                style={{
                  background: "#14141e",
                  border: "1px solid var(--card-border)",
                  minHeight: 200,
                }}
              >
                {(() => {
                  const url = getCreativeUrl(creative["CR名"]);
                  if (!url || imgError) {
                    return (
                      <div className="flex flex-col items-center gap-2 py-12">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21,15 16,10 5,21"/>
                        </svg>
                        <p className="text-xs" style={{ color: "var(--muted-text)" }}>
                          {imgError ? "画像が見つかりません" : "クリエイティブ未登録"}
                        </p>
                        {url && (
                          <p className="text-xs" style={{ color: "#4a4a6a" }}>
                            {url.split("/").pop()}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div className="relative w-full flex items-center justify-center p-4">
                      {!imgLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-xs" style={{ color: "var(--muted-text)" }}>読み込み中...</div>
                        </div>
                      )}
                      <img
                        src={url}
                        alt={creative["CR名"]}
                        className="max-w-full max-h-64 object-contain rounded"
                        style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.2s" }}
                        onLoad={() => setImgLoaded(true)}
                        onError={() => setImgError(true)}
                      />
                    </div>
                  );
                })()}
              </div>

              {/* Size badge */}
              <div className="flex gap-2 mb-4">
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: "#1a1a24", color: "var(--muted-text)", border: "1px solid var(--card-border)" }}
                >
                  {creative["CRサイズ"]}
                </span>
              </div>

              {/* Metrics */}
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--card-border)" }}>
                <div className="px-4 py-2" style={{ background: "#14141e", borderBottom: "1px solid var(--card-border)" }}>
                  <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--muted-text)" }}>指標</p>
                </div>
                <div className="px-4">
                  <MetricRow label="ROAS"  value={fmtNum(creative.ROAS, "roas")} color={creative.ROAS >= 3 ? "#43d9ad" : creative.ROAS > 0 ? "#ff9f43" : undefined} />
                  <MetricRow label="CV"    value={creative.CV > 0 ? creative.CV.toString() : "—"} color={creative.CV > 0 ? "#ffd700" : undefined} />
                  <MetricRow label="COST"  value={fmtNum(creative.COST, "yen")} />
                  <MetricRow label="LTV"   value={fmtNum(creative.LTV, "yen")} color="#43d9ad" />
                  <MetricRow label="CPA"   value={fmtNum(creative.CPA, "yen")} />
                  <MetricRow label="IMP"   value={fmtNum(creative.IMP, "raw")} />
                  <MetricRow label="Click" value={fmtNum(creative.Click, "raw")} />
                  <MetricRow label="CTR"   value={fmtNum(creative.CTR, "pct")} />
                  <MetricRow label="CVR"   value={fmtNum(creative.CVR, "pct")} />
                  <MetricRow label="CTVR"  value={fmtNum(creative.CTVR, "pct")} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
