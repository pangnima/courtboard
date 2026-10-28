import { useEffect, useRef } from 'react'
import { burstFromSides } from '../lib/celebrate'
import { today } from '../lib/date'

// 이벤트로 획득한 뮤즈 라켓 배너. 꽃가루는 브라우저별 하루 1회 자동 재생, 클릭하면 다시 재생
const PLAYED_KEY = 'muse-celebrated-on'

// localStorage가 막힌 환경(개인 모드 등)에서는 모션만 생략한다
function playedToday() {
  try {
    return localStorage.getItem(PLAYED_KEY) === today()
  } catch {
    return true
  }
}

function markPlayed() {
  try {
    localStorage.setItem(PLAYED_KEY, today())
  } catch {
    // 저장 실패는 무시
  }
}

export default function MuseBanner() {
  const bannerRef = useRef<HTMLButtonElement>(null)

  function fire() {
    if (bannerRef.current) burstFromSides(bannerRef.current.getBoundingClientRect())
  }

  useEffect(() => {
    if (playedToday()) return
    // 화면이 자리 잡은 뒤 터지도록 살짝 늦춘다. 실제로 터질 때 기록해야 StrictMode의 effect 재실행에도 1회 재생된다
    const timer = setTimeout(() => {
      markPlayed()
      fire()
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  return (
    <button
      ref={bannerRef}
      type="button"
      onClick={fire}
      aria-label="뮤즈 라켓 획득 축하 다시 보기"
      className="relative block cursor-pointer overflow-hidden rounded-xl"
    >
      <img
        src="/images/muse.png"
        alt="2026 요넥스 뮤즈 - 당신의 모든 움직임이 영감이 되는 순간"
        width={1500}
        height={408}
        className="h-auto w-full"
      />
      <span className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent motion-safe:block motion-safe:animate-shine" />
    </button>
  )
}
