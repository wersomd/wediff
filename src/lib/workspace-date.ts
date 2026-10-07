/** Date-only records are stored at UTC midnight; events are actual instants. */
export const WORKSPACE_TIME_ZONE = "Asia/Almaty";
const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: WORKSPACE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
});
export function dayKey(date = new Date()): string {
  const parts = formatter.formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function dateOnly(date: Date): string {
  // Older tasks were saved at local midnight (19:00 UTC on the previous day).
  // New writes and financial date-only fields use UTC midnight.
  return date.getUTCHours() === 0 && date.getUTCMinutes() === 0 ? date.toISOString().slice(0, 10) : dayKey(date);
}
export function daysFromToday(date: Date, now = new Date()): number {
  return Math.round((Date.parse(dateOnly(date)) - Date.parse(dayKey(now))) / 86400000);
}
export function localEventTime(date: string, time = "00:00"): Date {
  // Kazakhstan has observed UTC+05:00 year-round since March 2024.
  return new Date(`${date}T${time}:00+05:00`);
}
export function dateLabel(date: Date): string {
  return new Intl.DateTimeFormat("ru", { day: "numeric", month: "short", timeZone: "UTC" }).format(date);
}
export function eventTime(date: Date): string {
  return new Intl.DateTimeFormat("ru", { hour: "2-digit", minute: "2-digit", timeZone: WORKSPACE_TIME_ZONE }).format(date);
}
