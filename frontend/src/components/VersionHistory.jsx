import { useState, useEffect } from 'react'

export function VersionHistory({ fileId }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState([])
  const [comparison, setComparison] = useState(null)

  useEffect(() => {
    if (fileId) {
      fetchVersions()
    }
  }, [fileId])

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'
      const response = await fetch(`${BASE}/api/versions/file/${encodeURIComponent(fileId)}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        setVersions(data.versions)
      }
    } catch (error) {
      console.error('버전 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectVersion = (versionId) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(v => v !== versionId)
      } else if (prev.length < 2) {
        return [...prev, versionId]
      }
      return prev
    })
  }

  const handleCompare = async () => {
    if (selectedVersions.length !== 2) {
      alert('2개의 버전을 선택해주세요')
      return
    }

    try {
      const response = await fetch(
        `${BASE}/api/versions/compare?version_id1=${selectedVersions[0]}&version_id2=${selectedVersions[1]}`,
        { method: 'POST' }
      )
      const data = await response.json()
      
      if (data.status === 'success') {
        setComparison(data.comparison)
      }
    } catch (error) {
      console.error('비교 실패:', error)
      alert('버전 비교에 실패했습니다')
    }
  }

  return (
    <div className="version-history-container">
      <h3>📊 버전 관리</h3>
      
      {loading ? (
        <p>로딩 중...</p>
      ) : versions.length === 0 ? (
        <p>버전 기록이 없습니다</p>
      ) : (
        <>
          <div className="version-list">
            <h4>버전 목록 ({versions.length}개)</h4>
            {versions.map(version => (
              <div 
                key={version.id}
                className={`version-item ${selectedVersions.includes(version.id) ? 'selected' : ''}`}
                onClick={() => handleSelectVersion(version.id)}
              >
                <div className="version-info">
                  <strong>v{version.version}</strong>
                  <span className="version-date">{new Date(version.created_at).toLocaleString('ko-KR')}</span>
                </div>
                <span className="process-name">{version.process_name}</span>
                {selectedVersions.includes(version.id) && <span className="checkmark">✓</span>}
              </div>
            ))}
          </div>

          {selectedVersions.length === 2 && (
            <button onClick={handleCompare} className="btn-compare">
              🔄 선택한 버전 비교
            </button>
          )}

          {comparison && (
            <div className="comparison-result">
              <h4>비교 결과</h4>
              <div className="comparison-items">
                <div className="comparison-item">
                  <strong>Swim Lane</strong>
                  <span className="comparison-value">
                    v{comparison.version1}: {comparison.changes.swim_lanes_v1}개
                    {' → '}
                    v{comparison.version2}: {comparison.changes.swim_lanes_v2}개
                    {comparison.changes.swim_lanes_changed && <span className="badge-changed">변경됨</span>}
                  </span>
                </div>
                <div className="comparison-item">
                  <strong>RACI 항목</strong>
                  <span className="comparison-value">
                    v{comparison.version1}: {comparison.changes.raci_v1}개
                    {' → '}
                    v{comparison.version2}: {comparison.changes.raci_v2}개
                    {comparison.changes.raci_changed && <span className="badge-changed">변경됨</span>}
                  </span>
                </div>
                <div className="comparison-item">
                  <strong>의사결정 포인트</strong>
                  <span className="comparison-value">
                    v{comparison.version1}: {comparison.changes.decisions_v1}개
                    {' → '}
                    v{comparison.version2}: {comparison.changes.decisions_v2}개
                    {comparison.changes.decisions_changed && <span className="badge-changed">변경됨</span>}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default VersionHistory
