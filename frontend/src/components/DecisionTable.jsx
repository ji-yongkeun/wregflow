const DECISION_COL_ORDER = ['id', 'question', 'yes_outcome', 'no_outcome', 'regulation_ref']
const DECISION_COL_LABELS = {
  id:          'ID',
  question:    '질문',
  yes_outcome: '✓ YES 결과',
  no_outcome:  '✗ NO 결과',
  regulation_ref: '관련 규정',
}
const DECISION_COL_STYLES = {
  yes_outcome: { borderLeft: '2px solid rgba(16,185,129,0.35)', bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
  no_outcome:  { borderLeft: '2px solid rgba(239,68,68,0.35)',  bg: 'rgba(239,68,68,0.1)',  color: '#ef4444' },
}

export function DecisionTable({ data }) {
  if (!data) {
    return <div style={{ color: '#cbd5e1', padding: '1rem' }}>데이터가 없습니다</div>
  }

  let decisions = data
  if (typeof data === 'string') {
    try { decisions = JSON.parse(data) } catch {
      return <div style={{ color: '#cbd5e1', padding: '1rem' }}>데이터 파싱 오류</div>
    }
  }
  if (!Array.isArray(decisions)) decisions = [decisions]
  if (decisions.length === 0) {
    return <div style={{ color: '#cbd5e1', padding: '1rem' }}>데이터가 없습니다</div>
  }

  // JSON에 있는 모든 키 수집 (알려진 순서 먼저, 나머지 추가)
  const allKeys = [...new Set(decisions.flatMap(d => Object.keys(d)))]
  const orderedKeys = [
    ...DECISION_COL_ORDER.filter(k => allKeys.includes(k)),
    ...allKeys.filter(k => !DECISION_COL_ORDER.includes(k)),
  ]

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        color: '#cbd5e1',
        minWidth: `${orderedKeys.length * 180}px`,
      }}>
        <thead>
          <tr style={{
            background: 'linear-gradient(135deg, rgba(79,70,229,0.2), rgba(79,70,229,0.05))',
            borderBottom: '2px solid #4F46E5',
          }}>
            {orderedKeys.map(key => {
              const style = DECISION_COL_STYLES[key]
              const headerColor = key === 'yes_outcome' ? '#10b981'
                : key === 'no_outcome' ? '#ef4444'
                : key === 'id' ? '#a5b4fc'
                : '#93c5fd'
              return (
                <th key={key} style={{
                  padding: '0.9rem 1rem',
                  textAlign: 'left',
                  color: headerColor,
                  fontWeight: '700',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  borderLeft: style?.borderLeft,
                  minWidth: key === 'id' ? '60px' : key === 'question' ? '280px' : '220px',
                }}>
                  {DECISION_COL_LABELS[key] || key}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {decisions.map((decision, idx) => (
            <tr
              key={idx}
              style={{ borderBottom: '1px solid #1e293b', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {orderedKeys.map(key => {
                const val = decision[key]
                const display = val === null || val === undefined ? '-'
                  : typeof val === 'object' ? JSON.stringify(val, null, 2)
                  : String(val)
                const style = DECISION_COL_STYLES[key]
                return (
                  <td key={key} style={{
                    padding: '0.85rem 1rem',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    verticalAlign: 'top',
                    borderLeft: style?.borderLeft,
                    color: key === 'id' ? '#a5b4fc' : '#cbd5e1',
                    fontWeight: key === 'id' ? '700' : key === 'question' ? '500' : '400',
                  }}>
                    {style ? (
                      <div style={{
                        padding: '0.45rem 0.7rem',
                        background: style.bg,
                        borderRadius: '6px',
                        color: style.color,
                        fontSize: '13px',
                        lineHeight: '1.6',
                      }}>
                        {display}
                      </div>
                    ) : (
                      display
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DecisionTable
