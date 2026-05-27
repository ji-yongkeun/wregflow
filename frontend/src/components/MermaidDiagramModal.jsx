import { useEffect } from 'react'

export function MermaidDiagramModal({ section, data, onClose }) {
  useEffect(() => {
    // Mermaid 로드 및 렌더링
    if (window.mermaid) {
      window.mermaid.contentLoaded()
    }
  }, [data])

  const getMermaidCode = (section, data) => {
    switch(section) {
      case 'process':
        // 통합 프로세스 흐름
        if (!data?.integrated_process?.steps) return ''
        
        let code = 'graph LR\n'
        const steps = data.integrated_process.steps
        
        steps.forEach((step, idx) => {
          const nodeId = `step${idx}`
          const label = `"${step.step_name}<br/>(${step.responsible_department})"`
          code += `    ${nodeId}[${label}]\n`
          
          if (idx < steps.length - 1) {
            code += `    ${nodeId} --> step${idx + 1}\n`
          }
        })
        
        // 스타일
        steps.forEach((_, idx) => {
          code += `    style step${idx} fill:#4F46E5,stroke:#2E2AA0,color:#fff\n`
        })
        
        return code

      case 'interactions':
        // 부서 간 데이터 흐름
        if (!data?.department_interactions) return ''
        
        let code2 = 'graph LR\n'
        const interactions = data.department_interactions
        
        const depts = new Set()
        interactions.forEach(inter => {
          depts.add(inter.from_dept)
          depts.add(inter.to_dept)
        })
        
        const deptArray = Array.from(depts)
        deptArray.forEach((dept, idx) => {
          code2 += `    dept${idx}["${dept}"]\n`
        })
        
        interactions.forEach(inter => {
          const fromIdx = deptArray.indexOf(inter.from_dept)
          const toIdx = deptArray.indexOf(inter.to_dept)
          code2 += `    dept${fromIdx} -->|"${inter.data_flow}"| dept${toIdx}\n`
        })
        
        deptArray.forEach((_, idx) => {
          code2 += `    style dept${idx} fill:#4F46E5,stroke:#2E2AA0,color:#fff\n`
        })
        
        return code2

      case 'decisions':
        // 의사결정 포인트
        if (!data?.critical_decision_points) return ''
        
        let code3 = 'graph TD\n'
        const decisions = data.critical_decision_points
        
        decisions.forEach((decision, idx) => {
          code3 += `    dec${idx}{"${decision.point_name}"}\n`
          code3 += `    dec${idx} -->|YES| yes${idx}["✓ 진행"]\n`
          code3 += `    dec${idx} -->|NO| no${idx}["✗ 반려"]\n`
          code3 += `    style dec${idx} fill:#F59E0B,stroke:#D97706,color:#fff\n`
          code3 += `    style yes${idx} fill:#10B981,stroke:#059669,color:#fff\n`
          code3 += `    style no${idx} fill:#EF4444,stroke:#DC2626,color:#fff\n`
        })
        
        return code3

      default:
        return ''
    }
  }

  const mermaidCode = getMermaidCode(section, data)

  const titles = {
    process: '📊 통합 프로세스 흐름',
    interactions: '🔗 부서 간 데이터 흐름',
    decisions: '⚡ 의사결정 포인트'
  }

  return (
    <div className="mermaid-modal-overlay">
      <div className="mermaid-modal">
        <div className="mermaid-header">
          <h2>{titles[section]}</h2>
          <button className="mermaid-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="mermaid-content">
          <div className="mermaid">
            {mermaidCode}
          </div>
        </div>

        <div className="mermaid-footer">
          <button className="btn-download-diagram" onClick={() => {
            // Phase 4에서 구현할 다운로드 함수
            const svgElement = document.querySelector('.mermaid svg')
            if (svgElement) {
              const svgData = new XMLSerializer().serializeToString(svgElement)
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')
              const img = new Image()
              
              img.onload = () => {
                canvas.width = img.width
                canvas.height = img.height
                ctx.drawImage(img, 0, 0)
                const link = document.createElement('a')
                link.href = canvas.toDataURL('image/png')
                link.download = `diagram_${section}.png`
                link.click()
              }
              
              img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
            }
          }}>
            ⬇️ PNG로 다운로드
          </button>
          <button className="btn-close-modal" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  )
}

export default MermaidDiagramModal
