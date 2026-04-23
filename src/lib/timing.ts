/** Ho Chi Minh time = UTC+7 */
export function getHCMHour(): number {
  return (new Date().getUTCHours() + 7) % 24;
}

export type CheckinWindow = "morning" | "checkout" | null;

/** 朝: 6:00-11:59 / 夜(チェックアウト): 19:00-翌0:59 / それ以外: null */
export function getCheckinWindow(): CheckinWindow {
  const h = getHCMHour();
  if (h >= 6 && h <= 11) return "morning";
  if (h >= 19 || h === 0) return "checkout";
  return null;
}

/** チェックインの朝/チェックアウトを判定（時間外でも使う） */
export function getCheckinTiming(): "morning" | "checkout" {
  return getHCMHour() < 12 ? "morning" : "checkout";
}

/** HCM時間で今日が日曜か */
export function isSundayHCM(): boolean {
  const now = new Date();
  const hcmDate = new Date(now.getTime() + 7 * 3600000);
  return hcmDate.getUTCDay() === 0;
}

/** HCM時間での today (YYYY-MM-DD) */
export function getTodayHCM(): string {
  const now = new Date();
  const hcmDate = new Date(now.getTime() + 7 * 3600000);
  return hcmDate.toISOString().split("T")[0];
}

/** HCM時間で過去7日の日付配列 (古い→今日) */
export function getLast7DaysHCM(): string[] {
  const days: string[] = [];
  const today = getTodayHCM();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}
