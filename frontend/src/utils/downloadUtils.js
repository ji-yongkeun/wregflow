import axiosInstance from './axiosInstance'

// ==================== 기존 유틸리티 함수 ====================

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

// ==================== 신규 추가 유틸리티 함수 ====================

// SVG를 PNG로 변환 후 다운로드
export const downloadSvgAsImage = async (svgElement, filename = 'diagram.png') => {
  try {
    if (!svgElement) {
      alert('SVG 요소를 찾을 수 없습니다')
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // SVG 크기 가져오기
    const viewBox = svgElement.getAttribute('viewBox')
    const [, , width, height] = viewBox.split(' ').map(Number)
    
    // 2배 해상도로 설정 (고화질)
    canvas.width = width * 2
    canvas.height = height * 2
    
    // 배경 색 설정
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // SVG를 이미지로 변환
    const data = new XMLSerializer().serializeToString(svgElement)
    const img = new Image()
    
    img.onload = () => {
      ctx.scale(2, 2)
      ctx.drawImage(img, 0, 0)
      
      // PNG로 다운로드
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/png')
    }
    
    img.onerror = () => {
      // 폴백: canvas로 직접 변환
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/png')
    }
    
    const blob = new Blob([data], { type: 'image/svg+xml' })
    img.src = URL.createObjectURL(blob)
  } catch (error) {
    console.error('이미지 다운로드 실패:', error)
    alert('이미지 다운로드에 실패했습니다')
  }
}

// JSON 데이터를 파일로 다운로드
export const downloadAsJson = (data, filename = 'data.json') => {
  try {
    if (data === undefined || data === null) {
      console.warn('downloadAsJson: data is null or undefined')
      alert('다운로드할 JSON 데이터가 존재하지 않습니다.')
      return
    }

    let jsonString = ''
    if (typeof data === 'string') {
      try {
        // 이미 JSON 문자열인 경우, 파싱 후 가독성 있게 정렬하여 저장
        const parsed = JSON.parse(data)
        jsonString = JSON.stringify(parsed, null, 2)
      } catch (e) {
        // 파싱 실패 시 원본 문자열 그대로 사용
        jsonString = data
      }
    } else {
      jsonString = JSON.stringify(data, null, 2)
    }
    
    // 일부 브라우저/보안 샌드박스에서 application/json 다운로드를 차단하는 문제를 방지하기 위해 text/plain;charset=utf-8 사용
    const blob = new Blob([jsonString], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('JSON 다운로드 실패:', error)
    alert('JSON 다운로드에 실패했습니다: ' + error.message)
  }
}

// RACI 데이터를 CSV로 다운로드
export const downloadRaciAsCsv = (data, filename = 'raci.csv') => {
  try {
    let raciData = data
    if (typeof data === 'string') {
      raciData = JSON.parse(data)
    }

    // UTF-8 BOM 설정 (엑셀 한글 깨짐 방지)
    let csv = '\uFEFF'
    
    if (Array.isArray(raciData) && raciData.length > 0) {
      const firstItem = raciData[0]
      if ('task' in firstItem) {
        // Detailed Analysis RACI format (task, responsible, accountable, consulted, informed)
        csv += '작업,R,A,C,I\n'
        raciData.forEach(item => {
          const task = (item.task || '').replace(/"/g, '""')
          const r = (item.responsible || '').replace(/"/g, '""')
          const a = (item.accountable || '').replace(/"/g, '""')
          const c = (item.consulted || '').replace(/"/g, '""')
          const i = (item.informed || '').replace(/"/g, '""')
          csv += `"${task}","${r}","${a}","${c}","${i}"\n`
        })
      } else {
        // Other format (role, activities)
        csv += '역할,활동\n'
        raciData.forEach(item => {
          if (item.role && item.activities) {
            const activities = Array.isArray(item.activities) 
              ? item.activities.join('; ') 
              : item.activities
            csv += `"${item.role}","${activities}"\n`
          }
        })
      }
    } else if (raciData && raciData.matrix) {
      // 행렬 형태인 경우 (matrix)
      const roles = Object.keys(raciData.matrix)
      const activities = raciData.matrix[roles[0]] ? Object.keys(raciData.matrix[roles[0]]) : []
      
      csv += '역할,' + activities.map(a => `"${a}"`).join(',') + '\n'
      roles.forEach(role => {
        const row = [role]
        activities.forEach(activity => {
          row.push(raciData.matrix[role]?.[activity] || '')
        })
        csv += row.map(cell => `"${cell}"`).join(',') + '\n'
      })
    } else {
      csv += '역할,활동\n'
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('CSV 다운로드 실패:', error)
    alert('CSV 다운로드에 실패했습니다')
  }
}

// 의사결정 데이터를 CSV로 다운로드
export const downloadDecisionsAsCsv = (data, filename = 'decisions.csv') => {
  try {
    let decisions = data
    if (typeof data === 'string') {
      decisions = JSON.parse(data)
    }

    if (!Array.isArray(decisions)) {
      decisions = [decisions]
    }

    // UTF-8 BOM 설정 (엑셀 한글 깨짐 방지)
    let csv = '\uFEFF'
    csv += 'ID,질문,YES 결과,NO 결과\n'
    
    decisions.forEach((decision, idx) => {
      const id = decision.id || idx + 1
      const question = (decision.question || '').replace(/"/g, '""')
      const yesOutcome = (decision.yes_outcome || decision.yesOutcome || '').replace(/"/g, '""')
      const noOutcome = (decision.no_outcome || decision.noOutcome || '').replace(/"/g, '""')
      
      csv += `${id},"${question}","${yesOutcome}","${noOutcome}"\n`
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
  } catch (error) {
    console.error('CSV 다운로드 실패:', error)
    alert('CSV 다운로드에 실패했습니다')
  }
}

// 테이블 HTML을 이미지로 다운로드 (html2canvas 사용)
export const downloadTableAsImage = async (tableElement, filename = 'table.png') => {
  try {
    // html2canvas 동적 로드
    const html2canvas = (await import('html2canvas')).default
    
    const canvas = await html2canvas(tableElement, {
      backgroundColor: '#0f172a',
      scale: 2,
      useCORS: true,
      allowTaint: true
    })
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 'image/png')
  } catch (error) {
    console.error('테이블 이미지 다운로드 실패:', error)
    alert('테이블 이미지 다운로드에 실패했습니다. CSV로 다운로드하세요.')
  }
}

// 엑셀 다운로드 공통 요청 함수
export const downloadProcessExcel = async (payload, type) => {
  try {
    const response = await axiosInstance.post(`/api/download/process-excel?type=${type}`, payload, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const typeLabel = type === 'fs' ? 'FS기준' : 'FT기준';
    a.download = `${payload.process_name}_${typeLabel}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('엑셀 다운로드 실패:', error);
    alert('엑셀 다운로드에 실패했습니다: ' + (error.response?.data?.detail || error.message));
  }
}

// 단일 분석 데이터용 엑셀 다운로드 래퍼
export const downloadSingleAnalysisExcel = async (analysis, type) => {
  const payload = {
    process_name: analysis.process_name || '상세 프로세스',
    swim_lanes: typeof analysis.swim_lanes === 'string' ? JSON.parse(analysis.swim_lanes) : (analysis.swim_lanes || []),
    raci: typeof analysis.raci === 'string' ? JSON.parse(analysis.raci) : (analysis.raci || []),
    decisions: typeof analysis.decisions === 'string' ? JSON.parse(analysis.decisions) : (analysis.decisions || []),
    system_interfaces: typeof analysis.system_interfaces === 'string' 
      ? JSON.parse(analysis.system_interfaces) 
      : (analysis.system_interfaces || [])
  };
  return downloadProcessExcel(payload, type);
}