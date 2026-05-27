// JSON 다운로드
export function downloadJSON(data, filename = 'analysis.json') {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// CSV 다운로드 (RACI 매트릭스)
export function downloadRACIasCSV(analysis, filename = 'raci_matrix.csv') {
  if (!analysis.raci || analysis.raci.length === 0) {
    alert('RACI 데이터가 없습니다')
    return
  }

  // 헤더
  let csv = '작업,담당(R),책임(A),상의(C),보고(I)\n'

  // 행 추가
  analysis.raci.forEach(item => {
    const row = [
      `"${item.task}"`,
      `"${item.responsible}"`,
      `"${item.accountable}"`,
      `"${item.consulted}"`,
      `"${item.informed}"`
    ]
    csv += row.join(',') + '\n'
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Mermaid 코드 다운로드
export function downloadMermaidCode(mermaidCode, filename = 'swimlane.mmd') {
  const blob = new Blob([mermaidCode], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// SVG 다운로드
export function downloadSVG(svgElement, filename = 'swimlane.svg') {
  if (!svgElement) {
    alert('다이어그램이 없습니다')
    return
  }

  const svgString = new XMLSerializer().serializeToString(svgElement)
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 텍스트 파일 다운로드 (분석 보고서)
export function downloadReport(analysis, filename = 'analysis_report.txt') {
  let report = `# WRegFlow 분석 보고서\n\n`
  report += `프로세스명: ${analysis.process_name}\n`
  report += `설명: ${analysis.description}\n\n`

  report += `## Swim Lane (부서별 업무)\n`
  analysis.swim_lanes.forEach(lane => {
    report += `- ${lane.role}:\n`
    lane.steps.forEach(step => {
      report += `  - ${step.action}\n`
    })
  })

  report += `\n## RACI 매트릭스\n`
  analysis.raci.forEach(item => {
    report += `- ${item.task}: R=${item.responsible}, A=${item.accountable}\n`
  })

  report += `\n## 의사결정 포인트\n`
  analysis.decisions.forEach(decision => {
    report += `- Q: ${decision.question}\n`
    report += `  - Yes: ${decision.yes_outcome}\n`
    report += `  - No: ${decision.no_outcome}\n`
  })

  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}