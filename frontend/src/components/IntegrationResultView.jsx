import { useState } from 'react'
import IntegrationDiagrams from './IntegrationDiagrams'

export function IntegrationResultView({ result, onClose }) {
  if (!result) {
    return null
  }

  return (
    <div className="integration-result-container">
      {/* 모달 배경 제거 - 일반 컨테이너로 변경 */}
      <div className="integration-result-panel">
        <div className="result-header">
          <div className="result-title">
            <h2>🎯 통합 분석 결과</h2>
            <p>{result.group_name}</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* JSON 결과 - 축소 형식 */}
        <div className="result-content-compact">
          <div className="compact-sections">
            {/* 주요 섹션만 요약으로 표시 */}
            {result.integrated_data?.integrated_process && (
              <div className="compact-item">
                <strong>📊 통합 프로세스:</strong> {result.integrated_data.integrated_process.steps?.length || 0}개 단계
              </div>
            )}
            {result.integrated_data?.department_interactions && (
              <div className="compact-item">
                <strong>🔗 부서 간 연계:</strong> {result.integrated_data.department_interactions.length}개 흐름
              </div>
            )}
            {result.integrated_data?.critical_decision_points && (
              <div className="compact-item">
                <strong>⚡ 의사결정 포인트:</strong> {result.integrated_data.critical_decision_points.length}개
              </div>
            )}
            {result.integrated_data?.risk_points && (
              <div className="compact-item">
                <strong>⚠️ 리스크:</strong> {result.integrated_data.risk_points.length}개
              </div>
            )}
            {result.integrated_data?.improvement_opportunities && (
              <div className="compact-item">
                <strong>💡 개선기회:</strong> {result.integrated_data.improvement_opportunities.length}개
              </div>
            )}
          </div>
        </div>

        {/* 3개 다이어그램 - 큰 크기로 표시 */}
        <div className="integration-diagrams-wrapper">
          <IntegrationDiagrams data={result.integrated_data} />
        </div>

        {/* 상세 정보 - 접기식 */}
        <div className="detailed-sections">
          <details className="detail-group">
            <summary className="detail-summary">📋 리스크 포인트 상세</summary>
            <div className="detail-content">
              {result.integrated_data?.risk_points ? (
                result.integrated_data.risk_points.map((risk, idx) => (
                  <div key={idx} className="detail-item">
                    <strong>{risk.point_name}</strong> ({risk.severity})
                    <p>{risk.mitigation}</p>
                  </div>
                ))
              ) : (
                <p>데이터 없음</p>
              )}
            </div>
          </details>

          <details className="detail-group">
            <summary className="detail-summary">💡 개선 기회 상세</summary>
            <div className="detail-content">
              {result.integrated_data?.improvement_opportunities ? (
                result.integrated_data.improvement_opportunities.map((impr, idx) => (
                  <div key={idx} className="detail-item">
                    <strong>{impr.area}</strong> ({impr.priority})
                    <p>{impr.impact}</p>
                  </div>
                ))
              ) : (
                <p>데이터 없음</p>
              )}
            </div>
          </details>
        </div>

        {/* 푸터 */}
        <div className="result-footer">
          <span className="result-date">
            생성: {new Date(result.created_at).toLocaleString('ko-KR')}
          </span>
          <button className="btn-close" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  )
}

export default IntegrationResultView
