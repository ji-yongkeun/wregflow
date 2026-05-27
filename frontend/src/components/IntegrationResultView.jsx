import { useState } from 'react'

export function IntegrationResultView({ result, onClose }) {
  const [expandedSection, setExpandedSection] = useState(null)

  if (!result) {
    return null
  }

  const sections = [
    {
      id: 'process',
      title: '📊 통합 프로세스 흐름',
      key: 'integrated_process',
    },
    {
      id: 'interactions',
      title: '🔗 부서 간 데이터 흐름',
      key: 'department_interactions',
    },
    {
      id: 'decisions',
      title: '⚡ 의사결정 포인트',
      key: 'critical_decision_points',
    },
    {
      id: 'dataflow',
      title: '📈 데이터 흐름도',
      key: 'data_flow_diagram',
    },
    {
      id: 'interfaces',
      title: '🖥️ 시스템 인터페이스',
      key: 'system_interfaces',
    },
    {
      id: 'risks',
      title: '⚠️ 리스크 포인트',
      key: 'risk_points',
    },
    {
      id: 'improvements',
      title: '💡 개선 기회',
      key: 'improvement_opportunities',
    }
  ]

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id)
  }

  return (
    <div className="integration-result-overlay">
      <div className="integration-result-panel">
        <div className="result-header">
          <div className="result-title">
            <h2>🎯 통합 분석 결과</h2>
            <p>{result.group_name}</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="result-content">
          {sections.map(section => {
            const data = result.integrated_data?.[section.key]
            
            return (
              <div key={section.id} className="result-section">
                <div
                  className="section-header"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="section-title">
                    <h3>{section.title}</h3>
                  </div>
                  <span className="toggle-icon">
                    {expandedSection === section.id ? '▼' : '▶'}
                  </span>
                </div>

                {expandedSection === section.id && (
                  <div className="section-body">
                    <pre className="result-json">
                      {typeof data === 'string'
                        ? data
                        : JSON.stringify(data, null, 2)
                      }
                    </pre>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="result-footer">
          <p className="result-date">
            생성: {new Date(result.created_at).toLocaleString('ko-KR')}
          </p>
          <button className="btn-close" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

export default IntegrationResultView
