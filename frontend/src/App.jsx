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
import MultiFileAnalysis from './components/MultiFileAnalysis'
import SavedAnalysisList from './components/SavedAnalysisList'
import FileGroupEditor from './components/FileGroupEditor'
import IntegrationPanel from './components/IntegrationPanel'
import IntegrationResultView from './components/IntegrationResultView'

function AppContent() {
  const [showSavedAnalyses, setShowSavedAnalyses] = useState(false)
  const [file, setFile] = useState(null)
  const [fileGroups, setFileGroups] = useState([])
  const [multipleAnalyses, setMultipleAnalyses] = useState([])
  const [multipleFileNames, setMultipleFileNames] = useState([])
  const [multipleChapterNames, setMultipleChapterNames] = useState([])
  const [isMultipleMode, setIsMultipleMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [mermaidCode, setMermaidCode] = useState('')
  const [fileName, setFileName] = useState(null)

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      
      // 파일 개수 제한 (최대 20개)
      if (selectedFiles.length > 20) {
        alert('최대 20개 파일까지만 선택 가능합니다')
        return
      }
      
      // 총 크기 제한 (최대 500MB)
      const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0)
      if (totalSize > 500 * 1024 * 1024) {
        alert('전체 파일 크기가 500MB를 초과합니다')
        return
      }
      
      // fileGroups 생성 (edition, editionName은 기본값)
      const groups = selectedFiles.map((file, idx) => ({
        file: file,
        fileName: file.name,
        edition: idx + 1,  // 기본값: 1, 2, 3, ...
        editionName: `${idx + 1}편`,  // 기본값: 1편, 2편, ...
        chapterName: file.name  // 기본값: 파일명
      }))
      
      setFileGroups(groups)
      setIsMultipleMode(selectedFiles.length > 1)
    }
  }

  const updateFileGroup = (index, edition, editionName, chapterName) => {
    const updated = [...fileGroups]
    updated[index].edition = edition
    updated[index].editionName = editionName
    updated[index].chapterName = chapterName
    setFileGroups(updated)
  }

  const removeFileGroup = (index) => {
    setFileGroups(fileGroups.filter((_, i) => i !== index))
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
    setMultipleAnalyses([])
    setMultipleFileNames([])
    setMultipleChapterNames([])
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

  const handleUploadMultiple = async () => {
    if (fileGroups.length === 0) {
      alert("파일을 선택해주세요.")
      return
    }

    setLoading(true)
    setResult(null)
    setAnalysis(null)
    setMultipleAnalyses([])
    setMultipleFileNames([])
    setMultipleChapterNames([])
    
    try {
      const results = []
      const analyses = []
      const fileNames = []
      const chapterNames = []
      
      // 각 파일 순차 처리
      for (let i = 0; i < fileGroups.length; i++) {
        const group = fileGroups[i]
        const file = group.file
        
        try {
          // Step 1: 파일 업로드
          const formData = new FormData()
          formData.append("file", file)
          formData.append("edition", group.edition.toString())
          formData.append("edition_name", group.editionName)
          
          const uploadResponse = await axiosInstance.post(
            "/api/regulations/upload",
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          )
          
          const uploadData = uploadResponse.data
          
          // Step 2: 파일 분석
          if (uploadData.filename) {
            const analyzeResponse = await axiosInstance.post(
              `/api/regulations/analyze?file_id=${encodeURIComponent(uploadData.filename)}&edition=${group.edition}&edition_name=${encodeURIComponent(group.editionName)}`
            )
            
            const analyzeData = analyzeResponse.data
            
            if (analyzeData.status === "success") {
              analyses.push(analyzeData.analysis)
              fileNames.push(group.editionName)  // 상단 탭에 표시할 '편' 이름
              chapterNames.push(group.chapterName) // 파일/장 이름
              
              results.push({
                file_name: file.name,
                edition: group.edition,
                edition_name: group.editionName,
                file_id: uploadData.filename,
                file_size: (file.size / 1024).toFixed(2) + " KB",
                status: "success",
                process_name: analyzeData.analysis.process_name
              })
            }
          }
        } catch (error) {
          console.error(`${file.name} 처리 실패:`, error)
          results.push({
            file_name: file.name,
            edition: group.edition,
            edition_name: group.editionName,
            status: "error",
            error: error.response?.data?.detail || error.message
          })
        }
      }
      
      // Step 3: 결과 저장
      setMultipleAnalyses(analyses)
      setMultipleFileNames(fileNames)
      setMultipleChapterNames(chapterNames)
      
      setResult({
        status: "complete",
        total_files: fileGroups.length,
        processed: analyses.length,
        failed: fileGroups.length - analyses.length,
        results: results
      })
      
    } catch (error) {
      console.error("전체 처리 실패:", error)
      alert("파일 처리 중 오류가 발생했습니다")
    } finally {
      setLoading(false)
      setFileGroups([])  // 업로드 후 파일 목록 초기화
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

        <section className="view-toggle">
          <button
            className={`toggle-btn ${!showSavedAnalyses ? 'active' : ''}`}
            onClick={() => setShowSavedAnalyses(false)}
          >
            새 분석
          </button>
          <button
            className={`toggle-btn ${showSavedAnalyses ? 'active' : ''}`}
            onClick={() => setShowSavedAnalyses(true)}
          >
            저장된 분석
          </button>
        </section>

        {showSavedAnalyses ? (
          <SavedAnalysisList />
        ) : (
          <>

        <PermissionGuard permission="upload">
          <section className="upload-section">
            <h2>규정 파일 업로드</h2>
            <div className="upload-box">
              <input 
                type="file" 
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
                multiple
                id="file-input"
              />
            </div>

            {fileGroups.length > 0 && (
              <FileGroupEditor
                fileGroups={fileGroups}
                onUpdateFileGroup={updateFileGroup}
                onRemoveFileGroup={removeFileGroup}
                onAnalyze={handleUploadMultiple}
                isLoading={loading}
                analysisProgress={multipleAnalyses.length}
              />
            )}
          </section>
        </PermissionGuard>

        {result && (
          <section className="result-section">
            <h3>📊 처리 결과</h3>
            <div className="result-summary">
              <p>✅ {result.total_files !== undefined 
                ? `총 ${result.total_files}개 파일 중 ${result.processed}개 분석 완료` 
                : `업로드 완료: ${result.filename || result.message}`}
              </p>
              {result.failed > 0 && <p>❌ {result.failed}개 실패</p>}
            </div>
            {result.results && result.results.length > 0 && (
              <div className="result-details">
                <h4>파일별 결과</h4>
                {result.results.map((res, idx) => (
                  <div key={idx} className="result-item">
                    <div className="result-name">
                      <strong>{res.file_name}</strong>
                      <span className="result-size">{res.file_size}</span>
                    </div>
                    {res.status === "success" ? (
                      <div className="result-success">
                        <span>✅ 분석 완료</span>
                        <span className="process-name">{res.process_name}</span>
                      </div>
                    ) : (
                      <span className="result-error">❌ {res.error}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 다중 파일 분석 결과 */}
        {multipleAnalyses.length > 0 ? (
          <MultiFileAnalysis 
            analyses={multipleAnalyses} 
            fileNames={multipleFileNames}
            chapterNames={multipleChapterNames}
          />
        ) : analysis ? (
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
        ) : null}
        
        {!multipleAnalyses.length && !analysis && (
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
        )}
          </>
        )}
      </main>
      
      <footer>
        <p>© 2026 Withinfo. All rights reserved.</p>
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
