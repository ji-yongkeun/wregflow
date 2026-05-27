import { useState } from 'react'

export function FileGroupEditor({ fileGroups, onUpdateFileGroup, onRemoveFileGroup, onAnalyze, isLoading, analysisProgress }) {
  const [expandedIndex, setExpandedIndex] = useState(null)

  return (
    <div className="file-group-editor">
      <h3>📄 파일 목록 ({fileGroups.length}개)</h3>
      
      <div className="file-groups-list">
        {fileGroups.map((group, idx) => (
          <div key={idx} className="file-group-card">
            <div
              className="file-group-header"
              onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
            >
              <div className="file-info">
                <span className="file-index">{idx + 1}</span>
                <div className="file-details">
                  <strong>{group.fileName}</strong>
                  <span className="file-size">
                    {(group.file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <div className="file-edition-preview">
                <span className="preview-badge">
                  {group.edition}번
                </span>
                <span className="preview-name">
                  {group.editionName || '(이름 미입력)'}
                </span>
                <span className="expand-icon">
                  {expandedIndex === idx ? '▼' : '▶'}
                </span>
              </div>
            </div>

            {expandedIndex === idx && (
              <div className="file-group-body">
                <div className="input-section">
                  <div className="form-group">
                    <label>편 번호 *</label>
                    <input
                      type="number"
                      min="1"
                      value={group.edition}
                      onChange={(e) => onUpdateFileGroup(
                        idx,
                        parseInt(e.target.value) || 1,
                        group.editionName
                      )}
                      placeholder="예: 1, 2, 3"
                    />
                  </div>

                  <div className="form-group">
                    <label>편 이름 *</label>
                    <input
                      type="text"
                      value={group.editionName}
                      onChange={(e) => onUpdateFileGroup(
                        idx,
                        group.edition,
                        e.target.value
                      )}
                      placeholder="예: 신청절차, 심사기준, 실행방법"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    className="btn-remove"
                    onClick={() => onRemoveFileGroup(idx)}
                  >
                    🗑️ 이 파일 제거
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="editor-actions">
        <button
          className="btn-analyze"
          onClick={onAnalyze}
          disabled={isLoading || fileGroups.length === 0}
        >
          {isLoading 
            ? `분석 중... (${analysisProgress}/${fileGroups.length})` 
            : `규정 분석 시작 (${fileGroups.length}개 파일)`
          }
        </button>
      </div>
    </div>
  )
}

export default FileGroupEditor
