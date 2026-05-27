import { useState } from 'react'
import SwimlaneDiagram from './SwimlaneDiagram'

// RACIMatrix 로컬 컴포넌트 정의
function RACIMatrix({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <p className="no-data">데이터가 없습니다</p>
  }
  return (
    <table className="raci-table">
      <thead>
        <tr>
          <th>작업</th>
          <th>R</th>
          <th>A</th>
          <th>C</th>
          <th>I</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => (
          <tr key={idx}>
            <td>{item.task}</td>
            <td>{item.responsible}</td>
            <td>{item.accountable}</td>
            <td>{item.consulted}</td>
            <td>{item.informed}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// DecisionMap 로컬 컴포넌트 정의
function DecisionMap({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <p className="no-data">데이터가 없습니다</p>
  }
  return (
    <div className="decisions-list">
      {data.map((decision, idx) => (
        <div key={idx} className="decision-box">
          <p className="question">Q: {decision.question}</p>
          <div className="outcomes">
            <div className="yes">✓ Yes: {decision.yes_outcome}</div>
            <div className="no">✗ No: {decision.no_outcome}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function AnalysisDetailView({ analysis, onClose }) {
  const [expandedSection, setExpandedSection] = useState(null)

  if (!analysis) {
    return null
  }

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id)
  }

  const sections = [
    {
      id: 'process',
      title: '📊 프로세스 흐름',
      key: 'process_flow',
    },
    {
      id: 'swimlane',
      title: '🏊 Swim Lane',
      key: 'swim_lanes',
    },
    {
      id: 'raci',
      title: '👥 RACI 매트릭스',
      key: 'raci',
    },
    {
      id: 'decisions',
      title: '⚡ 의사결정',
      key: 'decisions',
    },
  ]

  const renderContent = (key, data) => {
    if (!data) {
      return '데이터가 없습니다'
    }
    
    try {
      if (typeof data === 'string') {
        // JSON 문자열인 경우 파싱
        const parsed = JSON.parse(data)
        return JSON.stringify(parsed, null, 2)
      }
      
      if (typeof data === 'object') {
        return JSON.stringify(data, null, 2)
      }
      
      return String(data)
    } catch (e) {
      return String(data)
    }
  }

  return (
    <div className="analysis-detail-overlay" onClick={onClose}>
      <div className="analysis-detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <div className="detail-title">
            <h2>📋 분석 상세보기</h2>
            <p>{analysis.file_name}</p>
            <p className="detail-edition">{analysis.edition ? `${analysis.edition}편` : ''}</p>
          </div>
          <button className="detail-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* 상단: 기본 정보 */}
        <div className="detail-info-bar">
          <div className="info-item">
            <strong>파일명:</strong> {analysis.file_name}
          </div>
          <div className="info-item">
            <strong>편:</strong> {analysis.edition ? `${analysis.edition}편` : '(없음)'}
          </div>
          <div className="info-item">
            <strong>프로세스명:</strong> {analysis.process_name || '(없음)'}
          </div>
        </div>

        {/* 좌측: 섹션별 JSON, 우측: 다이어그램 표시 */}
        <div className="detail-content">
          {/* 좌측 */}
          <div className="detail-sections">
            <h3>📝 상세 정보 (JSON)</h3>
            {sections.map(section => {
              const data = analysis[section.key]
              
              return (
                <div key={section.id} className="detail-section">
                  <div
                    className="section-header"
                    onClick={() => toggleSection(section.id)}
                  >
                    <h4>{section.title}</h4>
                    <span className="toggle-icon">
                      {expandedSection === section.id ? '▼' : '▶'}
                    </span>
                  </div>

                  {expandedSection === section.id && (
                    <div className="section-body">
                      <pre className="json-content">
                        {renderContent(section.key, data)}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 우측 */}
          <div className="detail-diagrams">
            <h3>🎨 시각화</h3>
            
            {/* Swim Lane */}
            {analysis.swim_lanes && (
              <div className="diagram-container">
                <h4>🏊 Swim Lane 다이어그램</h4>
                <div className="swimlane-wrapper">
                  <SwimlaneDiagram 
                    analysis={{
                      ...analysis,
                      swim_lanes: typeof analysis.swim_lanes === 'string' 
                        ? JSON.parse(analysis.swim_lanes)
                        : analysis.swim_lanes
                    }}
                    data={
                      typeof analysis.swim_lanes === 'string' 
                        ? JSON.parse(analysis.swim_lanes)
                        : analysis.swim_lanes
                    } 
                  />
                </div>
              </div>
            )}
            
            {/* RACI 매트릭스 */}
            {analysis.raci && (
              <div className="diagram-container">
                <h4>👥 RACI 매트릭스</h4>
                <div className="raci-wrapper">
                  <RACIMatrix 
                    data={
                      typeof analysis.raci === 'string' 
                        ? JSON.parse(analysis.raci)
                        : analysis.raci
                    } 
                  />
                </div>
              </div>
            )}
            
            {/* 의사결정 */}
            {(analysis.decisions || analysis.decision_points) && (
              <div className="diagram-container">
                <h4>⚡ 의사결정 포인트</h4>
                <div className="decision-wrapper">
                  {analysis.decisions && (
                    <DecisionMap
                      data={
                        typeof analysis.decisions === 'string'
                          ? JSON.parse(analysis.decisions)
                          : analysis.decisions
                      }
                    />
                  )}
                  {analysis.decision_points && (
                    <DecisionMap
                      data={
                        typeof analysis.decision_points === 'string'
                          ? JSON.parse(analysis.decision_points)
                          : analysis.decision_points
                      }
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="detail-footer">
          <button className="btn-close-detail" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

export default AnalysisDetailView
