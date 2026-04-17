import { useEntries } from '../hooks/useEntries'
import { Matrix } from '../components/Matrix'
import { SLOT_DURATION_MIN } from '../constants'

export function Report() {
  const { entries, loading } = useEntries()

  if (loading) return <div className="page report"><div className="loading">載入中...</div></div>

  const totalEntries = entries.length
  const totalMinutes = totalEntries * SLOT_DURATION_MIN
  const totalHours = (totalMinutes / 60).toFixed(1)

  const tagged = entries.filter(e => e.energy)
  const greenCount = tagged.filter(e => e.energy === 'green').length
  const redCount = tagged.filter(e => e.energy === 'red').length
  const greenPct = tagged.length > 0 ? Math.round((greenCount / tagged.length) * 100) : 0
  const redPct = tagged.length > 0 ? Math.round((redCount / tagged.length) * 100) : 0

  // Priority delegation list: red + low cost first
  const delegationList = entries
    .filter(e => e.energy === 'red' && e.delegationCost)
    .reduce((acc, e) => {
      const existing = acc.find(a => a.activity === e.activity)
      if (existing) {
        existing.minutes += SLOT_DURATION_MIN
        existing.cost = Math.min(existing.cost, e.delegationCost!)
      } else {
        acc.push({ activity: e.activity, minutes: SLOT_DURATION_MIN, cost: e.delegationCost! })
      }
      return acc
    }, [] as { activity: string; minutes: number; cost: number }[])
    .sort((a, b) => a.cost - b.cost || b.minutes - a.minutes)

  // Activity time ranking
  const activityRanking = entries.reduce((acc, e) => {
    acc.set(e.activity, (acc.get(e.activity) || 0) + SLOT_DURATION_MIN)
    return acc
  }, new Map<string, number>())

  const topActivities = Array.from(activityRanking.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  return (
    <div className="page report">
      <h1>分析報告</h1>

      {totalEntries === 0 ? (
        <div className="empty-state">
          <p>還沒有記錄資料</p>
          <p>開始記錄你的時間，報告會自動產生</p>
        </div>
      ) : (
        <>
          {/* Overview */}
          <section className="report-section">
            <h2>總覽</h2>
            <div className="stats-grid">
              <div className="stat">
                <span className="stat-value">{totalEntries}</span>
                <span className="stat-label">筆記錄</span>
              </div>
              <div className="stat">
                <span className="stat-value">{totalHours}</span>
                <span className="stat-label">小時</span>
              </div>
              <div className="stat">
                <span className="stat-value">{tagged.length}</span>
                <span className="stat-label">已標記</span>
              </div>
            </div>
          </section>

          {/* Energy distribution */}
          {tagged.length > 0 && (
            <section className="report-section">
              <h2>能量分佈</h2>
              <div className="energy-bar">
                <div className="energy-green-fill" style={{ width: `${greenPct}%` }}>
                  {greenPct > 10 && `🟢 ${greenPct}%`}
                </div>
                <div className="energy-red-fill" style={{ width: `${redPct}%` }}>
                  {redPct > 10 && `🔴 ${redPct}%`}
                </div>
              </div>
              <div className="energy-legend">
                <span>🟢 有能量 {greenCount} 筆 ({greenPct}%)</span>
                <span>🔴 消耗 {redCount} 筆 ({redPct}%)</span>
              </div>
            </section>
          )}

          {/* Top activities */}
          <section className="report-section">
            <h2>時間花在哪？</h2>
            <div className="ranking-list">
              {topActivities.map(([activity, minutes], i) => (
                <div key={activity} className="ranking-item">
                  <span className="ranking-num">{i + 1}</span>
                  <span className="ranking-activity">{activity}</span>
                  <span className="ranking-time">{minutes >= 60 ? `${(minutes / 60).toFixed(1)}h` : `${minutes}m`}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Matrix */}
          {tagged.length > 0 && (
            <section className="report-section">
              <h2>能量 × 成本矩陣</h2>
              <Matrix entries={entries} />
            </section>
          )}

          {/* Delegation priority */}
          {delegationList.length > 0 && (
            <section className="report-section">
              <h2>外包優先清單</h2>
              <p className="section-desc">🔴 消耗能量的任務，按委託成本排序（低 → 高）</p>
              <div className="delegation-list">
                {delegationList.map((item, i) => (
                  <div key={item.activity} className="delegation-item">
                    <span className="delegation-rank">#{i + 1}</span>
                    <span className="delegation-activity">{item.activity}</span>
                    <span className="delegation-cost">{'$'.repeat(item.cost)}</span>
                    <span className="delegation-time">{item.minutes}分</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
