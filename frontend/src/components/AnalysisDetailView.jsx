import { useState, useRef } from 'react'
import SwimlaneDiagram from './SwimlaneDiagram'
import DecisionTable from './DecisionTable'
import { downloadSvgAsImage, downloadAsJson, downloadRaciAsCsv, downloadDecisionsAsCsv, downloadTableAsImage, downloadSingleAnalysisExcel } from '../utils/downloadUtils'

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

export function AnalysisDetailView({ analysis, onClose }) {
  const [selectedTab, setSelectedTab] = useState('swimlane')
  const [copiedJson, setCopiedJson] = useState(false)
  const swimlaneSvgRef = useRef(null)
  const raciTableRef = useRef(null)
  const decisionTableRef = useRef(null)

  // 일괄/오프스크린 이미지 캡처용 Ref
  const captureSwimlaneRef = useRef(null)
  const captureRaciRef = useRef(null)
  const captureDecisionRef = useRef(null)

  if (!analysis) {
    return null
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

  const handleDownload = async () => {
    const currentDate = new Date().toISOString().slice(0, 10)
    
    switch(selectedTab) {
      case 'swimlane':
        if (captureSwimlaneRef.current) {
          await downloadTableAsImage(captureSwimlaneRef.current, `swimlane_${currentDate}.png`)
        }
        break
      case 'raci':
        if (captureRaciRef.current) {
          await downloadTableAsImage(captureRaciRef.current, `raci_${currentDate}.png`)
        }
        break
      case 'decisions':
        if (captureDecisionRef.current) {
          await downloadTableAsImage(captureDecisionRef.current, `decisions_${currentDate}.png`)
        }
        break
      default:
        break
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
                      onClick={handleDownload}
                      title="다이어그램/테이블을 이미지로 다운로드"
                    >
                      📥 이미지 저장
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
                    <button 
                      className="btn-download-excel"
                      style={{ background: '#3730a3', color: '#ffffff', borderColor: '#4f46e5', marginLeft: '5px' }}
                      onClick={() => handleDownloadProcessExcel('fs')}
                      title="전체 프로세스를 FS(기능정의) 기준 엑셀로 다운로드"
                    >
                      📊 엑셀 저장 (FS 기준)
                    </button>
                    <button 
                      className="btn-download-excel"
                      style={{ background: '#b45309', color: '#ffffff', borderColor: '#d97706', marginLeft: '5px' }}
                      onClick={() => handleDownloadProcessExcel('ft')}
                      title="전체 프로세스를 FT(테스트시나리오) 기준 엑셀로 다운로드"
                    >
                      📊 엑셀 저장 (FT 기준)
                    </button>
                    <button 
                      className={`btn-copy-json ${copiedJson ? 'copied' : ''}`}
                      onClick={() => copyToClipboard(currentTab.data)}
                      title="JSON을 클립보드에 복사"
                    >
                      {copiedJson ? '✓ 복사됨' : '📋 복사'}
                    </button>
                  </div>
                </div>

                {/* 시각화 */}
                {currentTab.component && (
                  <div 
                    className="viz-diagram"
                    ref={selectedTab === 'swimlane' ? swimlaneSvgRef : selectedTab === 'raci' ? raciTableRef : decisionTableRef}
                  >
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

        {/* 캡처를 위한 오프스크린(숨겨진) 렌더링 컨테이너 */}
        <div style={{ position: 'fixed', top: 0, left: '-99999px', width: '3000px', height: '3000px', pointerEvents: 'none', zIndex: -9999 }}>
          <div ref={captureSwimlaneRef} style={{ width: 'max-content', minWidth: '1200px', background: '#0f172a', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#93c5fd', marginBottom: '15px' }}>🏊 Swim Lane 다이어그램</h3>
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
          </div>
          <div ref={captureRaciRef} style={{ width: '800px', background: '#0f172a', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#93c5fd', marginBottom: '15px' }}>👥 RACI 매트릭스</h3>
            <RACIMatrix 
              data={
                typeof analysis.raci === 'string' 
                  ? JSON.parse(analysis.raci)
                  : analysis.raci
              }
            />
          </div>
          <div ref={captureDecisionRef} style={{ width: '900px', background: '#0f172a', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#93c5fd', marginBottom: '15px' }}>⚡ 의사결정 포인트</h3>
            <DecisionTable 
              data={
                typeof analysis.decisions === 'string' 
                  ? JSON.parse(analysis.decisions)
                  : analysis.decisions
              }
            />
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
