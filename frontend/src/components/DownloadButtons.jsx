import {
  downloadJSON,
  downloadRACIasCSV,
  downloadMermaidCode,
  downloadReport
} from '../utils/downloadUtils'

export function DownloadButtons({ analysis, mermaidCode }) {
  const handleDownloadJSON = () => {
    downloadJSON(analysis, `analysis_${Date.now()}.json`)
  }

  const handleDownloadCSV = () => {
    downloadRACIasCSV(analysis, `raci_matrix_${Date.now()}.csv`)
  }

  const handleDownloadMermaid = () => {
    if (!mermaidCode) {
      alert('Mermaid 코드가 없습니다')
      return
    }
    downloadMermaidCode(mermaidCode, `swimlane_${Date.now()}.mmd`)
  }

  const handleDownloadReport = () => {
    downloadReport(analysis, `analysis_report_${Date.now()}.txt`)
  }

  return (
    <div className="download-buttons-group">
      <h4>📥 분석 결과 다운로드</h4>
      <div className="button-group">
        <button
          onClick={handleDownloadJSON}
          className="btn-download"
          title="JSON 형식으로 분석 데이터 다운로드"
        >
          📄 JSON
        </button>
        <button
          onClick={handleDownloadCSV}
          className="btn-download"
          title="CSV 형식으로 RACI 매트릭스 다운로드"
        >
          📊 CSV (RACI)
        </button>
        <button
          onClick={handleDownloadMermaid}
          className="btn-download"
          title="Mermaid 코드 다운로드"
        >
          🔲 Mermaid
        </button>
        <button
          onClick={handleDownloadReport}
          className="btn-download"
          title="텍스트 형식의 분석 보고서 다운로드"
        >
          📝 보고서
        </button>
      </div>
    </div>
  )
}

export default DownloadButtons