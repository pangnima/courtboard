import { useRef, useState } from 'react'
import { burstFromCenter } from '../lib/celebrate'

// 화면에 떠 있는 '뮤즈 라켓 획득' 배지. 누르면 꽃가루가 터지고 새로고침 전까지 사라진다
// 위치는 화면 비율(가로 10~90%, 세로 15~85%)이고, 배지가 화면 밖으로 나가지 않도록 가장자리에서 72px 안쪽으로 제한
const randomSpot = () => ({ x: 10 + Math.random() * 80, y: 15 + Math.random() * 70 })

export default function MuseFloatingBadge() {
  const badgeRef = useRef<HTMLButtonElement>(null)
  const [spot] = useState(randomSpot)
  const [dismissed, setDismissed] = useState(false)

  function handleClick() {
    if (badgeRef.current) burstFromCenter(badgeRef.current.getBoundingClientRect())
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <button
      ref={badgeRef}
      type="button"
      onClick={handleClick}
      aria-label="뮤즈 라켓 획득 축하 꽃가루 터뜨리기"
      className="fixed z-40 -translate-x-1/2 -translate-y-1/2 animate-float cursor-pointer"
      style={{
        left: `clamp(72px, ${spot.x}%, calc(100% - 72px))`,
        top: `clamp(72px, ${spot.y}%, calc(100% - 72px))`,
      }}
    >
      <span className="flex size-24 flex-col items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 text-xl font-black leading-tight text-yellow-950 shadow-xl ring-4 ring-white animate-ribbon-pop hover:brightness-110 sm:size-28 sm:text-2xl">
        <span>뮤즈!</span>
        <span>획득!</span>
      </span>
    </button>
  )
}
