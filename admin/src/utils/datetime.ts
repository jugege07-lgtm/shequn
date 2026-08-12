/**
 * 将 ISO/UTC 时间统一格式化为本地时间（北京时间）字符串。
 * 若输入为空返回 ''。
 */
export function formatDateTime(input?: string | number | Date | null): string {
  if (input === null || input === undefined || input === '') return '-'
  const d = new Date(input)
  if (isNaN(d.getTime())) return String(input)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}