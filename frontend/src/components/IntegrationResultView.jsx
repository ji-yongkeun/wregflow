import { useState, useRef } from 'react'
import SwimlaneDiagram from './SwimlaneDiagram'
import DecisionTable from './DecisionTable'
import {
  downloadAsJson, downloadRaciAsCsv, downloadDecisionsAsCsv,
  downloadProcessExcel,
  downloadSwimlanePPT, downloadRaciPPT, downloadDecisionsPPT,
  downloadSwimlaneImage, downloadRaciImage, downloadDecisionsImage,
  downloadElementAsPdfA3
} from '../utils/downloadUtils'
import ExcelDropdownButton from './ExcelDropdownButton'

// ── 동적 RACI 테이블 (분석 상세보기와 동일) ──────────────────────────────────
const RACI_COL_ORDER  = ['task','responsible','accountable','consulted','informed','regulation_ref']
const RACI_COL_LABELS = {
  task:'작업', responsible:'R (수행)', accountable:'A (책임)',
  consulted:'C (합의)', informed:'I (보고)',
  regulation_ref: '관련 규정',
}
const RACI_HEADER_COLORS = {
  task:'#93c5fd', responsible:'#a5b4fc', accountable:'#c4b5fd',
  consulted:'#86efac', informed:'#fbbf24',
}

