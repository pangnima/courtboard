export const RECRUIT_STATUSES = ['선착순모집', '호스트지정', '양도', '인증코트'] as const

export type RecruitStatus = (typeof RECRUIT_STATUSES)[number]

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
  admin_checked_at: string | null // null = 관리자 미확인
  created_at: string
  court_notes: { memo: string } | null
}

export type NewCourt = Omit<Court, 'id' | 'created_at' | 'court_notes' | 'transfer_failed' | 'admin_checked_at'>
