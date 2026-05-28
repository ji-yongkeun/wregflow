import { useState } from 'react'
import SwimlaneDiagram from './SwimlaneDiagram'
import DecisionTable from './DecisionTable'
import { downloadAsJson, downloadRaciAsCsv, downloadDecisionsAsCsv, downloadSingleAnalysisExcel, downloadSwimlanePPT, downloadRaciPPT, downloadDecisionsPPT, downloadSwimlaneImage, downloadRaciImage, downloadDecisionsImage } from '../utils/downloadUtils'
import ExcelDropdownButton from './ExcelDropdownButton'

// 알려진 RACI 컬럼 순서/레이블
const RACI_COL_ORDER  = ['task','responsible','accountable','consulted','informed']
const RACI_COL_LABELS = {
  task:'작업', responsible:'R (수행)', accountable:'A (책임)',
  consulted:'C (합의)', informed:'I (보고)',
}
const RACI_HEADER_COLORS = {
  task: '#93c5fd', responsible: '#a5b4fc', accountable: '#c4b5fd',
  consulted: '#86efac', informed: '#fbbf24',
}

function RACIMatrix({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <p className="no-data">데이터가 없습니다</p>
  }

  // JSON에 있는 모든 키 동적 수집 (알려진 순서 먼저, 나머지 추가)
  const allKeys = [...new Set(data.flatMap(item => Object.keys(item)))]
  const orderedKeys = [
    ...RACI_COL_ORDER.filter(k => allKeys.includes(k)),
    ...allKeys.filter(k => !RACI_COL_ORDER.includes(k)),
  ]

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '13px',
        minWidth: `${orderedKeys.length * 160}px`,
      }}>
        <thead>
          <tr style={{
            background: 'linear-gradient(135deg, rgba(79,70,229,0.22), rgba(79,70,229,0.06))',
            borderBottom: '2px solid #4f46e5',
          }}>
            {orderedKeys.map(key => (
              <th key={key} style={{
                padding: '0.9rem 1rem',
                textAlign: 'left',
                color: RACI_HEADER_COLORS[key] || '#93c5fd',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                minWidth: key === 'task' ? '240px' : '120px',
              }}>
                {RACI_COL_LABELS[key] || key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr
              key={idx}
              style={{ borderBottom: '1px solid #1e293b', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {orderedKeys.map(key => {
                const val = item[key]
                const display = val === null || val === undefined ? '-'
                  : typeof val === 'object' ? JSON.stringify(val)
                  : String(val)
                return (
                  <td key={key} style={{
                    padding: '0.8rem 1rem',
                    color: key === 'task' ? '#e2e8f0' : '#94a3b8',
                    fontWeight: key === 'task' ? '500' : '400',
                    lineHeight: '1.6',
                    verticalAlign: 'top',
                  }}>
                    {display}
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

export function AnalysisDetailView({ analysis, onClose }) {
  const [selectedTab, setSelectedTab] = useState('swimlane')
  const [copiedJson, setCopiedJson] = useState(false)

  if (!analysis) {
    return null
  }

  const handleDownloadImage = () => {
    const date = new Date().toISOString().slice(0, 10)
    const parse = v => typeof v === 'string' ? JSON.parse(v) : v

    if (selectedTab === 'swimlane') {
      downloadSwimlaneImage(parse(analysis.swim_lanes), analysis.process_name, null, `swimlane_${date}.png`)
    } else if (selectedTab === 'raci') {
      downloadRaciImage(parse(analysis.raci), analysis.process_name, `raci_${date}.png`)
    } else if (selectedTab === 'decisions') {
      downloadDecisionsImage(parse(analysis.decisions), analysis.process_name, `decisions_${date}.png`)
    }
  }

  const handleDownloadPPT = async () => {
    const date = new Date().toISOString().slice(0, 10)
    const parse = v => typeof v === 'string' ? JSON.parse(v) : v

    if (selectedTab === 'swimlane') {
      await downloadSwimlanePPT(parse(analysis.swim_lanes), analysis.process_name, `swimlane_${date}.pptx`)
    } else if (selectedTab === 'raci') {
      await downloadRaciPPT(parse(analysis.raci), analysis.process_name, `raci_${date}.pptx`)
    } else if (selectedTab === 'decisions') {
      await downloadDecisionsPPT(parse(analysis.decisions), analysis.process_name, `decisions_${date}.pptx`)
    }
  }

  const copyToClipboard = (data) => {
    try {
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
      navigator.clipboard.writeText(jsonString)
      setCopiedJson(true)
      setTimeout(() => setCopiedJson(false), 2000)
    } catch (err) {
      console.error('클립보드 복사 실패:', err)
      alert('클립보드 복사에 실패했습니다')
    }
  }

  const handleDownloadJson = async () => {
    const currentDate = new Date().toISOString().slice(0, 10)
    
    switch(selectedTab) {
      case 'swimlane':
        downloadAsJson(analysis.swim_lanes, `swimlane_${currentDate}.json`)
        break
      case 'raci':
        downloadAsJson(analysis.raci, `raci_${currentDate}.json`)
        break
      case 'decisions':
        downloadAsJson(analysis.decisions, `decisions_${currentDate}.json`)
        break
      default:
        break
    }
  }

  const handleDownloadCsv = async () => {
    const currentDate = new Date().toISOString().slice(0, 10)
    
    switch(selectedTab) {
      case 'raci':
        downloadRaciAsCsv(analysis.raci, `raci_${currentDate}.csv`)
        break
      case 'decisions':
        downloadDecisionsAsCsv(analysis.decisions, `decisions_${currentDate}.csv`)
        break
      default:
        alert('이 탭에서는 CSV 다운로드를 지원하지 않습니다')
        break
    }
  }

  const handleDownloadProcessExcel = async (type) => {
    await downloadSingleAnalysisExcel(analysis, type)
  }

  const renderContent = (data) => {
    if (!data) return '데이터가 없습니다'
    
    try {
      if (typeof data === 'string') {
        const parsed = JSON.parse(data)
        return JSON.stringify(parsed, null, 2)
      }
      return JSON.stringify(data, null, 2)
    } catch (e) {
      return String(data)
    }
  }

  const getTabData = () => {
    switch(selectedTab) {
      case 'swimlane':
        return {
          title: '🏊 Swim Lane 다이어그램',
          data: analysis.swim_lanes,
          component: (
            <SwimlaneDiagram 
              data={
                typeof analysis.swim_lanes === 'string' 
                  ? JSON.parse(analysis.swim_lanes)
                  : analysis.swim_lanes
              }
              raci={
                typeof analysis.raci === 'string'
                  ? JSON.parse(analysis.raci)
                  : analysis.raci
              }
              decisions={
                typeof analysis.decisions === 'string'
                  ? JSON.parse(analysis.decisions)
                  : analysis.decisions
              }
            />
          )
        }
      case 'raci':
        return {
          title: '👥 RACI 매트릭스',
          data: analysis.raci,
          component: (
            <RACIMatrix 
              data={
                typeof analysis.raci === 'string' 
                  ? JSON.parse(analysis.raci)
                  : analysis.raci
              }
            />
          )
        }
      case 'decisions':
        return {
          title: '⚡ 의사결정 포인트',
          data: analysis.decisions,
          component: (
            <DecisionTable 
              data={
                typeof analysis.decisions === 'string' 
                  ? JSON.parse(analysis.decisions)
                  : analysis.decisions
              }
            />
          )
        }
      default:
        return { title: '', data: null, component: null }
    }
  }

  const currentTab = getTabData()

  return (
    <div className="analysis-detail-overlay">
      <div className="analysis-detail-panel">
        <div className="detail-header">
          <div className="detail-title">
            <h2>📋 분석 상세보기</h2>
            <p>{analysis.file_name}</p>
            <p className="detail-edition">{analysis.edition}</p>
          </div>
          <button className="detail-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="detail-info-bar">
          <div className="info-item">
            <strong>파일:</strong> {analysis.file_name}
          </div>
          <div className="info-item">
            <strong>편:</strong> {analysis.edition}
          </div>
          <div className="info-item">
            <strong>프로세스:</strong> {analysis.process_name || '(없음)'}
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="detail-content">
          {/* 좌측: 선택 가능한 섹션 */}
          <div className="detail-sections">
            <h3>📝 상세 정보</h3>
            
            {/* Swim Lane 버튼 */}
            <div 
              className={`section-button ${selectedTab === 'swimlane' ? 'active' : ''}`}
              onClick={() => setSelectedTab('swimlane')}
            >
              <div className="section-button-header">
                <span className="icon">🏊</span>
                <span>Swim Lane</span>
              </div>
              <span className="arrow">▶</span>
            </div>

            {/* RACI 버튼 */}
            <div 
              className={`section-button ${selectedTab === 'raci' ? 'active' : ''}`}
              onClick={() => setSelectedTab('raci')}
            >
              <div className="section-button-header">
                <span className="icon">👥</span>
                <span>RACI 매트릭스</span>
              </div>
              <span className="arrow">▶</span>
            </div>

            {/* 의사결정 버튼 */}
            <div 
              className={`section-button ${selectedTab === 'decisions' ? 'active' : ''}`}
              onClick={() => setSelectedTab('decisions')}
            >
              <div className="section-button-header">
                <span className="icon">⚡</span>
                <span>의사결정</span>
              </div>
              <span className="arrow">▶</span>
            </div>
          </div>

          {/* 우측: 시각화 + JSON */}
          <div className="detail-visualization">
            {currentTab.data ? (
              <>
                <div className="viz-header">
                  <h3>{currentTab.title}</h3>
                  <div className="download-buttons">
                    <button
                      className="btn-download-image"
                      onClick={handleDownloadImage}
                      title="화면에 보이는 다이어그램을 PNG로 저장"
                    >
                      📥 이미지 저장
                    </button>
                    <button
                      className="btn-download-ppt"
                      onClick={handleDownloadPPT}
                      title="현재 탭을 PowerPoint 파일로 저장"
                    >
                      🖼️ PPT 저장
                    </button>
                    {(selectedTab === 'raci' || selectedTab === 'decisions') && (
                      <button
                        className="btn-download-csv"
                        onClick={handleDownloadCsv}
                        title="데이터를 CSV로 다운로드"
                      >
                        📊 CSV 저장
                      </button>
                    )}
                    <button
                      className="btn-download-json"
                      onClick={handleDownloadJson}
                      title="JSON 데이터를 파일로 다운로드"
                    >
                      💾 JSON 저장
                    </button>
                    <ExcelDropdownButton onSelect={handleDownloadProcessExcel} />
                    <button
                      className={`btn-copy-json ${copiedJson ? 'copied' : ''}`}
                      onClick={() => copyToClipboard(currentTab.data)}
                      title="JSON을 클립보드에 복사"
                    >
                      {copiedJson ? '✓ 복사됨' : '📋 JSON 복사'}
                    </button>
                  </div>
                </div>

                {/* 시각화 */}
                {currentTab.component && (
                  <div className="viz-diagram">
                    {currentTab.component}
                  </div>
                )}

                {/* JSON 표시 */}
                <div className="viz-json">
                  <div className="json-header">
                    <h4>JSON 데이터</h4>
                  </div>
                  <pre className="json-content">
                    {renderContent(currentTab.data)}
                  </pre>
                </div>
              </>
            ) : (
              <div className="no-data">
                <p>데이터를 선택해주세요</p>
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
