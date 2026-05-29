import { useState, useRef } from 'react'
import SwimlaneDiagram from './SwimlaneDiagram'
import DecisionTable from './DecisionTable'
import { downloadSvgAsImage, downloadAsJson, downloadRaciAsCsv, downloadDecisionsAsCsv, downloadTableAsImage, downloadSingleAnalysisExcel } from '../utils/downloadUtils'
import PermissionGuard from './PermissionGuard'
import ExcelDropdownButton from './ExcelDropdownButton'

export function MultiFileAnalysis({ analyses, fileNames, chapterNames }) {
  const [activeFileIndex, setActiveFileIndex] = useState(0)
  const [selectedTab, setSelectedTab] = useState('swimlane')
  const [copiedJson, setCopiedJson] = useState(false)

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

  const handleDownload = async () => {
    const currentDate = new Date().toISOString().slice(0, 10)
    
    switch(selectedTab) {
      case 'swimlane':
        const swimlaneSvg = document.querySelector('.swimlane-viz svg')
        if (swimlaneSvg) {
          await downloadSvgAsImage(swimlaneSvg, `swimlane_${currentDate}.png`)
        }
        break
      case 'raci':
        const raciTable = document.querySelector('.raci-viz')
        if (raciTable) {
          await downloadTableAsImage(raciTable, `raci_${currentDate}.png`)
        }
        break
      case 'decisions':
        const decisionTable = document.querySelector('.decisions-viz')
        if (decisionTable) {
          await downloadTableAsImage(decisionTable, `decisions_${currentDate}.png`)
        }
        break
      default:
        break
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
        downloadAsJson(currentAnalysis.decisions, `decisions_${currentDate}.json`)
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
        downloadDecisionsAsCsv(currentAnalysis.decisions, `decisions_${currentDate}.csv`)
        break
      default:
        break
    }
  }

  const handleDownloadExcel = (type) => {
    downloadSingleAnalysisExcel(currentAnalysis, type)
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
            <DecisionTable 
              data={
                typeof currentAnalysis.decisions === 'string'
                  ? JSON.parse(currentAnalysis.decisions)
                  : currentAnalysis.decisions
              }
            />
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

      {/* 중앙: 선택된 탭의 시각화 */}
      <div className="analysis-content">
        <div className="viz-header">
          <h3>
            {selectedTab === 'swimlane' && '🏊 Swim Lane 다이어그램'}
            {selectedTab === 'raci' && '👥 RACI 매트릭스'}
            {selectedTab === 'decisions' && '⚡ 의사결정 포인트'}
          </h3>
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
            <ExcelDropdownButton onSelect={handleDownloadExcel} />
            <button 
              className={`btn-copy-json ${copiedJson ? 'copied' : ''}`}
              onClick={() => copyToClipboard(
                selectedTab === 'swimlane' ? currentAnalysis.swim_lanes :
                selectedTab === 'raci' ? currentAnalysis.raci :
                currentAnalysis.decisions
              )}
              title="JSON을 클립보드에 복사"
            >
              {copiedJson ? '✓ 복사됨' : '📋 복사'}
            </button>
          </div>
        </div>

        <div className="viz-content">
          {renderContent()}
        </div>
      </div>

      {/* 하단: 탭 선택 카드 (중복 제거 - 1번만 표시) */}
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
