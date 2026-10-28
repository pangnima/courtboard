export const RECRUIT_STATUSES = ['선착순모집', '호스트지정', '양도', '인증코트'] as const

export type RecruitStatus = (typeof RECRUIT_STATUSES)[number]

// 등록 폼의 코트 이름 선택지. 목록에 없는 코트는 '기타'로 직접 입력하고 목록에서 빠진 과거 이름도
// 조회되므로 court_name은 string으로 둔다. 자주 쓰는 직접 입력 이름은 여기에 추가하면 집계가 합쳐진다
export const COURT_NAMES = [
  '목동테니스장',
  '양평누리',
  '서남물',
  '난지한강',
  '계남(야외)',
  '계남(실내)',
  '야뚜라미',
  '남부도로',
  '우장산',
] as const

export type Court = {
  id: number
  court_name: string
  court_number: string
  reserver_name: string
  recruit_status: RecruitStatus
  play_date: string // YYYY-MM-DD
  start_time: string // HH:MM:SS
  end_time: string
  price: number
  transfer_failed: boolean
  completed: boolean // 외부에서 확정된 일정
  cancel_fee: boolean // 취소수수료 발생, 관리자만 변경
  admin_checked_at: string | null // null = 관리자 미확인
  created_at: string
  court_notes: { memo: string } | null
}

export type NewCourt = Omit<
  Court,
  'id' | 'created_at' | 'court_notes' | 'transfer_failed' | 'completed' | 'cancel_fee' | 'admin_checked_at'
>
