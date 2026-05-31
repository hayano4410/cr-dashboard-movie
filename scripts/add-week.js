/**
 * 週次データ追加スクリプト
 * 使い方:
 *   CRデータのみ:     node scripts/add-week.js <CR用Excel>
 *   CR＋メディア両方: node scripts/add-week.js <CR用Excel> <メディア用Excel>
 */
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const crFilePath = process.argv[2];
const mediaFilePath = process.argv[3];

if (!crFilePath) {
  console.error("使い方: node scripts/add-week.js <CR用Excelファイル> [メディア用Excelファイル]");
  process.exit(1);
}

if (!fs.existsSync(crFilePath)) {
  console.error("ファイルが見つかりません:", crFilePath);
  process.exit(1);
}

if (mediaFilePath && !fs.existsSync(mediaFilePath)) {
  console.error("メディアファイルが見つかりません:", mediaFilePath);
  process.exit(1);
}

const outDir = path.join(__dirname, "..", "private-data");
const indexPath = path.join(outDir, "index.json");

// ---- CR名パース ----
function getTarget(crName) {
  const hasSP = crName.includes("SP");
  const hasPC = crName.includes("PC");
  const hasFemale = crName.includes("女性");
  if (hasSP && hasFemale) return "女性向けSP";
  if (hasSP && !hasFemale) return "男性向けSP";
  if (hasPC && !hasFemale) return "男性向けPC";
  return "その他";
}

function parseCRName(crName) {
  const parts = crName.split("_");
  const media = parts[3] || "";
  const device = parts[5] || "";
  const listType = parts[7] || "";
  const creativePart = parts.slice(8).join("_");
  const creativeSegments = creativePart.split("-");
  const shortName = creativeSegments.slice(0, 3).join("-");
  const target = getTarget(crName);
  return { media, device, listType, shortName, creativePart, target };
}

// ---- 期間→ファイルID変換 ----
function periodToFileId(period) {
  return "w" + period.replace(/[\/～]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

// ---- index.json 読み込み ----
let index = [];
if (fs.existsSync(indexPath)) {
  index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
}

// ======== CRデータ処理 ========
const crWb = XLSX.readFile(crFilePath);
const crWs = crWb.Sheets[crWb.SheetNames[0]];
const crData = XLSX.utils.sheet_to_json(crWs);

if (crData.length === 0) {
  console.error("CRデータが空です");
  process.exit(1);
}

const crEnriched = crData.map((row, i) => ({
  id: i,
  ...row,
  ...parseCRName(row["CR名"] || ""),
}));

const period = crEnriched[0]["期間"];
const fileId = periodToFileId(period);
const crOutFile = path.join(outDir, fileId + ".json");

fs.writeFileSync(crOutFile, JSON.stringify(crEnriched, null, 2));
console.log(`✓ CRデータ保存: ${crOutFile} (${crEnriched.length}件)`);

// ======== メディアデータ処理 ========
let mediaFileId = null;

if (mediaFilePath) {
  const mediaWb = XLSX.readFile(mediaFilePath);
  const mediaWs = mediaWb.Sheets[mediaWb.SheetNames[0]];
  const mediaData = XLSX.utils.sheet_to_json(mediaWs);

  if (mediaData.length === 0) {
    console.warn("! メディアデータが空のためスキップします");
  } else {
    mediaFileId = "media-" + fileId;
    const mediaOutFile = path.join(outDir, mediaFileId + ".json");
    fs.writeFileSync(mediaOutFile, JSON.stringify(mediaData, null, 2));
    console.log(`✓ メディアデータ保存: ${mediaOutFile} (${mediaData.length}件)`);
  }
}

// ======== index.json 更新 ========
const existing = index.find((w) => w.id === fileId);
const entry = {
  id: fileId,
  label: period,
  file: fileId + ".json",
  ...(mediaFileId ? { mediaFile: mediaFileId + ".json" } : existing?.mediaFile ? { mediaFile: existing.mediaFile } : {}),
};

if (existing) {
  Object.assign(existing, entry);
  console.log(`! 同じ週のデータが既に存在するため上書きしました: ${period}`);
} else {
  index.unshift(entry);
  console.log(`✓ index.json に追加: ${period}`);
}

fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

console.log("\n現在登録されている週:");
index.forEach((w, i) => {
  const mediaNote = w.mediaFile ? " (メディアあり)" : "";
  console.log(`  ${i + 1}. ${w.label}${mediaNote}`);
});
