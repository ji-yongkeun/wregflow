import { useState, useEffect } from 'react'
import IntegrationPanel from './IntegrationPanel'
import IntegrationResultView from './IntegrationResultView'
import AnalysisDetailView from './AnalysisDetailView'

const BASE = (() => {
  let url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
  if (url.endsWith('/api')) url = url.slice(0, -4);
  if (url.endsWith('/api/')) url = url.slice(0, -5);
  return url;
})();

export function SavedAnalysisList() {
  const [analyses, setAnalyses] = useState([])
  const [filteredAnalyses, setFilteredAnalyses] = useState([])
  const [selectedEdition, setSelectedEdition] = useState(null)
  const [categoryMainFilter, setCategoryMainFilter] = useState(null)
  const [categoryMidFilter, setCategoryMidFilter] = useState(null)
  const [categorySubFilter, setCategorySubFilter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [selectedAnalysisIds, setSelectedAnalysisIds] = useState(new Set())
  const [showIntegrationUI, setShowIntegrationUI] = useState(false)

  // 통합 분석 관련 state 추가
  const [integrations, setIntegrations] = useState([])
  const [filteredIntegrations, setFilteredIntegrations] = useState([])
  const [showIntegrations, setShowIntegrations] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState(null)
  const [selectedAnalysisDetail, setSelectedAnalysisDetail] = useState(null)

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
    let filtered = analyses
    if (selectedEdition) {
      filtered = filtered.filter(a => a.edition === selectedEdition)
    }
    if (categoryMainFilter) {
      filtered = filtered.filter(a => a.category_main === categoryMainFilter)
    }
    if (categoryMidFilter) {
      filtered = filtered.filter(a => a.category_mid === categoryMidFilter)
    }
    if (categorySubFilter) {
      filtered = filtered.filter(a => a.category_sub === categorySubFilter)
    }
    setFilteredAnalyses(filtered)
    
    // 필터 변경 시 선택 해제 처리
    setSelectedAnalysisIds(new Set())
  }, [analyses, selectedEdition, categoryMainFilter, categoryMidFilter, categorySubFilter])

  useEffect(() => {
    let filtered = integrations
    if (categoryMainFilter) {
      filtered = filtered.filter(i => i.category_main === categoryMainFilter)
    }
    if (categoryMidFilter) {
      filtered = filtered.filter(i => i.category_mid === categoryMidFilter)
    }
    if (categorySubFilter) {
      filtered = filtered.filter(i => i.category_sub === categorySubFilter)
    }
    setFilteredIntegrations(filtered)
  }, [integrations, categoryMainFilter, categoryMidFilter, categorySubFilter])

  const handleMainFilterChange = (e) => {
    setCategoryMainFilter(e.target.value || null)
    setCategoryMidFilter(null)
    setCategorySubFilter(null)
  }

  const handleMidFilterChange = (e) => {
    setCategoryMidFilter(e.target.value || null)
    setCategorySubFilter(null)
  }

  const fetchAnalyses = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${BASE}/api/regulations/analysis/list`)
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
      const response = await fetch(`${BASE}/api/integration/list`)
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
        `${BASE}/api/analysis/delete/${id}`,
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

  // 분석 상세 데이터 로드 함수 (NEW)
  const loadAnalysisDetail = async (analysisId) => {
    try {
      const response = await fetch(
        `${BASE}/api/analysis/detail/${analysisId}`
      )
      const data = await response.json()
      
      if (data.status === 'success' && data.analysis) {
        setSelectedAnalysisDetail(data.analysis)
      } else {
        alert('분석 데이터를 불러올 수 없습니다')
      }
    } catch (error) {
      console.error('분석 데이터 로드 실패:', error)
      alert('분석 데이터 로드에 실패했습니다')
    }
  }

  const handleDeleteIntegration = async (id) => {
    if (!window.confirm('이 통합 분석을 삭제하시겠습니까?')) return
    try {
      const response = await fetch(
        `${BASE}/api/integration/delete/${id}`,
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

  const uniqueCategoryMids = [...new Set([...analyses, ...integrations].map(a => a.category_mid).filter(Boolean))].sort()
  const uniqueCategorySubs = [...new Set([...analyses, ...integrations].map(a => a.category_sub).filter(Boolean))].sort()

  const handleViewIntegrationDetail = async (id) => {
    try {
      const response = await fetch(`${BASE}/api/integration/detail/${id}`)
      const data = await response.json()
      if (response.ok && data.status === 'success') {
        setSelectedIntegration(data.integration)
      } else {
        const errorMsg = data.detail || data.message || '상세 데이터가 없습니다.'
        alert(`상세 정보를 가져오는데 실패했습니다: ${errorMsg}`)
      }
    } catch (error) {
      console.error('통합 분석 상세 조회 실패:', error)
      alert(`상세 정보를 가져오는데 실패했습니다.\n오류: ${error.message}`)
    }
  }

  const getOriginalFileName = (fileId) => {
    if (!fileId) return '';
    const parts = fileId.split('_');
    // 형식: edition_editionName_originalFilename
    if (parts.length >= 3 && !isNaN(parseInt(parts[0]))) {
      return parts.slice(2).join('_');
    }
    return fileId;
  };

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

      {/* 3단 분류 필터 */}
      <div className="institution-filter" style={{ marginBottom: '15px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ marginRight: '5px' }}>대분류: </label>
          <select 
            value={categoryMainFilter || ''} 
            onChange={handleMainFilterChange}
            style={{ padding: '5px', borderRadius: '4px' }}
          >
            <option value="">전체</option>
            <option value="은행">은행</option>
            <option value="저축은행">저축은행</option>
            <option value="보험">보험</option>
            <option value="증권">증권</option>
            <option value="공금융">공금융</option>
            <option value="기타">기타</option>
          </select>
        </div>
        <div>
          <label style={{ marginRight: '5px' }}>중분류: </label>
          <select 
            value={categoryMidFilter || ''} 
            onChange={handleMidFilterChange}
            style={{ padding: '5px', borderRadius: '4px' }}
          >
            <option value="">전체</option>
            {uniqueCategoryMids.map(mid => (
              <option key={mid} value={mid}>{mid}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ marginRight: '5px' }}>소분류: </label>
          <select 
            value={categorySubFilter || ''} 
            onChange={(e) => setCategorySubFilter(e.target.value || null)}
            style={{ padding: '5px', borderRadius: '4px' }}
          >
            <option value="">전체</option>
            {uniqueCategorySubs.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      {showIntegrations ? (
        /* 통합 분석 탭 */
        <div className="integrations-list">
          {filteredIntegrations.length === 0 ? (
            <p className="no-data">저장된 통합 분석이 없습니다</p>
          ) : (
            filteredIntegrations.map(integration => (
              <div key={integration.id} className="integration-card">
                <div className="integration-header">
                  <div className="integration-info">
                    <h4>🔗 {integration.group_name}</h4>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {integration.category_main && <span className="institution-badge" style={{ fontSize: '0.8em', background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px' }}>{integration.category_main}</span>}
                      {integration.category_mid && <span className="institution-badge" style={{ fontSize: '0.8em', background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px' }}>{integration.category_mid}</span>}
                      {integration.category_sub && <span className="institution-badge" style={{ fontSize: '0.8em', background: '#f3e8ff', color: '#6b21a8', padding: '2px 6px', borderRadius: '4px' }}>{integration.category_sub}</span>}
                    </div>
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
                      📋 상세보기
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteIntegration(integration.id)}
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
                    <div className="analysis-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedAnalysisIds.has(analysis.id)}
                        onChange={() => toggleAnalysisSelection(analysis.id)}
                      />
                    </div>
                    
                    <div className="analysis-info">
                      <h4>{getOriginalFileName(analysis.file_id)}</h4>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', margin: '4px 0' }}>
                        {analysis.category_main && <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8em' }}>{analysis.category_main}</span>}
                        {analysis.category_mid && <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8em' }}>{analysis.category_mid}</span>}
                        {analysis.category_sub && <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8em' }}>{analysis.category_sub}</span>}
                      </div>
                      <p>
                        {analysis.edition ? `${analysis.edition}편` : ''}
                      </p>
                    </div>

                    <div className="analysis-actions">
                      <button
                        className="btn-detail"
                        onClick={() => loadAnalysisDetail(analysis.id)}
                        title="상세 정보 보기"
                      >
                        📋 상세
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(analysis.id)}
                        title="삭제"
                      >
                        🗑️
                      </button>
                    </div>
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

      {selectedAnalysisDetail && (
        <AnalysisDetailView
          analysis={selectedAnalysisDetail}
          onClose={() => setSelectedAnalysisDetail(null)}
        />
      )}
    </div>
  )
}

export default SavedAnalysisList
