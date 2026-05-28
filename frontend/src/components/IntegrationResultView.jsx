import { useState, useRef } from 'react'
import SwimlaneDiagram from './SwimlaneDiagram'
import DecisionTable from './DecisionTable'
import { downloadSvgAsImage, downloadAsJson, downloadTableAsImage, downloadRaciAsCsv, downloadDecisionsAsCsv, downloadProcessExcel } from '../utils/downloadUtils'
import ExcelDropdownButton from './ExcelDropdownButton'

// RACIMatrix 로컬 컴포넌트 정의
function RACIMatrix({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <p className="no-data">데이터가 없습니다</p>
  }
  return (
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
        {data.map((item, idx) => (
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
  )
}

export function IntegrationResultView({ result, onClose }) {
  const [selectedTab, setSelectedTab] = useState('swimlane')
  const [copiedJson, setCopiedJson] = useState(false)
  
  const swimlaneSvgRef = useRef(null)
  const raciTableRef = useRef(null)
  const decisionTableRef = useRef(null)

  // 일괄 이미지 캡처용 숨겨진 컴포넌트 Ref
  const captureSwimlaneRef = useRef(null)
  const captureRaciRef = useRef(null)
  const captureDecisionRef = useRef(null)

  if (!result) {
    return null
  }

  const sections = [
    {
      id: 'swimlane',
      title: '🏊 Swim Lane',
      icon: '🏊'
    },
    {
      id: 'raci',
      title: '👥 RACI 매트릭스',
      icon: '👥'
    },
    {
      id: 'decisions',
      title: '⚡ 의사결정',
      icon: '⚡'
    }
  ]

  // Swimlane 데이터 변환 함수
  const getSwimlaneData = () => {
    const steps = result.integrated_data?.integrated_process?.steps || []
    const lanesMap = {}
    
    steps.forEach((step, idx) => {
      const dept = step.responsible_department || '기타'
      if (!lanesMap[dept]) {
        lanesMap[dept] = []
      }
      
      const isDecision = (step.step_name || '').includes('여부') || 
                         (step.step_name || '').includes('검토') || 
                         (step.step_name || '').includes('심사') || 
                         (step.step_name || '').includes('결정') ||
                         (step.step_name || '').includes('판단')
      
      lanesMap[dept].push({
        order: step.step_number || (idx + 1),
        action: step.step_name || '',
        decision: isDecision,
        description: step.description || '',
        outputs: step.outputs || [],
        related_editions: step.related_editions || [],
        responsible_department: dept
      })
    })
    
    return Object.keys(lanesMap).map(role => ({
      role: role,
      steps: lanesMap[role].sort((a, b) => a.order - b.order)
    }))
  }

  // RACI 데이터 변환 함수
  const getRaciData = () => {
    const steps = result.integrated_data?.integrated_process?.steps || []
    const interactions = result.integrated_data?.department_interactions || []
    
    return steps.map(step => {
      const task = step.step_name || ''
      const responsible = step.responsible_department || '-'
      const accountable = step.responsible_department || '-'
      
      const consultedDepts = []
      const informedDepts = []
      
      interactions.forEach(inter => {
        if (inter.from_dept === step.responsible_department) {
          informedDepts.push(inter.to_dept)
        } else if (inter.to_dept === step.responsible_department) {
          consultedDepts.push(inter.from_dept)
        }
      })
      
      return {
        task: task,
        responsible: responsible,
        accountable: accountable,
        consulted: [...new Set(consultedDepts)].filter(d => d !== step.responsible_department).join(', ') || '-',
        informed: [...new Set(informedDepts)].filter(d => d !== step.responsible_department).join(', ') || '-'
      }
    })
  }

  // 의사결정 데이터 변환 함수
  const getDecisionsData = () => {
    const points = result.integrated_data?.critical_decision_points || []
    return points.map((p, idx) => ({
      id: p.id || (idx + 1),
      question: p.point_name || '',
      yes_outcome: p.description || '',
      no_outcome: p.impact || ''
    }))
  }

  const copyToClipboard = (data) => {
    try {
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
      navigator.clipboard.writeText(jsonString)
      setCopiedJson(true)
      setTimeout(() => setCopiedJson(false), 2000)
    } catch (err) {
      console.error('클립보드 복사 실패:', err)
      alert('클립보드 복사에 실패했습니다')
    }
  }

  // JSON 저장 시 통합 분석 전체 데이터를 다운로드하도록 변경
  const handleDownloadJson = () => {
    const currentDate = new Date().toISOString().slice(0, 10)
    const data = result.integrated_data
    downloadAsJson(data, `integrated_all_data_${currentDate}.json`)
  }

  const handleDownloadCsv = () => {
    const currentDate = new Date().toISOString().slice(0, 10)
    
    if (selectedTab === 'raci') {
      downloadRaciAsCsv(getRaciData(), `integrated_raci_${currentDate}.csv`)
    } else if (selectedTab === 'decisions') {
      downloadDecisionsAsCsv(getDecisionsData(), `integrated_decisions_${currentDate}.csv`)
    }
  }

  const handleDownloadProcessExcel = async (type) => {
    try {
      const steps = result.integrated_data?.integrated_process?.steps || [];
      const lanesMap = {};
      steps.forEach((step, idx) => {
        const dept = step.responsible_department || '기타';
        if (!lanesMap[dept]) {
          lanesMap[dept] = [];
        }
        
        const isDecision = (step.step_name || '').includes('여부') || 
                           (step.step_name || '').includes('검토') || 
                           (step.step_name || '').includes('심사') || 
                           (step.step_name || '').includes('결정') ||
                           (step.step_name || '').includes('판단');
        
        lanesMap[dept].push({
          order: step.step_number || (idx + 1),
          action: step.step_name || '',
          decision: isDecision,
          description: step.description || '',
          outputs: step.outputs || [],
          related_editions: step.related_editions || []
        });
      });
      
      const swimLanes = Object.keys(lanesMap).map(role => ({
        role: role,
        steps: lanesMap[role].sort((a, b) => a.order - b.order)
      }));

      const raciData = getRaciData();
      const decisionsData = getDecisionsData();

      const payload = {
        process_name: result.group_name || '통합 프로세스',
        swim_lanes: swimLanes,
        raci: raciData,
        decisions: decisionsData,
        system_interfaces: result.integrated_data?.system_interfaces || []
      };

      await downloadProcessExcel(payload, type);
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      alert('엑셀 다운로드에 실패했습니다: ' + error.message);
    }
  };

  // 모든 이미지를 일괄 다운로드하도록 구현 변경
  const handleDownloadImage = async () => {
    const currentDate = new Date().toISOString().slice(0, 10)
    
    try {
      // 1. Swim Lane 이미지 저장
      if (captureSwimlaneRef.current) {
        await downloadTableAsImage(captureSwimlaneRef.current, `integrated_swimlane_${currentDate}.png`)
      }
      
      // 브라우저 동시 다운로드 충돌 방지용 대기시간 부여
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 2. RACI 매트릭스 이미지 저장
      if (captureRaciRef.current) {
        await downloadTableAsImage(captureRaciRef.current, `integrated_raci_${currentDate}.png`)
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 3. 의사결정 이미지 저장
      if (captureDecisionRef.current) {
        await downloadTableAsImage(captureDecisionRef.current, `integrated_decisions_${currentDate}.png`)
      }
    } catch (error) {
      console.error('이미지 일괄 다운로드 실패:', error)
      alert('일부 이미지 다운로드에 실패했습니다')
    }
  }

  const getActiveData = () => {
    if (selectedTab === 'swimlane') return getSwimlaneData()
    if (selectedTab === 'raci') return getRaciData()
    if (selectedTab === 'decisions') return getDecisionsData()
    return null
  }

  const renderActiveComponent = () => {
    if (selectedTab === 'swimlane') {
      return (
        <div ref={swimlaneSvgRef}>
          <SwimlaneDiagram data={getSwimlaneData()} />
        </div>
      )
    }
    if (selectedTab === 'raci') {
      return (
        <div ref={raciTableRef}>
          <RACIMatrix data={getRaciData()} />
        </div>
      )
    }
    if (selectedTab === 'decisions') {
      return (
        <div ref={decisionTableRef}>
          <DecisionTable data={getDecisionsData()} />
        </div>
      )
    }
    return null
  }

  const getTabTitle = () => {
    if (selectedTab === 'swimlane') return '🏊 Swim Lane 다이어그램'
    if (selectedTab === 'raci') return '👥 RACI 매트릭스'
    if (selectedTab === 'decisions') return '⚡ 의사결정 포인트'
    return ''
  }

  const activeData = getActiveData()

  return (
    <div className="analysis-detail-overlay">
      <div className="analysis-detail-panel">
        <div className="detail-header">
          <div className="detail-title">
            <h2>📋 통합 분석 상세보기</h2>
            <p>{result.group_name}</p>
          </div>
          <button className="detail-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="detail-info-bar">
          <div className="info-item">
            <strong>통합 분석명:</strong> {result.group_name}
          </div>
          <div className="info-item">
            <strong>통합 대상:</strong> {result.analysis_count || 0}개 분석 규정
          </div>
          <div className="info-item">
            <strong>생성 일시:</strong> {new Date(result.created_at).toLocaleString('ko-KR')}
          </div>
        </div>

        <div className="detail-content">
          {/* 좌측 사이드바 탭 버튼 */}
          <div className="detail-sections">
            <h3>📝 상세 정보</h3>
            {sections.map(section => (
              <div 
                key={section.id}
                className={`section-button ${selectedTab === section.id ? 'active' : ''}`}
                onClick={() => setSelectedTab(section.id)}
              >
                <div className="section-button-header">
                  <span className="icon">{section.icon}</span>
                  <span>{section.title.split(' ').slice(1).join(' ')}</span>
                </div>
                <span className="arrow">▶</span>
              </div>
            ))}
          </div>

          {/* 우측 시각화 및 원본 데이터 영역 */}
          <div className="detail-visualization">
            <div className="viz-header">
              <h3>{getTabTitle()}</h3>
              <div className="download-buttons">
                <button 
                  className="btn-download-image"
                  onClick={handleDownloadImage}
                  title="모든 다이어그램/테이블을 이미지로 저장"
                >
                  📥 모든 이미지 저장
                </button>
                {(selectedTab === 'raci' || selectedTab === 'decisions') && (
                  <button 
                    className="btn-download-csv"
                    onClick={handleDownloadCsv}
                    title="데이터를 CSV로 저장"
                  >
                    📊 CSV 저장
                  </button>
                )}
                <button 
                  className="btn-download-json"
                  onClick={handleDownloadJson}
                  title="전체 JSON 데이터를 다운로드"
                >
                  💾 JSON 저장
                </button>
                <ExcelDropdownButton onSelect={handleDownloadProcessExcel} />
                <button 
                  className={`btn-copy-json ${copiedJson ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(result.integrated_data)}
                  title="전체 JSON을 클립보드에 복사"
                >
                  {copiedJson ? '✓ 복사됨' : '📋 복사'}
                </button>
              </div>
            </div>

            {/* 시각화 영역 */}
            <div className="viz-diagram">
              {renderActiveComponent()}
            </div>

            {/* JSON 표시 영역 */}
            <div className="viz-json">
              <div className="json-header">
                <h4>JSON 데이터</h4>
              </div>
              <pre className="json-content">
                {activeData ? JSON.stringify(activeData, null, 2) : '데이터가 없습니다'}
              </pre>
            </div>
          </div>
        </div>

        {/* 캡처를 위한 오프스크린(숨겨진) 렌더링 컨테이너 */}
        <div style={{ position: 'fixed', top: 0, left: '-99999px', width: '3000px', height: '3000px', pointerEvents: 'none', zIndex: -9999 }}>
          <div ref={captureSwimlaneRef} style={{ width: 'max-content', minWidth: '1200px', background: '#0f172a', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#93c5fd', marginBottom: '15px' }}>🏊 Swim Lane 다이어그램</h3>
            <SwimlaneDiagram data={getSwimlaneData()} />
          </div>
          <div ref={captureRaciRef} style={{ width: '800px', background: '#0f172a', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#93c5fd', marginBottom: '15px' }}>👥 RACI 매트릭스</h3>
            <RACIMatrix data={getRaciData()} />
          </div>
          <div ref={captureDecisionRef} style={{ width: '900px', background: '#0f172a', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#93c5fd', marginBottom: '15px' }}>⚡ 의사결정 포인트</h3>
            <DecisionTable data={getDecisionsData()} />
          </div>
        </div>

        <div className="detail-footer">
          <button className="btn-close-detail" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

export default IntegrationResultView
