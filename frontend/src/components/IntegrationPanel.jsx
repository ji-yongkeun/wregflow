import { useState } from 'react'

export function IntegrationPanel({ analysisIds, analyses, onClose, onComplete }) {
  const [integrationName, setIntegrationName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryMain, setCategoryMain] = useState(analyses.length > 0 ? (analyses[0].category_main || '은행') : '은행')
  const [categoryMid, setCategoryMid] = useState(analyses.length > 0 ? (analyses[0].category_mid || '') : '')
  const [categorySub, setCategorySub] = useState(analyses.length > 0 ? (analyses[0].category_sub || '') : '')
  const [isIntegrating, setIsIntegrating] = useState(false)
  const [integrationResult, setIntegrationResult] = useState(null)
  const [error, setError] = useState(null)

  const handleIntegrate = async () => {
    if (!integrationName.trim()) {
      alert('통합 분석 이름을 입력해주세요')
      return
    }

    setIsIntegrating(true)
    setError(null)

    try {
      const response = await fetch(
        `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:8001").replace(/\/api\/?$/, "")}/api/integration/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            integrated_name: integrationName,
            description: description,
            category_main: categoryMain,
            category_mid: categoryMid,
            category_sub: categorySub,
            selected_analysis_ids: analysisIds,
            analyses: analyses.map(a => ({
              id: a.id,
              file_id: a.file_id,
              edition: a.edition,
              process_name: a.process_name,
              swim_lanes: null,  // 상세 데이터는 Backend에서 조회
              raci: null,
              decisions: null
            }))
          })
        }
      )

      if (!response.ok) {
        throw new Error('통합 분석 실패')
      }

      const data = await response.json()

      if (data.status === 'success') {
        setIntegrationResult(data.integration)
        // 1초 후 완료 콜백 실행
        setTimeout(() => {
          onComplete()
        }, 1000)
      }
    } catch (error) {
      console.error('통합 분석 오류:', error)
      setError(error.message || '통합 분석 중 오류가 발생했습니다')
    } finally {
      setIsIntegrating(false)
    }
  }

  return (
    <div className="integration-panel-overlay">
      <div className="integration-panel">
        <div className="panel-header">
          <h3>🔗 통합 분석</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {integrationResult ? (
          // 완료 화면
          <div className="integration-success">
            <div className="success-icon">✅</div>
            <h4>통합 분석 완료!</h4>
            <p>{integrationName}</p>
            <p className="analysis-count">
              {analyses.length}개 편 통합
            </p>
            <div className="success-details">
              <div className="detail-item">
                <span>생성일시</span>
                <span>{new Date(integrationResult.created_at).toLocaleString('ko-KR')}</span>
              </div>
              <div className="detail-item">
                <span>포함된 편</span>
                <span>
                  {analyses.map(a => `${a.edition}편`).join(', ')}
                </span>
              </div>
            </div>
            <button
              className="btn-close-success"
              onClick={onComplete}
            >
              확인
            </button>
          </div>
        ) : (
          // 입력 화면
          <div className="integration-content">
            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            <div className="selected-analyses">
              <h4>선택된 분석</h4>
              <div className="analyses-list">
                {analyses.map((analysis, idx) => (
                  <div key={analysis.id} className="analysis-item">
                    <span className="item-num">{idx + 1}</span>
                    <div className="item-info">
                      <div className="edition-badge">{analysis.edition}편</div>
                      <div className="process-name">{analysis.process_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>통합 분석 이름 *</label>
              <input
                type="text"
                value={integrationName}
                onChange={(e) => setIntegrationName(e.target.value)}
                placeholder="예: 여신 신청~실행 통합프로세스"
                disabled={isIntegrating}
              />
            </div>

            <div className="form-group">
              <label>대분류 (대상기관) *</label>
              <select
                value={categoryMain}
                onChange={(e) => setCategoryMain(e.target.value)}
                disabled={isIntegrating}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="은행">은행</option>
                <option value="저축은행">저축은행</option>
                <option value="보험">보험</option>
                <option value="증권">증권</option>
                <option value="공금융">공금융</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div className="form-group">
              <label>중분류 (기관명 등)</label>
              <input
                type="text"
                value={categoryMid}
                onChange={(e) => setCategoryMid(e.target.value)}
                disabled={isIntegrating}
                placeholder="예: 신한은행, 하나은행"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            <div className="form-group">
              <label>소분류 (업무 등)</label>
              <input
                type="text"
                value={categorySub}
                onChange={(e) => setCategorySub(e.target.value)}
                disabled={isIntegrating}
                placeholder="예: 여신, 수신, 투자"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            <div className="form-group">
              <label>설명 (선택사항)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이 통합 분석의 목적이나 설명을 입력해주세요"
                disabled={isIntegrating}
                rows={3}
              />
            </div>

            <div className="panel-actions">
              <button
                className="btn-cancel"
                onClick={onClose}
                disabled={isIntegrating}
              >
                취소
              </button>
              <button
                className="btn-integrate-now"
                onClick={handleIntegrate}
                disabled={isIntegrating || !integrationName.trim()}
              >
                {isIntegrating ? '통합 분석 중...' : `통합 분석 시작 (${analyses.length}개)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default IntegrationPanel
