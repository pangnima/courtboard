import { useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const ADMIN_EMAIL_DOMAIN = 'tennis.local'

type Props = {
  session: Session | null
  isAdmin: boolean
}

export default function AdminLogin({ session, isAdmin }: Props) {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError('')
    // Supabase Auth는 이메일이 필요하므로 아이디만 입력하면 내부 도메인을 붙인다
    const email = username.includes('@') ? username : `${username}@${ADMIN_EMAIL_DOMAIN}`
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return setError('로그인 실패: 아이디 또는 비밀번호를 확인하세요.')
    setPassword('')
    setOpen(false)
  }

  if (session) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-600">
          {session.user.email?.replace(`@${ADMIN_EMAIL_DOMAIN}`, '')}
          {!isAdmin && ' (관리자 아님)'}
        </span>
        <button onClick={() => supabase.auth.signOut()} className="text-gray-500 hover:underline">
          로그아웃
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-gray-500 hover:underline">
        관리자 로그인
      </button>
    )
  }

  return (
    <form onSubmit={handleLogin} className="flex flex-wrap items-center gap-2 text-sm">
      <input
        required
        placeholder="아이디"
        autoComplete="username"
        className="rounded border border-gray-300 px-2 py-1"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        required
        placeholder="비밀번호"
        className="rounded border border-gray-300 px-2 py-1"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="rounded bg-gray-800 px-3 py-1 text-white">로그인</button>
      <button type="button" onClick={() => setOpen(false)} className="text-gray-500">
        취소
      </button>
      {error && <p className="w-full text-red-600">{error}</p>}
    </form>
  )
}
