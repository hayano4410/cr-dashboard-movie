/**
 * CR名からクリエイティブファイル名を推定する
 *
 * パターン1: '--' 区切り
 *   例: "...-タイトル--251111-CB-videoc-detail-cid-smjh045-adult-A1-640x100-j"
 *   → "251111-CB-videoc-detail-cid-smjh045-adult-A1-640x100-j.jpg"
 *
 * パターン2: '-in-' 区切り
 *   例: "...-label=2063384-in-シロウト速報-1-600-500"
 *   → "in-シロウト速報-1-600-500.gif"
 *
 * パターン3: '-YYMMDD-' 形式（6桁日付から始まるキー）
 *   例: "...-タイトル-251212-CB-videoc-detail-cid-grsp018-adult-A1-600x500-j"
 *   → "251212-CB-videoc-detail-cid-grsp018-adult-A1-600x500-j.jpg"
 */
function addExt(key: string): string {
  if (key.endsWith(".gif") || key.endsWith(".jpg")) return key;
  // 末尾の大文字サフィックスを除去（例: jA → j, gA → g）
  const normalized = key.replace(/([jg])[A-Z]+$/, "$1");
  return normalized + (normalized.slice(-1) === "j" ? ".jpg" : ".gif");
}

export function getCreativeFilename(crName: string): string | null {
  // パターン1: '--' 区切り
  if (crName.includes("--")) {
    return addExt(crName.slice(crName.lastIndexOf("--") + 2));
  }

  // パターン2: '-in-' または '_in-' 区切り
  if (crName.includes("-in-") || crName.includes("_in-")) {
    const sep = crName.includes("-in-") ? "-in-" : "_in-";
    const key = crName.slice(crName.indexOf(sep) + 1);
    return addExt(key.endsWith(".gif") || key.endsWith(".jpg") ? key : key + ".gif");
  }

  // パターン3: '-YYMMDD-' または '_YYMMDD-' 形式
  const m = crName.match(/[_-](\d{6}-.+)$/);
  if (m) return addExt(m[1]);

  return null;
}

/**
 * ファイルが存在するか確認してURLを返す（クライアント側で使用）
 */
export function getCreativeUrl(crName: string): string | null {
  const filename = getCreativeFilename(crName);
  if (!filename) return null;
  return `/creatives/${filename}`;
}
