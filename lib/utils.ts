/**
 * 全角数字・記号を半角数字に変換し、数字のみ（または空文字）を抽出するヘルパー関数
 * 例: "１２，３４５円" -> "12345", "１０００" -> "1000"
 */
export function normalizeNumberInput(value: string): string {
  if (!value) return "";
  
  // 1. 全角英数を半角に変換 (０-９ -> 0-9)
  const halfWidth = value.replace(/[０-９]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) - 0xfee0)
  );

  // 2. カンマや円マーク、スペースなどの記号を除去し、数字のみ抽出
  const sanitized = halfWidth.replace(/[^0-9]/g, "");

  return sanitized;
}

/**
 * 全角時刻文字列（例: "０９:３０", "9：30"）を半角 "09:30" 形式に正規化
 */
export function normalizeTimeInput(value: string): string {
  if (!value) return "";

  // 全角英数・記号を半角に変換
  let halfWidth = value.replace(/[０-９]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) - 0xfee0)
  );
  halfWidth = halfWidth.replace(/：/g, ":");

  return halfWidth;
}
