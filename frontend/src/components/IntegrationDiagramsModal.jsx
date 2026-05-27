import { useEffect } from 'react'

export function IntegrationDiagramsModal({ data, onClose }) {
  useEffect(() => {
    if (window.mermaid) {
      window.mermaid.contentLoaded()
    }
  }, [data])

  const generateProcessMermaid = () => {
    if (!data?.integrated_process?.steps) return ''
    
    let code = 'graph LR\n'
    const steps = data.integrated_process.steps || []
    
    steps.forEach((step, idx) => {
      const nodeId = `A${idx}`
      const label = `"${step.step_name}<br/>(${step.responsible_department})"`
      code += `    ${nodeId}[${label}]\n`
      
      if (idx < steps.length - 1) {
        code += `    ${nodeId} --> A${idx + 1}\n`
      }
    })
    
    steps.forEach((_, idx) => {
      code += `    style A${idx} fill:#4F46E5,stroke:#2E2AA0,stroke-width:2px,color:#fff\n`
    })
    
    return code
  }

  const generateInteractionMermaid = () => {
    if (!data?.department_interactions) return ''
    
    let code = 'graph TB\n'
    const interactions = data.department_interactions || []
    
    const depts = new Set()
    interactions.forEach(inter => {
      depts.add(inter.from_dept)
      depts.add(inter.to_dept)
    })
    
    const deptArray = Array.from(depts)
    deptArray.forEach((dept, idx) => {
      code += `    D${idx}["${dept}"]\n`
    })
    
    interactions.forEach((inter, idx) => {
      const fromIdx = deptArray.indexOf(inter.from_dept)
      const toIdx = deptArray.indexOf(inter.to_dept)
      code += `    D${fromIdx} -->|"${inter.data_flow}"| D${toIdx}\n`
    })
    
    deptArray.forEach((_, idx) => {
      code += `    style D${idx} fill:#4F46E5,stroke:#2E2AA0,stroke-width:2px,color:#fff\n`
    })
    
    return code
  }

  const generateDecisionMermaid = () => {
    if (!data?.critical_decision_points) return ''
    
    let code = 'graph TD\n'
    const decisions = data.critical_decision_points || []
    
    decisions.forEach((decision, idx) => {
      code += `    D${idx}{"${decision.point_name}"}\n`
      code += `    D${idx} -->|YES| Y${idx}["✓ 진행"]\n`
      code += `    D${idx} -->|NO| N${idx}["✗ 반려"]\n`
      code += `    style D${idx} fill:#F59E0B,stroke:#D97706,stroke-width:2px,color:#fff\n`
      code += `    style Y${idx} fill:#10B981,stroke:#059669,stroke-width:2px,color:#fff\n`
      code += `    style N${idx} fill:#EF4444,stroke:#DC2626,stroke-width:2px,color:#fff\n`
    })
    
    return code
  }

  const processCode = generateProcessMermaid()
  const interactionCode = generateInteractionMermaid()
  const decisionCode = generateDecisionMermaid()

  return (
    <div className="diagram-modal-overlay">
      <div className="diagram-modal">
        <div className="diagram-modal-header">
          <h2>📊 통합 분석 다이어그램</h2>
          <button className="diagram-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="diagram-modal-content">
          <div className="diagrams-grid">
            {/* 프로세스 흐름 */}
            <div className="diagram-card">
              <div className="diagram-header">
                <h3>📊 통합 프로세스 흐름</h3>
              </div>
              <div className="diagram-body">
                {processCode ? (
                  <div className="mermaid" key="process">
                    {processCode}
                  </div>
                ) : (
                  <p className="no-data">데이터가 없습니다</p>
                )}
              </div>
            </div>

            {/* 부서 간 데이터 흐름 */}
            <div className="diagram-card">
              <div className="diagram-header">
                <h3>🔗 부서 간 데이터 흐름</h3>
              </div>
              <div className="diagram-body">
                {interactionCode ? (
                  <div className="mermaid" key="interaction">
                    {interactionCode}
                  </div>
                ) : (
                  <p className="no-data">데이터가 없습니다</p>
                )}
              </div>
            </div>

            {/* 의사결정 포인트 */}
            <div className="diagram-card">
              <div className="diagram-header">
                <h3>⚡ 의사결정 포인트</h3>
              </div>
              <div className="diagram-body">
                {decisionCode ? (
                  <div className="mermaid" key="decision">
                    {decisionCode}
                  </div>
                ) : (
                  <p className="no-data">데이터가 없습니다</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="diagram-modal-footer">
          <button className="btn-close-diagram" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

export default IntegrationDiagramsModal
