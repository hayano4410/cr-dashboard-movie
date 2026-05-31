/**
 * all-data.json の CRサイズ不整合を一括修正するスクリプト
 * ・CRサイズ が "-" の場合 → CR名から抽出
 * ・CRサイズ が CR名内のサイズと異なる場合 → CR名のサイズで上書き
 */
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "public", "data", "all-data.json");

function extractSize(crName) {
  // パターン1: 600x500 形式（通常クリエイティブ）
  const m = crName.match(/(\d+x\d+)/);
  if (m) return m[1];

  // パターン2: -in- 形式は末尾が "幅-高さ" (例: -600-500, -640-100)
  const inMatch = crName.match(/-(\d+)-(\d+)$/);
  if (inMatch) return `${inMatch[1]}x${inMatch[2]}`;

  return "";
}

const raw = fs.readFileSync(filePath, "utf-8");
const data = JSON.parse(raw);

let fixed = 0;
for (const row of data) {
  const crName = row["CR名"] || "";
  const sizeFromName = extractSize(crName);
  const current = row["CRサイズ"];

  if (!sizeFromName) continue; // CR名にサイズなし → スキップ

  if (!current || current === "-" || current !== sizeFromName) {
    row["CRサイズ"] = sizeFromName;
    fixed++;
  }
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log(`✓ 修正完了: ${fixed}件のCRサイズを更新 → ${filePath}`);
