import { useState, type FormEvent } from 'react'
import { resolveDate, weekday } from '../lib/date'
import { supabase } from '../lib/supabase'
import { RECRUIT_STATUSES, type NewCourt, type RecruitStatus } from '../types'

const DEFAULT_PLAY_HOURS = 2
const LAST_END_HOUR = 24
const START_HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 06 ~ 22시

const toTime = (hour: number) => `${String(hour).padStart(2, '0')}:00`

const empty = {
  court_name: '',
  court_number: '',
  reserver_name: '',
  recruit_status: RECRUIT_STATUSES[0] as RecruitStatus,
  month: '',
  day: '',
  start_hour: '',
  end_hour: '',
  price: '',
}

const inputClass = 'w-full rounded border border-gray-300 px-3 py-2'

export default function CourtForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (key: keyof typeof empty) => (e: { target: { value: string } }) =>
    setForm({ ...form, [key]: e.target.value })

  const setDigits = (key: 'month' | 'day') => (e: { target: { value: string } }) =>
    setForm({ ...form, [key]: e.target.value.replace(/\D/g, '') })

  // 시작 시간을 바꾸면 종료는 기본값(+2시간)으로 다시 맞춘다
  const setStartHour = (e: { target: { value: string } }) => {
    const start = e.target.value
    const end = start === '' ? '' : String(Math.min(Number(start) + DEFAULT_PLAY_HOURS, LAST_END_HOUR))
    setForm({ ...form, start_hour: start, end_hour: end })
  }

  const startHour = form.start_hour === '' ? null : Number(form.start_hour)
  const endHours =
    startHour === null ? [] : Array.from({ length: LAST_END_HOUR - startHour }, (_, i) => startHour + 1 + i)

  const dateFilled = form.month !== '' && form.day !== ''
  const playDate = dateFilled ? resolveDate(form.month, form.day) : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const price = Number(form.price)
    if (!playDate) return setError('일자(월/일)를 올바르게 입력하세요.')
    if (startHour === null || form.end_hour === '') return setError('시간을 선택하세요.')
    if (!Number.isInteger(price) || price < 0) return setError('비용은 0 이상의 정수로 입력하세요.')

    const court: NewCourt = {
      court_name: form.court_name.trim(),
      court_number: form.court_number.trim(),
      reserver_name: form.reserver_name.trim(),
      recruit_status: form.recruit_status,
      play_date: playDate,
      start_time: toTime(startHour),
      end_time: toTime(Number(form.end_hour)), // 24시 종료 → 24:00
      price,
    }

    setSaving(true)
    const { error } = await supabase.from('courts').insert(court)
    setSaving(false)
    if (error) return setError(`등록 실패: ${error.message}`)

    setForm(empty)
    onCreated()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {/* 필드 순서는 목록 컬럼 순서와 같게 유지 */}
      <div className="grid gap-1 text-sm">
        일자
        <div className="flex items-center gap-1">
          <input
            aria-label="월"
            inputMode="numeric"
            maxLength={2}
            placeholder="월"
            className={`${inputClass} text-center`}
            required
            value={form.month}
            onChange={setDigits('month')}
          />
          <span className="text-gray-400">/</span>
          <input
            aria-label="일"
            inputMode="numeric"
            maxLength={2}
            placeholder="일"
            className={`${inputClass} text-center`}
            required
            value={form.day}
            onChange={setDigits('day')}
          />
        </div>
        {dateFilled && (
          <span className={`text-xs ${playDate ? 'text-gray-500' : 'text-red-600'}`}>
            {playDate ? `→ ${playDate} (${weekday(playDate)})` : '올바른 날짜가 아닙니다'}
          </span>
        )}
      </div>
      <label className="grid gap-1 text-sm">
        시작 시간
        <select className={inputClass} required value={form.start_hour} onChange={setStartHour}>
          <option value="">선택</option>
          {START_HOURS.map((hour) => (
            <option key={hour} value={hour}>
              {toTime(hour)}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        종료 시간 (기본 +{DEFAULT_PLAY_HOURS}시간)
        <select
          className={`${inputClass} disabled:bg-gray-50`}
          required
          disabled={startHour === null}
          value={form.end_hour}
          onChange={set('end_hour')}
        >
          {startHour === null && <option value="">시작 시간 먼저 선택</option>}
          {endHours.map((hour) => (
            <option key={hour} value={hour}>
              {toTime(hour)}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        코트 이름
        <input className={inputClass} required maxLength={50} value={form.court_name} onChange={set('court_name')} />
      </label>
      <label className="grid gap-1 text-sm">
        코트 번호
        <input className={inputClass} required maxLength={20} placeholder="예: 3번" value={form.court_number} onChange={set('court_number')} />
      </label>
      <label className="grid gap-1 text-sm">
        코트 예약자
        <input className={inputClass} required maxLength={20} value={form.reserver_name} onChange={set('reserver_name')} />
      </label>
      <label className="grid gap-1 text-sm">
        모집 상태
        <select className={inputClass} value={form.recruit_status} onChange={set('recruit_status')}>
          {RECRUIT_STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        비용 (원)
        <input type="number" min={0} step={1} className={inputClass} required value={form.price} onChange={set('price')} />
      </label>
      {error &&<p className="text-sm text-red-600 sm:col-span-2 lg:col-span-4">{error}</p>}
      <button
        disabled={saving}
        className="rounded bg-green-700 px-4 py-2 font-medium text-white hover:bg-green-800 disabled:opacity-50 sm:col-span-2 lg:col-span-4"
      >
        {saving ? '등록 중…' : '등록'}
      </button>
    </form>
  )
}
