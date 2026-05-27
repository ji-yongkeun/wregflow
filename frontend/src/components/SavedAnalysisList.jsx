import { useState, useEffect } from 'react'
import IntegrationPanel from './IntegrationPanel'
import IntegrationResultView from './IntegrationResultView'

export function SavedAnalysisList() {
  const [analyses, setAnalyses] = useState([])
  const [filteredAnalyses, setFilteredAnalyses] = useState([])
  const [selectedEdition, setSelectedEdition] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [selectedAnalysisIds, setSelectedAnalysisIds] = useState(new Set())
  const [showIntegrationUI, setShowIntegrationUI] = useState(false)

  // 통합 분석 관련 state 추가
  const [integrations, setIntegrations] = useState([])
  const [showIntegrations, setShowIntegrations] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState(null)

  useEffect(() => {
    fetchAnalyses()
    fetchIntegrations()
  }, [])

  useEffect(() => {
    if (showIntegrations) {
      fetchIntegrations()
    }
  }, [showIntegrations])

  useEffect(() => {
    if (selectedEdition) {
      const filtered = analyses.filter(a => a.edition === selectedEdition)
      setFilteredAnalyses(filtered)
    } else {
      setFilteredAnalyses(analyses)
    }
    // 필터 변경 시 선택 해제 처리
    setSelectedAnalysisIds(new Set())
  }, [analyses, selectedEdition])

  const fetchAnalyses = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8001/api/analysis/list')
      const data = await response.json()
      if (data.status === 'success') {
        setAnalyses(data.analyses)
      }
    } catch (error) {
      console.error('분석 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('http://localhost:8001/api/integration/list')
      const data = await response.json()
      if (data.status === 'success') {
        setIntegrations(data.integrations)
      }
    } catch (error) {
      console.error('통합 분석 목록 조회 실패:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('이 분석을 삭제하시겠습니까?')) return
    try {
      const response = await fetch(
        `http://localhost:8001/api/analysis/delete/${id}`,
        { method: 'DELETE' }
      )
      const data = await response.json()
      if (data.status === 'success') {
        setAnalyses(prev => prev.filter(a => a.id !== id))
        if (expandedId === id) setExpandedId(null)
        // 삭제된 분석 ID 선택 해제
        const newSet = new Set(selectedAnalysisIds)
        newSet.delete(id)
        setSelectedAnalysisIds(newSet)
      }
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다')
    }
  }

  const handleDeleteIntegration = async (id) => {
    if (!window.confirm('이 통합 분석을 삭제하시겠습니까?')) return
    try {
      const response = await fetch(
        `http://localhost:8001/api/integration/delete/${id}`,
        { method: 'DELETE' }
      )
      const data = await response.json()
      if (data.status === 'success') {
        setIntegrations(integrations.filter(i => i.id !== id))
        alert('삭제되었습니다')
      }
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다')
    }
  }

  const toggleAnalysisSelection = (id) => {
    const newSet = new Set(selectedAnalysisIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedAnalysisIds(newSet)
  }

  const toggleSelectAll = () => {
    if (selectedAnalysisIds.size === filteredAnalyses.length) {
      setSelectedAnalysisIds(new Set())
    } else {
      const allIds = new Set(filteredAnalyses.map(a => a.id))
      setSelectedAnalysisIds(allIds)
    }
  }

  // 동적으로 edition 추출
  const getUniqueEditions = () => {
    if (analyses.length === 0) return []
    const uniqueEditions = [...new Set(analyses.map(a => a.edition))].sort((a, b) => a - b)
    return uniqueEditions
  }

  // 동적 필터 버튼 생성
  const editionButtons = getUniqueEditions().map(edition => ({
    num: edition,
    name: `${edition}편`
  }))

  const handleViewIntegrationDetail = async (id) => {
    try {
      const response = await fetch(`http://localhost:8001/api/integration/detail/${id}`)
      const data = await response.json()
      if (data.status === 'success') {
        setSelectedIntegration(data.integration)
      }
    } catch (error) {
      console.error('통합 분석 상세 조회 실패:', error)
      alert('상세 정보를 가져오는데 실패했습니다')
    }
  }

  return (
    <div className="saved-analysis-container">
      <h2>💾 저장된 분석 결과</h2>

      {/* 탭 */}
      <div className="analysis-tabs">
        <button
          className={`tab ${!showIntegrations ? 'active' : ''}`}
          onClick={() => setShowIntegrations(false)}
        >
          📊 분석 목록
        </button>
        <button
          className={`tab ${showIntegrations ? 'active' : ''}`}
          onClick={() => setShowIntegrations(true)}
        >
          🔗 통합 분석 ({integrations.length})
        </button>
      </div>

      {showIntegrations ? (
        /* 통합 분석 탭 */
        <div className="integrations-list">
          {integrations.length === 0 ? (
            <p className="no-data">저장된 통합 분석이 없습니다</p>
          ) : (
            integrations.map(integration => (
              <div key={integration.id} className="integration-card">
                <div className="integration-header">
                  <div className="integration-info">
                    <h4>🔗 {integration.group_name}</h4>
                    <p>{integration.analysis_count}개 편 통합</p>
                    <p className="created-date">
                      {new Date(integration.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <div className="integration-actions">
                    <button
                      className="btn-view"
                      onClick={() => handleViewIntegrationDetail(integration.id)}
                    >
                      상세보기
                    </button>
                    <button
                      className="btn-download-word"
                      onClick={() => {
                        window.location.href = `http://localhost:8001/api/download/integration/${integration.id}/word`
                      }}
                      title="Word로 다운로드"
                    >
                      📄 Word
                    </button>
                    <button
                      className="btn-download-excel"
                      onClick={() => {
                        window.location.href = `http://localhost:8001/api/download/integration/${integration.id}/excel`
                      }}
                      title="Excel로 다운로드"
                    >
                      📊 Excel
                    </button>
                    <button
                      className="delete-icon-btn"
                      onClick={() => handleDeleteIntegration(integration.id)}
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* 기존 분석 목록 */
        <>
          {/* 동적 필터 버튼 */}
          {editionButtons.length > 0 && (
            <div className="edition-filter">
              <button
                className={`filter-btn ${!selectedEdition ? 'active' : ''}`}
                onClick={() => setSelectedEdition(null)}
              >
                전체
              </button>
              {editionButtons.map(btn => (
                <button
                  key={btn.num}
                  className={`filter-btn ${selectedEdition === btn.num ? 'active' : ''}`}
                  onClick={() => setSelectedEdition(btn.num)}
                >
                  {btn.name}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <p>로딩 중...</p>
          ) : filteredAnalyses.length === 0 ? (
            <p className="no-data">저장된 분석이 없습니다</p>
          ) : (
            <>
              {filteredAnalyses.length > 0 && (
                <div className="selection-controls">
                  <button
                    className="btn-select-all"
                    onClick={toggleSelectAll}
                  >
                    {selectedAnalysisIds.size === filteredAnalyses.length ? '전체 해제' : '전체 선택'}
                  </button>
                  <span className="selection-count">
                    선택: {selectedAnalysisIds.size}개 / {filteredAnalyses.length}개
                  </span>
                  {selectedAnalysisIds.size > 0 && (
                    <button
                      className="btn-integrate"
                      onClick={() => setShowIntegrationUI(true)}
                    >
                      통합 분석 ({selectedAnalysisIds.size}개)
                    </button>
                  )}
                </div>
              )}

              <div className="analysis-list">
                <p className="count">총 {filteredAnalyses.length}개</p>
                {filteredAnalyses.map(analysis => (
                  <div key={analysis.id} className="analysis-card">
                    <div className="card-header">
                      <div className="card-selection">
                        <input
                          type="checkbox"
                          checked={selectedAnalysisIds.has(analysis.id)}
                          onChange={() => toggleAnalysisSelection(analysis.id)}
                          onClick={(e) => e.stopPropagation()} // 헤더 클릭 시 아코디언 토글 방지
                          id={`analysis-${analysis.id}`}
                        />
                      </div>
                      <label 
                        htmlFor={`analysis-${analysis.id}`} 
                        className="card-label"
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      >
                        <div className="card-title">
                          {analysis.edition && (
                            <span className="edition-badge">{analysis.edition}편</span>
                          )}
                          <strong>{analysis.process_name}</strong>
                        </div>
                      </label>
                      <div className="card-header-actions">
                        <button 
                          className="expand-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedId(expandedId === analysis.id ? null : analysis.id)
                          }}
                        >
                          {expandedId === analysis.id ? '▼' : '▶'}
                        </button>
                        <button
                          className="delete-icon-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(analysis.id)
                          }}
                          title="삭제"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {expandedId === analysis.id && (
                      <div className="card-body">
                        <p>{analysis.description || '(설명 없음)'}</p>
                        <div className="card-stats">
                          <span>Swim Lane: {analysis.swim_lanes_count}개</span>
                          <span>RACI: {analysis.raci_count}개</span>
                          <span>의사결정: {analysis.decisions_count}개</span>
                        </div>
                        <p className="card-date">
                          {new Date(analysis.created_at).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {showIntegrationUI && selectedAnalysisIds.size > 0 && (
        <IntegrationPanel
          analysisIds={Array.from(selectedAnalysisIds)}
          analyses={filteredAnalyses.filter(a => selectedAnalysisIds.has(a.id))}
          onClose={() => setShowIntegrationUI(false)}
          onComplete={() => {
            setShowIntegrationUI(false)
            setSelectedAnalysisIds(new Set())
            fetchAnalyses()  // 새로고침
            fetchIntegrations() // 통합 분석 목록 새로고침
          }}
        />
      )}

      {/* 통합 분석 결과 뷰 */}
      {selectedIntegration && (
        <IntegrationResultView
          result={selectedIntegration}
          onClose={() => setSelectedIntegration(null)}
        />
      )}
    </div>
  )
}

export default SavedAnalysisList
