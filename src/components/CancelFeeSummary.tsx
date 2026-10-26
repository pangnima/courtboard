import { cancelFee } from '../lib/court'
import type { Court } from '../types'

// 취소수수료가 발생한 일정의 총합과 코트별 소계 (모두에게 노출, 읽기 전용)
export default function CancelFeeSummary({ courts }: { courts: Court[] }) {
  const charged = courts.filter((court) => court.cancel_fee)
  const total = charged.reduce((sum, court) => sum + cancelFee(court), 0)

  const byCourt = new Map<string, { count: number; price: number; fee: number }>()
  for (const court of charged) {
    const row = byCourt.get(court.court_name) ?? { count: 0, price: 0, fee: 0 }
    row.count += 1
    row.price += court.price
    row.fee += cancelFee(court)
    byCourt.set(court.court_name, row)
  }
  const rows = [...byCourt].sort(([, a], [, b]) => b.fee - a.fee)

  return (
    <section className="grid gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <header className="flex flex-wrap items-baseline gap-2 text-red-900">
        <h2 className="text-lg font-bold">취소수수료 총합</h2>
        <span className="text-sm font-medium opacity-70">{charged.length}건</span>
        <span className="ml-auto text-2xl font-bold tabular-nums">{total.toLocaleString()}원</span>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-red-900/70">취소수수료 발생 건이 없습니다.</p>
      ) : (
        <table className="w-full rounded-lg bg-white text-sm">
          <thead className="text-left text-[13px] text-gray-500">
            <tr>
              <th className="px-3 py-2 font-medium">코트 이름</th>
              <th className="px-3 py-2 text-right font-medium">건수</th>
              <th className="px-3 py-2 text-right font-medium">이용금액</th>
              <th className="px-3 py-2 text-right font-medium">수수료</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map(([name, row]) => (
              <tr key={name} className="border-t border-gray-200">
                <td className="px-3 py-2 font-medium">{name}</td>
                <td className="px-3 py-2 text-right">{row.count}건</td>
                <td className="px-3 py-2 text-right">{row.price.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-semibold text-red-700">{row.fee.toLocaleString()}원</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
