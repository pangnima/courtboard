import { useRef, useState } from 'react'
import { burstFromCenter } from '../lib/celebrate'

// 화면에 떠 있는 '뮤즈 라켓 획득' 배지. 누를 때마다 꽃가루가 터지고 무작위 위치에 다시 나타난다
// 위치는 화면 비율(가로 10~90%, 세로 15~85%)이고, 배지가 화면 밖으로 나가지 않도록 가장자리에서 72px 안쪽으로 제한
const randomSpot = () => ({ x: 10 + Math.random() * 80, y: 15 + Math.random() * 70 })

export default function MuseFloatingBadge() {
  const badgeRef = useRef<HTMLButtonElement>(null)
  const [spot, setSpot] = useState(() => ({ ...randomSpot(), count: 0 }))

  function handleClick() {
    if (badgeRef.current) burstFromCenter(badgeRef.current.getBoundingClientRect())
    setSpot({ ...randomSpot(), count: spot.count + 1 })
  }

  return (
    <button
      ref={badgeRef}
      type="button"
      onClick={handleClick}
      aria-label="뮤즈 라켓 획득 축하 꽃가루 터뜨리기"
      className="fixed z-40 -translate-x-1/2 -translate-y-1/2 cursor-pointer motion-safe:animate-float"
      style={{
        left: `clamp(72px, ${spot.x}%, calc(100% - 72px))`,
        top: `clamp(72px, ${spot.y}%, calc(100% - 72px))`,
      }}
    >
      {/* key가 바뀌면 다시 마운트되어 새 위치에서 튀어나오는 모션이 재생된다 */}
      <span
        key={spot.count}
        className="flex size-24 flex-col items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 text-xl font-black leading-tight text-yellow-950 shadow-xl ring-4 ring-white hover:brightness-110 motion-safe:animate-ribbon-pop sm:size-28 sm:text-2xl"
      >
        <span>뮤즈!</span>
        <span>획득!</span>
      </span>
    </button>
  )
}
