import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import type { Court } from './types'
import AdminLogin from './components/AdminLogin'
import CourtForm from './components/CourtForm'
import AdminNewCourts from './components/AdminNewCourts'
import CourtList from './components/CourtList'
import RecentCourts from './components/RecentCourts'
export default function App() {
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [session, setSession] = useState<Session | null>(null)
  const [adminUserId, setAdminUserId] = useState<string | null>(null)
  const isAdmin = !!session && adminUserId === session.user.id

  const loadCourts = useCallback(async () => {
    const { data, error } = await supabase
      .from('courts')
      .select('*, court_notes(memo)')
      .order('play_date', { ascending: false }) // 최근 날짜가 위로
      .order('start_time')
    setLoading(false)
    if (error) return setError(`목록을 불러오지 못했습니다: ${error.message}`)
    setError('')
    setCourts(data)
  }, [])

  useEffect(() => {
    loadCourts()
  }, [loadCourts])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => data.subscription.unsubscribe()
  }, [])

  // 삭제 버튼 표시용. 실제 권한은 RLS가 강제한다.
  useEffect(() => {
    if (!session) return
    const userId = session.user.id
    supabase.rpc('is_admin').then(({ data }) => setAdminUserId(data === true ? userId : null))
  }, [session])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">🎾 테니스 코트 게시판</h1>
          <AdminLogin session={session} isAdmin={isAdmin} />
        </header>

        {isAdmin && !loading && <AdminNewCourts courts={courts} onChanged={loadCourts} />}

        <section className="grid gap-2">
          <h2 className="font-semibold">코트 등록</h2>
          <CourtForm onCreated={loadCourts} />
        </section>

        {!loading && <RecentCourts courts={courts} />}

        <section className="grid gap-2">
          <h2 className="font-semibold">코트 목록</h2>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {loading ? (
            <p className="py-8 text-center text-gray-500">불러오는 중…</p>
          ) : (
            <CourtList courts={courts} isAdmin={isAdmin} onChanged={loadCourts} />
          )}
        </section>
      </main>
    </div>
  )
}
