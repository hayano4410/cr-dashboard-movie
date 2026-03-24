/**
 * CR名からターゲットを導出する
 * SPかつ女性含む → 女性向けSP
 * SPかつ女性含まない → 男性向けSP
 * PCかつ女性含まない → 男性向けPC
 */
export function deriveTarget(crName: string): string {
  const hasSP = crName.includes("SP");
  const hasPC = crName.includes("PC");
  const hasFemale = crName.includes("女性");
  if (hasSP && hasFemale) return "女性向けSP";
  if (hasSP) return "男性向けSP";
  if (hasPC) return "男性向けPC";
  return "その他";
}
