import { useState } from 'react'
import SwimlaneDiagram from './SwimlaneDiagram'
import DownloadButtons from './DownloadButtons'
import PermissionGuard from './PermissionGuard'

export function MultiFileAnalysis({ analyses, fileNames }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [mermaidCode, setMermaidCode] = useState('')

  if (!analyses || analyses.length === 0) {
    return null
  }

  const currentAnalysis = analyses[activeIndex]
  const currentFileName = fileNames[activeIndex]

  return (
    <div className="multi-file-analysis">
      {/* 탭 네비게이션 */}
      <div className="analysis-tabs">
        {fileNames.map((fileName, idx) => (
          <button
            key={idx}
            className={`tab ${activeIndex === idx ? 'active' : ''}`}
            onClick={() => setActiveIndex(idx)}
            title={fileName}
          >
            {idx + 1}편
          </button>
        ))}
      </div>

      {/* 현재 선택된 파일의 분석 결과 */}
      {currentAnalysis && (
        <>
          <section className="analysis-section">
            <div className="process-info">
              <h3>{currentFileName}</h3>
              <h2>{currentAnalysis.process_name}</h2>
              <p>{currentAnalysis.description}</p>
            </div>

            {/* Swim Lane */}
            <div className="swimlane-diagram-section">
              <h3>📊 Swim Lane 다이어그램</h3>
              <SwimlaneDiagram 
                analysis={currentAnalysis}
                onCodeGenerated={setMermaidCode}
              />
            </div>

            {/* RACI */}
            <div className="raci-section">
              <h3>👥 RACI 매트릭스</h3>
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
                  {currentAnalysis.raci && currentAnalysis.raci.map((item, idx) => (
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
            </div>

            {/* 의사결정 */}
            <div className="decisions-section">
              <h3>🔀 의사결정 포인트</h3>
              {currentAnalysis.decisions && currentAnalysis.decisions.map((decision, idx) => (
                <div key={idx} className="decision-box">
                  <p className="question">Q: {decision.question}</p>
                  <div className="outcomes">
                    <div className="yes">✓ Yes: {decision.yes_outcome}</div>
                    <div className="no">✗ No: {decision.no_outcome}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 다운로드 */}
            <PermissionGuard permission="download">
              <DownloadButtons 
                analysis={currentAnalysis}
                mermaidCode={mermaidCode}
              />
            </PermissionGuard>
          </section>
        </>
      )}

      {/* 분석 개수 정보 */}
      <div className="analysis-info">
        <p>총 {fileNames.length}개 파일 분석 완료 ({activeIndex + 1}/{fileNames.length})</p>
      </div>
    </div>
  )
}

export default MultiFileAnalysis
