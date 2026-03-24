/**
 * 週次データ追加スクリプト
 * 使い方: node scripts/add-week.js "C:/path/to/data.xlsx"
 */
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const filePath = process.argv[2];
if (!filePath) {
  console.error("使い方: node scripts/add-week.js <Excelファイルのパス>");
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error("ファイルが見つかりません:", filePath);
  process.exit(1);
}

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

const wb = XLSX.readFile(filePath);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

if (data.length === 0) {
  console.error("データが空です");
  process.exit(1);
}

const enriched = data.map((row, i) => ({
  id: i,
  ...row,
  ...parseCRName(row["CR名"] || ""),
}));

const period = enriched[0]["期間"];
const fileId = "w" + period.replace(/[\/～]/g, "-").replace(/-+/g, "-").replace(/^-|-$/, "");
const outDir = path.join(__dirname, "..", "public", "data");
const outFile = path.join(outDir, fileId + ".json");

fs.writeFileSync(outFile, JSON.stringify(enriched, null, 2));
console.log(`✓ データ保存: ${outFile} (${enriched.length}件)`);

const indexPath = path.join(outDir, "index.json");
let index = [];
if (fs.existsSync(indexPath)) {
  index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
}

if (index.find((w) => w.id === fileId)) {
  console.log(`! 同じ週のデータが既に存在するため上書きしました: ${period}`);
} else {
  index.unshift({ id: fileId, label: period, file: fileId + ".json" });
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log(`✓ index.json に追加: ${period}`);
}

console.log("\n現在登録されている週:");
index.forEach((w, i) => console.log(`  ${i + 1}. ${w.label}`));
