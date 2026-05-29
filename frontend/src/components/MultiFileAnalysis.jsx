import { useState, useRef } from 'react'
import SwimlaneDiagram from './SwimlaneDiagram'
import DecisionTable from './DecisionTable'
import { downloadSvgAsImage, downloadAsJson, downloadRaciAsCsv, downloadDecisionsAsCsv, downloadTableAsImage, downloadSingleAnalysisExcel, downloadSwimlanePPT, downloadRaciPPT, downloadDecisionsPPT, downloadElementAsPPT } from '../utils/downloadUtils'
import PermissionGuard from './PermissionGuard'
import ExcelDropdownButton from './ExcelDropdownButton'

export function MultiFileAnalysis({ analyses, fileNames, chapterNames }) {
  const [activeFileIndex, setActiveFileIndex] = useState(0)
  const [selectedTab, setSelectedTab] = useState('swimlane')
  const [copiedJson, setCopiedJson] = useState(false)
  const vizDiagramRef = useRef(null)

  if (!analyses || analyses.length === 0) {
    return null
  }

  const currentAnalysis = analyses[activeFileIndex]
  const currentFileName = fileNames[activeFileIndex]
  const currentChapterName = chapterNames ? chapterNames[activeFileIndex] : currentFileName

  // RACI 로컬 컴포넌트
  function RACIMatrix({ data }) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return <p className="no-data">데이터가 없습니다</p>
    }
    return (
      <table className="raci-table">
        <thead>
          <tr>
            <th>작업</th>
            <th>R(실무담당)</th>
            <th>A(최종책임)</th>
            <th>C(협의/자문)</th>
            <th>I(정보수신)</th>
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

  const copyToClipboard = (data) => {
    try {
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
      navigator.clipboard.writeText(jsonString)
      setCopiedJson(true)
      setTimeout(() => setCopiedJson(false), 2000)
    } catch (err) {
      console.error('클립보드 복사 실패:', err)
    }
  }

  const handleDownloadImagePPT = async () => {
    const date = new Date().toISOString().slice(0, 10)
    const tabTitles = { swimlane: 'Swim Lane 다이어그램', raci: 'RACI 매트릭스', decisions: '의사결정 포인트' }
    const processName = currentAnalysis.process_name || currentFileName || 'process'
    
    await downloadElementAsPPT(
      vizDiagramRef.current,
      `${processName} — ${tabTitles[selectedTab] || ''}`.trim(),
      `${selectedTab}_image_${date}.pptx`
    )
  }

  const handleDownloadPPT = async () => {
    const date = new Date().toISOString().slice(0, 10)
    const parse = v => typeof v === 'string' ? JSON.parse(v) : v
    
    const processName = currentAnalysis.process_name || currentFileName || 'process'

    if (selectedTab === 'swimlane') {
      await downloadSwimlanePPT(parse(currentAnalysis.swim_lanes), processName, `swimlane_${date}.pptx`)
    } else if (selectedTab === 'raci') {
      await downloadRaciPPT(parse(currentAnalysis.raci), processName, `raci_${date}.pptx`)
    } else if (selectedTab === 'decisions') {
      await downloadDecisionsPPT(parse(currentAnalysis.decisions), processName, `decisions_${date}.pptx`)
    }
  }

  const handleDownloadJson = () => {
    const currentDate = new Date().toISOString().slice(0, 10)
    
    switch(selectedTab) {
      case 'swimlane':
        downloadAsJson(currentAnalysis.swim_lanes, `swimlane_${currentDate}.json`)
        break
      case 'raci':
        downloadAsJson(currentAnalysis.raci, `raci_${currentDate}.json`)
        break
      case 'decisions':
        downloadAsJson(getDecisionsData(), `decisions_${currentDate}.json`)
        break
      default:
        break
    }
  }

  const handleDownloadCsv = () => {
    const currentDate = new Date().toISOString().slice(0, 10)
    
    switch(selectedTab) {
      case 'raci':
        downloadRaciAsCsv(currentAnalysis.raci, `raci_${currentDate}.csv`)
        break
      case 'decisions':
        downloadDecisionsAsCsv(getDecisionsData(), `decisions_${currentDate}.csv`)
        break
      default:
        break
    }
  }

  const handleDownloadExcel = (type) => {
    downloadSingleAnalysisExcel(currentAnalysis, type)
  }

  const DECISION_KEYWORDS = ['여부', '검토', '심사', '결정', '판단', '승인', '확인', '심의', '적정성']

  const getDecisionsData = () => {
    const raw = typeof currentAnalysis.decisions === 'string'
      ? (() => { try { return JSON.parse(currentAnalysis.decisions) } catch { return [] } })()
      : currentAnalysis.decisions
    if (Array.isArray(raw) && raw.length > 0) return raw
    // fallback: swim_lanes 키워드 기반 생성
    const lanes = typeof currentAnalysis.swim_lanes === 'string'
      ? (() => { try { return JSON.parse(currentAnalysis.swim_lanes) } catch { return [] } })()
      : (currentAnalysis.swim_lanes || [])
    const generated = []
    let id = 1
    for (const lane of lanes) {
      for (const step of (lane.steps || [])) {
        const action = step.action || ''
        if (step.decision || DECISION_KEYWORDS.some(kw => action.includes(kw))) {
          generated.push({
            id: id++,
            question: action || '의사결정',
            yes_outcome: '해당 조건 만족 시 진행',
            no_outcome: '조건 불만족 시 반려/보완',
          })
        }
      }
    }
    return generated
  }

  const renderContent = () => {
    switch(selectedTab) {
      case 'swimlane':
        return (
          <div className="swimlane-viz">
            {currentAnalysis.swim_lanes ? (
              <SwimlaneDiagram 
                data={
                  typeof currentAnalysis.swim_lanes === 'string'
                    ? JSON.parse(currentAnalysis.swim_lanes)
                    : currentAnalysis.swim_lanes
                }
                raci={
                  typeof currentAnalysis.raci === 'string'
                    ? JSON.parse(currentAnalysis.raci)
                    : currentAnalysis.raci
                }
                decisions={
                  typeof currentAnalysis.decisions === 'string'
                    ? JSON.parse(currentAnalysis.decisions)
                    : currentAnalysis.decisions
                }
              />
            ) : (
              <p className="no-data">Swim Lane 데이터가 없습니다</p>
            )}
          </div>
        )
      case 'raci':
        return (
          <div className="raci-viz">
            <RACIMatrix data={currentAnalysis.raci} />
          </div>
        )
      case 'decisions':
        return (
          <div className="decisions-viz">
            <DecisionTable data={getDecisionsData()} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="multi-file-analysis">
      {/* 상단: 파일 탭 네비게이션 */}
      <div className="analysis-header">
        <div className="file-tabs">
          {fileNames.map((fileName, idx) => (
            <button
              key={idx}
              className={`file-tab ${activeFileIndex === idx ? 'active' : ''}`}
              onClick={() => setActiveFileIndex(idx)}
              title={fileName}
            >
              <span className="file-badge">{idx + 1}</span>
              <span className="file-name" style={{marginLeft: '4px'}}>{fileName}</span>
            </button>
          ))}
        </div>
        <div className="file-info">
          <h3>{currentChapterName}</h3>
        </div>
      </div>

      {/* 상단: 탭 선택 카드 (결과가 아래로 나오도록 위로 이동) */}
      <div className="analysis-cards">
        <div 
          className={`card ${selectedTab === 'swimlane' ? 'active' : ''}`}
          onClick={() => setSelectedTab('swimlane')}
        >
          <div className="card-icon">🏊</div>
          <h4>Swim Lane</h4>
          <p>부서/역할별 담당 시각화</p>
        </div>
        
        <div 
          className={`card ${selectedTab === 'raci' ? 'active' : ''}`}
          onClick={() => setSelectedTab('raci')}
        >
          <div className="card-icon">👥</div>
          <h4>RACI 매트릭스</h4>
          <p>책임 관계 정의</p>
        </div>
        
        <div 
          className={`card ${selectedTab === 'decisions' ? 'active' : ''}`}
          onClick={() => setSelectedTab('decisions')}
        >
          <div className="card-icon">⚡</div>
          <h4>의사결정 맵</h4>
          <p>의사결정 분기 자동 추출</p>
        </div>
      </div>

      {/* 중앙: 선택된 탭의 시각화 */}
      <div className="analysis-content">

        <div className="viz-header">
          <h3>
            {selectedTab === 'swimlane' && '🏊 Swim Lane 다이어그램'}
            {selectedTab === 'raci' && '👥 RACI 매트릭스'}
            {selectedTab === 'decisions' && '⚡ 의사결정 포인트'}
          </h3>
          <div className="download-buttons">
            {selectedTab === 'swimlane' && (
              <button 
                className="btn-download-ppt-image"
                onClick={handleDownloadImagePPT}
                title="화면 이미지 그대로 PPT로 저장"
              >
                🖼️ 이미지(PPT)저장
              </button>
            )}
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
            {selectedTab === 'swimlane' && (
              <ExcelDropdownButton onSelect={handleDownloadExcel} />
            )}
            <button 
              className={`btn-copy-json ${copiedJson ? 'copied' : ''}`}
              onClick={() => copyToClipboard(
                selectedTab === 'swimlane' ? currentAnalysis.swim_lanes :
                selectedTab === 'raci' ? currentAnalysis.raci :
                getDecisionsData()
              )}
              title="JSON을 클립보드에 복사"
            >
              {copiedJson ? '✓ 복사됨' : '📋 JSON 복사'}
            </button>
          </div>
        </div>

        <div className="viz-content" ref={vizDiagramRef}>
          {renderContent()}
        </div>
      </div>

      {/* 분석 정보 */}
      <div className="analysis-info">
        <p>
          파일 {activeFileIndex + 1}/{fileNames.length}
          <span className="separator">·</span>
          {currentChapterName}
        </p>
      </div>
    </div>
  )
}

export default MultiFileAnalysis
