/**
 * 日次データ追加スクリプト
 * 使い方: node scripts/add-day.js <Excelファイル>
 *
 * Excelに必要なシート:
 *   - "CRデータ反映用"  : 期間(シリアル値), 計測URL, CR名, 計測用URL, LTV, COST, ROAS, CV, CPA, IMP, Click, CRサイズ, CTR, CVR, CTVR
 *   - "メディアデータ反映用": 期間(ISO文字列), (gender), CR名, 計測リンク, メディア, IMP, Click, COST, CV
 */
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const excelPath = process.argv[2];
if (!excelPath) {
  console.error("使い方: node scripts/add-day.js <Excelファイル>");
  process.exit(1);
}
if (!fs.existsSync(excelPath)) {
  console.error("ファイルが見つかりません:", excelPath);
  process.exit(1);
}

const outDir = path.join(__dirname, "..", "private-data");
const crOutPath = path.join(outDir, "all-data.json");
const mediaOutPath = path.join(outDir, "all-media-data.json");

// Excelシリアル値 or ISO文字列 → "YYYY-MM-DD"
function toISO(val) {
  if (typeof val === "string") return val.trim();
  const d = XLSX.SSF.parse_date_code(val);
  if (!d) return String(val);
  return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
}

// CR名からサイズ抽出
function extractSize(crName) {
  const m = crName.match(/(\d+x\d+)/);
  return m ? m[1] : "";
}

// CR名からターゲット判定
function getTarget(crName) {
  const hasSP = crName.includes("SP");
  const hasPC = crName.includes("PC");
  const hasFemale = crName.includes("女性");
  if (hasSP && hasFemale) return "女性向けSP";
  if (hasSP && !hasFemale) return "男性向けSP";
  if (hasPC && !hasFemale) return "男性向けPC";
  return "その他";
}

// CR名パース（geniee形式: R18_動画_キュービック_geniee_...）
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

// メディアデータのターゲット判定（CR名形式が異なるため別ロジック）
function getMediaTarget(crName, gender) {
  const hasFemale = gender === "女性" || crName.includes("女性");
  const hasSP = crName.includes("SP");
  const hasPC = crName.includes("PC");
  if (hasFemale) return "女性向けSP";
  if (hasSP) return "男性向けSP";
  if (hasPC) return "男性向けPC";
  return "その他";
}

const wb = XLSX.readFile(excelPath);
console.log("シート:", wb.SheetNames);

// ======== CRデータ処理 ========
const crSheetName = wb.SheetNames.find((s) => s.includes("CR"));
if (!crSheetName) {
  console.error("CRデータシートが見つかりません（シート名に'CR'を含めてください）");
  process.exit(1);
}

const crRaw = XLSX.utils.sheet_to_json(wb.Sheets[crSheetName]);
if (crRaw.length === 0) {
  console.error("CRデータが空です");
  process.exit(1);
}

const crEnriched = crRaw.map((row, i) => ({
  id: i,
  日付: toISO(row["期間"]),
  計測URL: row["計測URL"] || "",
  CR名: row["CR名"] || "",
  計測用URL: row["計測用URL"] || "",
  LTV: row["LTV"] || 0,
  COST: row["COST"] || 0,
  ROAS: row["ROAS"] || 0,
  CV: row["CV"] || 0,
  CPA: row["CPA"] || 0,
  IMP: row["IMP"] || 0,
  Click: row["Click"] || 0,
  CRサイズ: row["CRサイズ"] || "",
  CTR: row["CTR"] || 0,
  CVR: row["CVR"] || 0,
  CTVR: row["CTVR"] || 0,
  ...parseCRName(row["CR名"] || ""),
}));

const importedCRDates = [...new Set(crEnriched.map((r) => r.日付))].sort();
console.log(
  `\nCRデータ: ${crEnriched.length}件 / ${importedCRDates.length}日分 (${importedCRDates[0]} 〜 ${importedCRDates[importedCRDates.length - 1]})`
);

let existingCR = [];
if (fs.existsSync(crOutPath)) {
  existingCR = JSON.parse(fs.readFileSync(crOutPath, "utf-8"));
  const before = existingCR.length;
  existingCR = existingCR.filter((r) => !importedCRDates.includes(r.日付));
  if (before !== existingCR.length) {
    console.log(`! 同日の既存CRデータ ${before - existingCR.length}件を上書きします`);
  }
}

const newCR = [...existingCR, ...crEnriched].sort((a, b) => a.日付.localeCompare(b.日付));
newCR.forEach((r, i) => { r.id = i; });
fs.writeFileSync(crOutPath, JSON.stringify(newCR, null, 2));
console.log(`✓ CRデータ保存: ${crOutPath} (合計 ${newCR.length}件)`);

// ======== メディアデータ処理 ========
const mediaSheetName = wb.SheetNames.find((s) => s.includes("メディア"));
if (!mediaSheetName) {
  console.log("\nメディアシートが見つかりません、スキップ");
} else {
  const mediaRaw = XLSX.utils.sheet_to_json(wb.Sheets[mediaSheetName]);

  const mediaEnriched = mediaRaw.map((row) => {
    const crName = row["CR名"] || "";
    const gender = row["__EMPTY"] || "";
    return {
      日付: toISO(row["期間"]),
      CR名: crName,
      計測リンク: row["計測リンク"] || "",
      メディア: row["メディア"] || "",
      IMP: row["IMP"] || 0,
      Click: row["Click"] || 0,
      COST: row["COST"] || 0,
      CV: row["CV"] || 0,
      CRサイズ: extractSize(crName),
      target: getMediaTarget(crName, gender),
    };
  });

  const importedMediaDates = [...new Set(mediaEnriched.map((r) => r.日付))].sort();
  console.log(
    `\nメディアデータ: ${mediaEnriched.length}件 / ${importedMediaDates.length}日分 (${importedMediaDates[0]} 〜 ${importedMediaDates[importedMediaDates.length - 1]})`
  );

  let existingMedia = [];
  if (fs.existsSync(mediaOutPath)) {
    existingMedia = JSON.parse(fs.readFileSync(mediaOutPath, "utf-8"));
    const before = existingMedia.length;
    existingMedia = existingMedia.filter((r) => !importedMediaDates.includes(r.日付));
    if (before !== existingMedia.length) {
      console.log(`! 同日の既存メディアデータ ${before - existingMedia.length}件を上書きします`);
    }
  }

  const newMedia = [...existingMedia, ...mediaEnriched].sort((a, b) =>
    a.日付.localeCompare(b.日付)
  );
  fs.writeFileSync(mediaOutPath, JSON.stringify(newMedia, null, 2));
  console.log(`✓ メディアデータ保存: ${mediaOutPath} (合計 ${newMedia.length}件)`);
}

console.log("\n登録済み日付（CR）:");
importedCRDates.forEach((d) => console.log(" ", d));
