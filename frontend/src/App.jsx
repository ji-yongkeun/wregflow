import { useState } from 'react'
import './App.css'
import SwimlaneDiagram from './components/SwimlaneDiagram'
import DownloadButtons from './components/DownloadButtons'
import ShareButton from './components/ShareButton'
import VersionHistory from './components/VersionHistory'
import { PermissionProvider, usePermission } from './context/PermissionContext'
import LoginPanel from './components/LoginPanel'
import PermissionGuard from './components/PermissionGuard'
import axiosInstance from './utils/axiosInstance'

function AppContent() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [mermaidCode, setMermaidCode] = useState('')
  const [fileName, setFileName] = useState(null)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleAnalyze = async (fileId) => {
    if (!fileId) return
    setLoading(true)
    setAnalysis(null)
    try {
      const response = await axiosInstance.post(`/api/regulations/analyze?file_id=${encodeURIComponent(fileId)}`)
      const data = response.data
      if (data.status === "success") {
        setAnalysis(data.analysis)
      } else {
        alert("분석에 실패했습니다.")
      }
    } catch (error) {
      console.error(error)
      alert("분석 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      alert("파일을 선택해주세요.")
      return
    }
    setLoading(true)
    setResult(null)
    setAnalysis(null)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await axiosInstance.post("/api/regulations/upload", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      const data = response.data
      setResult(data)
      if (data.filename) {
        setFileName(data.filename)
        await handleAnalyze(data.filename)
      }
    } catch (error) {
      console.error(error)
      alert("업로드 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header>
        <div className="header-top">
          <div>
            <h1>🗺️ WRegFlow</h1>
            <p>Regulation Process Mapping Tool</p>
          </div>
          <LoginPanel />
        </div>
      </header>
      
      <main>
        <section className="intro">
          <h2>규정을 흐름으로, 복잡함을 명확함으로</h2>
          <p>규정서를 업로드하면 자동으로 프로세스 맵이 생성됩니다.</p>
        </section>

        <PermissionGuard permission="upload">
          <section className="upload-section">
            <h2>규정 파일 업로드</h2>
            <div className="upload-box">
              <input 
                type="file" 
                onChange={handleFileChange} 
                accept=".pdf,.doc,.docx,.txt"
              />
              <button 
                onClick={handleUpload} 
                disabled={loading}
              >
                {loading ? "분석 중..." : "규정 분석"}
              </button>
            </div>
          </section>
        </PermissionGuard>

        {result && (
          <section className="result-section">
            <h3>업로드 결과</h3>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </section>
        )}

        {analysis && (
          <>
            <section className="analysis-section">
              <div className="process-info">
                <h3>{analysis.process_name}</h3>
                <p>{analysis.description}</p>
              </div>

              {/* Swim Lane 다이어그램 */}
              <div className="swimlane-diagram-section">
                <h3>📊 Swim Lane 다이어그램</h3>
                <SwimlaneDiagram 
                  analysis={analysis} 
                  onCodeGenerated={setMermaidCode}
                />
              </div>

              {/* RACI 매트릭스 */}
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
                    {analysis.raci.map((item, idx) => (
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

              {/* 의사결정 포인트 */}
              <div className="decisions-section">
                <h3>🔀 의사결정 포인트</h3>
                {analysis.decisions.map((decision, idx) => (
                  <div key={idx} className="decision-box">
                    <p className="question">Q: {decision.question}</p>
                    <div className="outcomes">
                      <div className="yes">✓ Yes: {decision.yes_outcome}</div>
                      <div className="no">✗ No: {decision.no_outcome}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 다운로드 버튼 추가 */}
              <PermissionGuard permission="download">
                <DownloadButtons analysis={analysis} mermaidCode={mermaidCode} />
              </PermissionGuard>

              {/* 공유 버튼 */}
              <PermissionGuard permission="share">
                <ShareButton analysis={analysis} />
              </PermissionGuard>

              {/* 버전 관리 */}
              {fileName && <VersionHistory fileId={fileName} />}
            </section>
          </>
        )}
        
        <section className="features">
          <div className="feature-card">
            <h3>📊 Swim Lane</h3>
            <p>부서/역할별 담당 시각화</p>
          </div>
          <div className="feature-card">
            <h3>👥 RACI 매트릭스</h3>
            <p>책임 관계 정의</p>
          </div>
          <div className="feature-card">
            <h3>🔀 의사결정 맵</h3>
            <p>의사결정 분기 자동 추출</p>
          </div>
        </section>
      </main>
      
      <footer>
        <p>© 2024 Withdinfo. All rights reserved.</p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <PermissionProvider>
      <AppContent />
    </PermissionProvider>
  )
}

export default App