function RACIMatrix({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <p className="no-data">데이터가 없습니다</p>
  }
  const allKeys = [...new Set(data.flatMap(item => Object.keys(item)))]
  const orderedKeys = [
    ...RACI_COL_ORDER.filter(k => allKeys.includes(k)),
    ...allKeys.filter(k => !RACI_COL_ORDER.includes(k)),
  ]
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: `${orderedKeys.length * 160}px` }}>
        <thead>
          <tr style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.22), rgba(79,70,229,0.06))', borderBottom: '2px solid #4f46e5' }}>
            {orderedKeys.map(key => (
              <th key={key} style={{ padding: '0.9rem 1rem', textAlign: 'left', color: RACI_HEADER_COLORS[key] || '#93c5fd', fontWeight: '700', whiteSpace: 'nowrap', minWidth: key === 'task' ? '240px' : '120px' }}>
                {RACI_COL_LABELS[key] || key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #1e293b', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {orderedKeys.map(key => {
                const val = item[key]
                const display = val === null || val === undefined ? '-' : typeof val === 'object' ? JSON.stringify(val) : String(val)
                return (
                  <td key={key} style={{ padding: '0.8rem 1rem', color: key === 'task' ? '#e2e8f0' : '#94a3b8', fontWeight: key === 'task' ? '500' : '400', lineHeight: '1.6', verticalAlign: 'top' }}>
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

// ── 통합 데이터 변환 함수 ─────────────────────────────────────────────────────
function buildSwimlaneData(result) {
  const steps = result.integrated_data?.integrated_process?.steps || []
  const lanesMap = {}
  steps.forEach((step, idx) => {
    const dept = step.responsible_department || '기타'
    if (!lanesMap[dept]) lanesMap[dept] = []
    lanesMap[dept].push({
      order: step.step_number || (idx + 1),
      action: step.step_name || '',
      decision: DECISION_KEYWORDS.some(kw => (step.step_name||'').includes(kw)),
      task_type: 'general',
      description: step.description || '',
      outputs: step.outputs || [],
      related_editions: step.related_editions || [],
      regulation_ref: step.regulation_ref || '',
    })
  })
  return Object.keys(lanesMap).map(role => ({
    role,
    steps: lanesMap[role].sort((a, b) => a.order - b.order),
  }))
}

function buildRaciData(result) {
  const steps = result.integrated_data?.integrated_process?.steps || []
  const interactions = result.integrated_data?.department_interactions || []
  return steps.map(step => {
    const consultedDepts = []
    const informedDepts  = []
    interactions.forEach(inter => {
      if (inter.from_dept === step.responsible_department) informedDepts.push(inter.to_dept)
      else if (inter.to_dept === step.responsible_department) consultedDepts.push(inter.from_dept)
    })
    return {
      task:        step.step_name || '',
      responsible: step.responsible_department || '-',
      accountable: step.responsible_department || '-',
      consulted:   [...new Set(consultedDepts)].filter(d => d !== step.responsible_department).join(', ') || '-',
      informed:    [...new Set(informedDepts)].filter(d => d !== step.responsible_department).join(', ')  || '-',
    }
  })
}

const DECISION_KEYWORDS = ['여부', '검토', '심사', '결정', '판단', '승인', '확인', '심의', '적정성']

function buildDecisionsData(result) {
  // 1순위: critical_decision_points
  const points = result.integrated_data?.critical_decision_points || []
  if (points.length > 0) {
    return points.map((p, idx) => ({
      id:          p.id || (idx + 1),
      question:    p.point_name || '',
      yes_outcome: p.description || '',
      no_outcome:  p.impact || '',
    }))
  }
  // 2순위: integrated_process.steps 키워드 기반 생성
  const steps = result.integrated_data?.integrated_process?.steps || []
  const generated = []
  let id = 1
  for (const step of steps) {
    const name = step.step_name || ''
    if (DECISION_KEYWORDS.some(kw => name.includes(kw))) {
      generated.push({
        id: id++,
        question: name,
        yes_outcome: step.description || '해당 조건 만족 시 진행',
        no_outcome:  '조건 불만족 시 반려/보완',
      })
    }
  }
  return generated
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export function IntegrationResultView({ result, onClose }) {
  const [selectedTab, setSelectedTab] = useState('swimlane')
  const [copiedJson, setCopiedJson]   = useState(false)
  const vizDiagramRef = useRef(null)

  if (!result) return null

  const processName = result.group_name || '통합 프로세스'
  const swimData    = buildSwimlaneData(result)
  const raciData    = buildRaciData(result)
  const decisionsData = buildDecisionsData(result)

  const getTabData = () => {
    switch (selectedTab) {
      case 'swimlane':  return { title: '🏊 Swim Lane 다이어그램', data: swimData,       component: <SwimlaneDiagram data={swimData} /> }
      case 'raci':      return { title: '👥 RACI 매트릭스',        data: raciData,       component: <RACIMatrix data={raciData} /> }
      case 'decisions': return { title: '⚡ 의사결정 포인트',       data: decisionsData.length > 0 ? decisionsData : null,  component: <DecisionTable data={decisionsData} /> }
      default:          return { title: '', data: null, component: null }
    }
  }

  const currentTab = getTabData()

  // ── 다운로드 핸들러 ──────────────────────────────────────────────────────────
  const date = () => new Date().toISOString().slice(0, 10)

  const handleDownloadImagePPT = async () => {
    const tabTitles = { swimlane: 'Swim Lane 다이어그램', raci: 'RACI 매트릭스', decisions: '의사결정 포인트' }
    await downloadElementAsPdfA3(
      vizDiagramRef.current,
      `${processName} — ${tabTitles[selectedTab] || ''}`.trim(),
      `integrated_${selectedTab}_A3세로_${date()}.pdf`
    )
  }

  const handleDownloadPPT = async () => {
    if (selectedTab === 'swimlane')       await downloadSwimlanePPT(swimData,      processName, `integrated_swimlane_A3가로_${date()}.pptx`)
    else if (selectedTab === 'raci')      await downloadRaciPPT(raciData,          processName, `integrated_raci_${date()}.pptx`)
    else if (selectedTab === 'decisions') await downloadDecisionsPPT(decisionsData, processName, `integrated_decisions_${date()}.pptx`)
  }

  const handleDownloadJson = () => {
    const map = { swimlane: swimData, raci: raciData, decisions: decisionsData }
    downloadAsJson(map[selectedTab], `integrated_${selectedTab}_${date()}.json`)
  }

  const handleDownloadCsv = () => {
    if (selectedTab === 'raci')      downloadRaciAsCsv(raciData,          `integrated_raci_${date()}.csv`)
    else if (selectedTab === 'decisions') downloadDecisionsAsCsv(decisionsData, `integrated_decisions_${date()}.csv`)
    else alert('이 탭에서는 CSV 다운로드를 지원하지 않습니다')
  }

  const handleDownloadExcel = async (type) => {
    try {
      await downloadProcessExcel({
        process_name:      processName,
        swim_lanes:        swimData,
        raci:              raciData,
        decisions:         decisionsData,
        system_interfaces: result.integrated_data?.system_interfaces || [],
      }, type)
    } catch (err) {
      alert('엑셀 다운로드 실패: ' + err.message)
    }
  }

  const copyToClipboard = () => {
    try {
      const map = { swimlane: swimData, raci: raciData, decisions: decisionsData }
      navigator.clipboard.writeText(JSON.stringify(map[selectedTab], null, 2))
      setCopiedJson(true)
      setTimeout(() => setCopiedJson(false), 2000)
    } catch { alert('클립보드 복사 실패') }
  }

  const renderContent = data => data ? JSON.stringify(data, null, 2) : '데이터가 없습니다'

  // ── 렌더 ─────────────────────────────────────────────────────────────────────
  return (
    <div className="analysis-detail-overlay">
      <div className="analysis-detail-panel">

        {/* 헤더 */}
        <div className="detail-header">
          <div className="detail-title">
            <h2>📋 통합 분석 상세보기</h2>
            <p>{result.group_name}</p>
          </div>
          <button className="detail-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* 정보 바 */}
        <div className="detail-info-bar">
          <div className="info-item"><strong>통합 분석명:</strong> {result.group_name}</div>
          <div className="info-item"><strong>통합 대상:</strong> {result.analysis_count || 0}개 분석 규정</div>
          <div className="info-item"><strong>생성 일시:</strong> {new Date(result.created_at).toLocaleString('ko-KR')}</div>
        </div>

        {/* 본문 */}
        <div className="detail-content">
          {/* 좌측 사이드바 */}
          <div className="detail-sections">
            <h3>📝 상세 정보</h3>
            {[
              { id: 'swimlane',  icon: '🏊', label: 'Swim Lane' },
              { id: 'raci',      icon: '👥', label: 'RACI 매트릭스' },
              { id: 'decisions', icon: '⚡', label: '의사결정' },
            ].map(({ id, icon, label }) => (
              <div key={id} className={`section-button ${selectedTab === id ? 'active' : ''}`} onClick={() => setSelectedTab(id)}>
                <div className="section-button-header">
                  <span className="icon">{icon}</span>
                  <span>{label}</span>
                </div>
                <span className="arrow">▶</span>
              </div>
            ))}
          </div>

          {/* 우측 시각화 */}
          <div className="detail-visualization">
            {currentTab.data ? (
              <>
                <div className="viz-header">
                  <h3>{currentTab.title}</h3>
                  <div className="download-buttons">
                    {selectedTab === 'swimlane' && (
                      <button className="btn-download-ppt-image" onClick={handleDownloadImagePPT} title="화면 이미지를 PDF A3 세로 형식으로 저장">
                        📄 PDF A3세로
                      </button>
                    )}
                    <button className="btn-download-ppt" onClick={handleDownloadPPT} title={selectedTab === 'swimlane' ? 'A3 가로 형식 스윔레인 PPT' : 'PPT 저장'}>
                      {selectedTab === 'swimlane' ? '📐 A3가로 PPT' : '🖼️ PPT 저장'}
                    </button>
                    {(selectedTab === 'raci' || selectedTab === 'decisions') && (
                      <button className="btn-download-csv" onClick={handleDownloadCsv} title="CSV 저장">
                        📊 CSV 저장
                      </button>
                    )}
                    <button className="btn-download-json" onClick={handleDownloadJson} title="JSON 저장">
                      💾 JSON 저장
                    </button>
                    {selectedTab === 'swimlane' && (
                      <ExcelDropdownButton onSelect={handleDownloadExcel} />
                    )}
                    <button className={`btn-copy-json ${copiedJson ? 'copied' : ''}`} onClick={copyToClipboard} title="복사">
                      {copiedJson ? '✓ 복사됨' : '📋 JSON 복사'}
                    </button>
                  </div>
                </div>

                {/* 시각화 */}
                <div className="viz-diagram" ref={vizDiagramRef}>
                  {currentTab.component}
                </div>

                {/* JSON */}
                <div className="viz-json">
                  <div className="json-header"><h4>JSON 데이터</h4></div>
                  <pre className="json-content">{renderContent(currentTab.data)}</pre>
                </div>
              </>
            ) : (
              <div className="no-data"><p>데이터를 선택해주세요</p></div>
            )}
          </div>
        </div>

        <div className="detail-footer">
          <button className="btn-close-detail" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  )
}

export default IntegrationResultView
