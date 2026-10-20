// 모든 날짜/시간은 브라우저 로컬 시간대 기준

const toDateString = (date: Date) => date.toLocaleDateString('sv-SE') // YYYY-MM-DD

export const today = () => toDateString(new Date())

export const nowTime = () => new Date().toLocaleTimeString('sv-SE') // HH:MM:SS

// 월/일만 받아 YYYY-MM-DD로 변환. 올해 날짜가 이미 지났으면 내년으로 본다.
export function resolveDate(month: string, day: string): string | null {
  const m = Number(month)
  const d = Number(day)
  if (!Number.isInteger(m) || !Number.isInteger(d)) return null

  const year = new Date().getFullYear()
  for (const y of [year, year + 1]) {
    const date = new Date(y, m - 1, d)
    if (date.getMonth() !== m - 1 || date.getDate() !== d) continue // 2/30 같은 없는 날짜 (2/29는 윤년만)
    const value = toDateString(date)
    if (value >= today()) return value
  }
  return null
}

export const weekday = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('ko-KR', { weekday: 'short' })

// 등록 시각 같은 ISO 시각 → "방금 전", "N분 전", "N시간 전", "N일 전"
export function timeAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}시간 전`
  return `${Math.floor(minutes / (60 * 24))}일 전`
}

// ISO 시각 → "10/20 14:05"
export function formatDateTime(iso: string) {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// 2026-10-20 → "10월 20일 (화)", 올해가 아니면 연도 포함
export function formatDateLabel(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  const year = y === new Date().getFullYear() ? '' : `${y}년 `
  return `${year}${m}월 ${d}일 (${weekday(date)})`
}
