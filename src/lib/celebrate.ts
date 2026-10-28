import confetti from 'canvas-confetti'

// 뮤즈 라켓 획득 축하 꽃가루 (움직임 줄이기 설정이면 생략)
const COLORS = ['#c7d2fe', '#bae6fd', '#e2e8f0', '#ffffff', '#facc15']
const common = { colors: COLORS, disableForReducedMotion: true }

const toOrigin = (x: number, y: number) => ({ x: x / window.innerWidth, y: y / window.innerHeight })

// 요소 양 끝에서 안쪽으로 쏘아 올린다 (배너용)
export function burstFromSides(rect: DOMRect) {
  const y = rect.top + rect.height / 2
  const side = { ...common, particleCount: 80, spread: 70, startVelocity: 45 }
  confetti({ ...side, angle: 60, origin: toOrigin(rect.left, y) })
  confetti({ ...side, angle: 120, origin: toOrigin(rect.right, y) })
}

// 요소 가운데에서 사방으로 터뜨린다 (플로팅 배지용)
export function burstFromCenter(rect: DOMRect) {
  confetti({
    ...common,
    particleCount: 90,
    spread: 360,
    startVelocity: 28,
    origin: toOrigin(rect.left + rect.width / 2, rect.top + rect.height / 2),
  })
}
