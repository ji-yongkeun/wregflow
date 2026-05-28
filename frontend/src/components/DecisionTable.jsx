export function DecisionTable({ data }) {
  if (!data) {
    return <div style={{ color: '#cbd5e1', padding: '1rem' }}>데이터가 없습니다</div>
  }

  let decisions = data
  if (typeof data === 'string') {
    try {
      decisions = JSON.parse(data)
    } catch (e) {
      return <div style={{ color: '#cbd5e1', padding: '1rem' }}>데이터 파싱 오류</div>
    }
  }

  if (!Array.isArray(decisions)) {
    decisions = [decisions]
  }

  return (
    <div style={{
      width: '100%',
      overflow: 'x-auto',
      background: '#0f172a',
      borderRadius: '8px'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        color: '#cbd5e1'
      }}>
        <thead>
          <tr style={{
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(79, 70, 229, 0.05))',
            borderBottom: '2px solid #4F46E5'
          }}>
            <th style={{
              padding: '1rem',
              textAlign: 'left',
              color: '#93c5fd',
              fontWeight: '600',
              fontSize: '13px',
              minWidth: '50px'
            }}>ID</th>
            <th style={{
              padding: '1rem',
              textAlign: 'left',
              color: '#93c5fd',
              fontWeight: '600',
              fontSize: '13px',
              minWidth: '300px'
            }}>질문</th>
            <th style={{
              padding: '1rem',
              textAlign: 'left',
              color: '#10b981',
              fontWeight: '600',
              fontSize: '13px',
              minWidth: '250px'
            }}>✓ YES 결과</th>
            <th style={{
              padding: '1rem',
              textAlign: 'left',
              color: '#ef4444',
              fontWeight: '600',
              fontSize: '13px',
              minWidth: '250px'
            }}>✗ NO 결과</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map((decision, idx) => (
            <tr key={idx} style={{
              borderBottom: '1px solid #334155',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{
                padding: '1rem',
                color: '#93c5fd',
                fontWeight: '600',
                fontSize: '12px'
              }}>
                {decision.id || idx + 1}
              </td>
              <td style={{
                padding: '1rem',
                color: '#cbd5e1',
                fontSize: '12px',
                lineHeight: '1.5'
              }}>
                <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                  {decision.question || '(질문 없음)'}
                </div>
              </td>
              <td style={{
                padding: '1rem',
                color: '#cbd5e1',
                fontSize: '12px',
                lineHeight: '1.5',
                borderLeft: '2px solid rgba(16, 185, 129, 0.3)'
              }}>
                <div style={{
                  padding: '0.5rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '4px',
                  color: '#10b981'
                }}>
                  {decision.yes_outcome || decision.yesOutcome || '(결과 없음)'}
                </div>
              </td>
              <td style={{
                padding: '1rem',
                color: '#cbd5e1',
                fontSize: '12px',
                lineHeight: '1.5',
                borderLeft: '2px solid rgba(239, 68, 68, 0.3)'
              }}>
                <div style={{
                  padding: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '4px',
                  color: '#ef4444'
                }}>
                  {decision.no_outcome || decision.noOutcome || '(결과 없음)'}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DecisionTable
