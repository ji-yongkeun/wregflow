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
        // Detailed Analysis RACI format (task, responsible, accountable, consulted, informed, regulation_ref)
        csv += '작업,R,A,C,I,관련 규정\n'
        raciData.forEach(item => {
          const task = (item.task || '').replace(/"/g, '""')
          const r = (item.responsible || '').replace(/"/g, '""')
          const a = (item.accountable || '').replace(/"/g, '""')
          const c = (item.consulted || '').replace(/"/g, '""')
          const i = (item.informed || '').replace(/"/g, '""')
          const ref = (item.regulation_ref || '').replace(/"/g, '""')
          csv += `"${task}","${r}","${a}","${c}","${i}","${ref}"\n`
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
    csv += 'ID,질문,YES 결과,NO 결과,관련 규정\n'
    
    decisions.forEach((decision, idx) => {
      const id = decision.id || idx + 1
      const question = (decision.question || '').replace(/"/g, '""')
      const yesOutcome = (decision.yes_outcome || decision.yesOutcome || '').replace(/"/g, '""')
      const noOutcome = (decision.no_outcome || decision.noOutcome || '').replace(/"/g, '""')
      const ref = (decision.regulation_ref || '').replace(/"/g, '""')
      
      csv += `${id},"${question}","${yesOutcome}","${noOutcome}","${ref}"\n`
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

// ── Canvas 헬퍼 ──────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r = 8) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const chars = Array.from(text)
  const lines = []
  let current = ''
  for (const ch of chars) {
    const test = current + ch
    if (ctx.measureText(test).width > maxWidth && current.length > 0) {
      lines.push(current)
      if (lines.length >= maxLines) { lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1) + '…'; break }
      current = ch
    } else {
      current = test
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight))
  return lines.length * lineHeight
}

function arrowHead(ctx, x, y, size = 6) {
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x - size, y - size * 0.6)
  ctx.lineTo(x - size, y + size * 0.6)
  ctx.closePath()
  ctx.fill()
}

// ── Canvas PNG 공통 다운로드 ──────────────────────────────────────────────────
function canvasDownload(canvas, filename) {
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}

// RACI 매트릭스 PPT
export const downloadRaciPPT = async (raciData, processName, filename) => {
  try {
    const data = typeof raciData === 'string' ? JSON.parse(raciData) : raciData
    if (!data?.length) { alert('RACI 데이터가 없습니다'); return }

    const pptxgen = (await import('pptxgenjs')).default
    const pptx = new pptxgen()
    pptx.layout = 'LAYOUT_WIDE'
    pptx.title = 'RACI Matrix'

    const slide = pptx.addSlide()
    slide.background = { fill: '0A0F1E' }

    const M  = 0.25
    const FONT = 'Malgun Gothic'
    const TITLE_H = 0.45

    // 알려진 키 순서 + 동적 추가 키
    const ORDERED = ['task','responsible','accountable','consulted','informed']
    const LABELS  = { task:'작업', responsible:'R (수행)', accountable:'A (책임)', consulted:'C (합의)', informed:'I (보고)' }
    const allKeys = [...new Set(data.flatMap(r => Object.keys(r)))]
    const keys = [...ORDERED.filter(k => allKeys.includes(k)), ...allKeys.filter(k => !ORDERED.includes(k))]

    // 컬럼 너비 배분 (task는 넓게, 나머지 균등)
    const slideW  = 13.33 - M * 2
    const taskW   = keys.includes('task') ? 3.5 : 0
    const otherW  = keys.length > 1 ? (slideW - taskW) / (keys.length - (keys.includes('task') ? 1 : 0)) : slideW
    const colWidths = keys.map(k => k === 'task' ? taskW : otherW)

    const HDR_H  = 0.42
    const ROW_H  = 0.52

    // 제목
    slide.addText(processName ? `${processName} — RACI 매트릭스` : 'RACI 매트릭스', {
      x: M, y: M * 0.4, w: slideW, h: TITLE_H,
      fontSize: 18, bold: true, color: '93C5FD', fontFace: FONT, align: 'left',
    })

    const tableY = M + TITLE_H

    // 헤더 행
    let cx = M
    keys.forEach((k, i) => {
      slide.addShape(pptx.ShapeType.rect, {
        x: cx, y: tableY, w: colWidths[i], h: HDR_H,
        fill: { color: '1E3A8A' }, line: { color: '4F46E5', width: 0.8 },
      })
      slide.addText(LABELS[k] || k, {
        x: cx, y: tableY, w: colWidths[i], h: HDR_H,
        fontSize: 10, bold: true, color: '93C5FD', fontFace: FONT,
        align: 'center', valign: 'middle',
      })
      cx += colWidths[i]
    })

    // 데이터 행
    data.forEach((row, ri) => {
      const rowY = tableY + HDR_H + ri * ROW_H
      const bg = ri % 2 === 0 ? '0F172A' : '1E293B'
      let dx = M
      keys.forEach((k, ci) => {
        const val = row[k]
        const text = val === null || val === undefined ? '-'
          : typeof val === 'object' ? JSON.stringify(val) : String(val)
        slide.addShape(pptx.ShapeType.rect, {
          x: dx, y: rowY, w: colWidths[ci], h: ROW_H,
          fill: { color: bg }, line: { color: '1E3A5F', width: 0.4 },
        })
        slide.addText(text, {
          x: dx + 0.06, y: rowY, w: colWidths[ci] - 0.12, h: ROW_H,
          fontSize: ci === 0 ? 10 : 9,
          bold: ci === 0,
          color: ci === 0 ? 'E2E8F0' : 'CBD5E1',
          fontFace: FONT,
          align: ci === 0 ? 'left' : 'center',
          valign: 'middle',
          wrap: true,
        })
        dx += colWidths[ci]
      })
    })

    const dateStr = new Date().toISOString().slice(0, 10)
    await pptx.writeFile({ fileName: filename || `raci_${dateStr}.pptx` })
  } catch (err) {
    console.error('RACI PPT 저장 실패:', err)
    alert('RACI PPT 저장에 실패했습니다: ' + err.message)
  }
}

// 의사결정 포인트 PPT
export const downloadDecisionsPPT = async (decisionsData, processName, filename) => {
  try {
    const data = typeof decisionsData === 'string' ? JSON.parse(decisionsData) : decisionsData
    if (!data?.length) { alert('의사결정 데이터가 없습니다'); return }

    const pptxgen = (await import('pptxgenjs')).default
    const pptx = new pptxgen()
    pptx.layout = 'LAYOUT_WIDE'
    pptx.title = '의사결정 포인트'

    const slide = pptx.addSlide()
    slide.background = { fill: '0A0F1E' }

    const M    = 0.25
    const FONT = 'Malgun Gothic'
    const TITLE_H = 0.45
    const slideW  = 13.33 - M * 2

    slide.addText(processName ? `${processName} — 의사결정 포인트` : '의사결정 포인트', {
      x: M, y: M * 0.4, w: slideW, h: TITLE_H,
      fontSize: 18, bold: true, color: '93C5FD', fontFace: FONT, align: 'left',
    })

    // 표 형태 (No. / 질문 / YES / NO)
    const COLS = [0.5, 3.8, 4.3, 4.2]   // No. | 질문 | YES | NO
    const HDR_H = 0.42
    const ROW_H = 0.65
    const tableY = M + TITLE_H
    const headers = [{ label:'No.', color:'A5B4FC' }, { label:'질문', color:'93C5FD' }, { label:'✓ YES 결과', color:'4ADE80' }, { label:'✗ NO 결과', color:'F87171' }]

    let cx = M
    headers.forEach(({ label, color }, i) => {
      slide.addShape(pptx.ShapeType.rect, {
        x: cx, y: tableY, w: COLS[i], h: HDR_H,
        fill: { color: '1E3A8A' }, line: { color: '4F46E5', width: 0.8 },
      })
      slide.addText(label, {
        x: cx, y: tableY, w: COLS[i], h: HDR_H,
        fontSize: 10, bold: true, color, fontFace: FONT, align: 'center', valign: 'middle',
      })
      cx += COLS[i]
    })

    data.forEach((d, di) => {
      const rowY = tableY + HDR_H + di * ROW_H
      const bg = di % 2 === 0 ? '0F172A' : '1E293B'
      const cells = [
        { text: String(d.id || di + 1), color: 'A5B4FC', align: 'center', bold: true },
        { text: d.question || '-', color: 'F8FAFC', align: 'left', bold: true },
        { text: d.yes_outcome || d.yesOutcome || '-', color: '4ADE80', align: 'left', bold: false },
        { text: d.no_outcome  || d.noOutcome  || '-', color: 'F87171', align: 'left', bold: false },
      ]
      let dx = M
      cells.forEach((cell, ci) => {
        slide.addShape(pptx.ShapeType.rect, {
          x: dx, y: rowY, w: COLS[ci], h: ROW_H,
          fill: { color: bg }, line: { color: '1E3A5F', width: 0.4 },
        })
        slide.addText(cell.text, {
          x: dx + 0.06, y: rowY, w: COLS[ci] - 0.12, h: ROW_H,
          fontSize: 9, bold: cell.bold, color: cell.color,
          fontFace: FONT, align: cell.align, valign: 'middle', wrap: true,
        })
        dx += COLS[ci]
      })
    })

    const dateStr = new Date().toISOString().slice(0, 10)
    await pptx.writeFile({ fileName: filename || `decisions_${dateStr}.pptx` })
  } catch (err) {
    console.error('의사결정 PPT 저장 실패:', err)
    alert('의사결정 PPT 저장에 실패했습니다: ' + err.message)
  }
}

// Swim Lane Canvas PNG (JSON 미포함)
export const downloadSwimlaneImage = (swimData, processName, _unused, filename) => {
  const SC    = 2
  const MG    = 36
  const HDR_W = 188
  const LANE_H = 180
  const STEP_W = 230
  const CARD_H = 125
  const CMGX  = 14
  const CARD_W = STEP_W - CMGX * 2
  const FONT   = '"Malgun Gothic","맑은 고딕","Apple SD Gothic Neo",sans-serif'

  let maxOrder = 1
  swimData.forEach(l => l.steps?.forEach(s => { if ((s.order||1) > maxOrder) maxOrder = s.order }))

  const totalW   = MG * 2 + HDR_W + maxOrder * STEP_W + 10
  const diagramH = swimData.length * LANE_H
  const titleH   = 56
  const legendH  = 44
  const totalH   = MG + titleH + diagramH + legendH + MG

  const canvas = document.createElement('canvas')
  canvas.width = totalW * SC; canvas.height = totalH * SC
  const ctx = canvas.getContext('2d')
  ctx.scale(SC, SC)

  ctx.fillStyle = '#0A0F1E'; ctx.fillRect(0, 0, totalW, totalH)

  // 제목
  ctx.fillStyle = '#93C5FD'; ctx.font = `bold 22px ${FONT}`
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillText(processName || 'Swim Lane 다이어그램', MG, MG + titleH / 2)

  const startY = MG + titleH

  swimData.forEach((lane, li) => {
    const lY = startY + li * LANE_H

    ctx.fillStyle = li % 2 === 0 ? '#1E293B' : '#0F172A'
    ctx.fillRect(MG, lY, totalW - MG * 2, LANE_H)
    ctx.strokeStyle = '#1E3A5F'; ctx.lineWidth = 0.6
    ctx.strokeRect(MG, lY, totalW - MG * 2, LANE_H)

    const hX = MG + 6, hY = lY + (LANE_H - CARD_H) / 2, hW = HDR_W - 14
    roundRect(ctx, hX, hY, hW, CARD_H, 10)
    ctx.fillStyle = '#0F172A'; ctx.fill()
    ctx.strokeStyle = '#4F46E5'; ctx.lineWidth = 1.5; ctx.stroke()
    ctx.fillStyle = '#93C5FD'
    ctx.font = `bold ${lane.role.length > 14 ? 10 : 12}px ${FONT}`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    drawWrappedText(ctx, lane.role, hX + hW / 2, hY + CARD_H / 2 - 8, hW - 10, 15, 3)

    ctx.strokeStyle = '#4F46E5'; ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(MG + HDR_W, lY); ctx.lineTo(MG + HDR_W, lY + LANE_H); ctx.stroke()

    const sorted = [...(lane.steps || [])].sort((a, b) => (a.order||0) - (b.order||0))
    sorted.forEach((step, si) => {
      const lo = step.order || si + 1
      const cX = MG + HDR_W + (lo - 1) * STEP_W + CMGX
      const cY = lY + (LANE_H - CARD_H) / 2
      const isDec = step.decision === true

      roundRect(ctx, cX, cY, CARD_W, CARD_H, 10)
      ctx.fillStyle = isDec ? '#B45309' : '#312E81'; ctx.fill()
      ctx.strokeStyle = isDec ? '#FCD34D' : '#818CF8'; ctx.lineWidth = 1.5; ctx.stroke()

      ctx.fillStyle = isDec ? '#FCD34D' : '#A5B4FC'
      ctx.font = `bold 9px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      ctx.fillText(isDec ? '⚡ 의사결정' : `STEP ${lo}`, cX + CARD_W / 2, cY + 7)

      ctx.fillStyle = isDec ? '#FEF3C7' : '#E0E7FF'
      ctx.font = `bold 12px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      drawWrappedText(ctx, step.action, cX + CARD_W / 2, cY + 24, CARD_W - 10, 15, 4)

      if (step.system_used) {
        ctx.fillStyle = '#10B981'; ctx.font = `bold 10px ${FONT}`
        ctx.fillText(`[${step.system_used}]`, cX + CARD_W / 2, cY + CARD_H - 32)
      }
      
      const typeText = {
        'system': '💻 시스템', 'approval': '✅ 승인', 'general': '⚙️ 일반', 'document': '📄 문서'
      }[step.task_type] || step.task_type || ''
      if (typeText) {
        ctx.fillStyle = '#94A3B8'; ctx.font = `bold 10px ${FONT}`
        ctx.fillText(typeText, cX + CARD_W / 2, cY + CARD_H - 18)
      }

      if (si < sorted.length - 1) {
        const ax = cX + CARD_W, ex = cX + STEP_W - CMGX, ay = lY + LANE_H / 2
        ctx.strokeStyle = '#6366F1'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex - 6, ay); ctx.stroke()
        ctx.fillStyle = '#6366F1'; arrowHead(ctx, ex, ay)
      }
    })
  })

  // 범례
  const legY = startY + diagramH + 12
  roundRect(ctx, MG, legY + 4, 32, 18, 4)
  ctx.fillStyle = '#312E81'; ctx.fill(); ctx.strokeStyle = '#818CF8'; ctx.lineWidth = 1; ctx.stroke()
  ctx.fillStyle = '#CBD5E1'; ctx.font = `12px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillText('일반 프로세스', MG + 38, legY + 13)

  roundRect(ctx, MG + 160, legY + 4, 32, 18, 4)
  ctx.fillStyle = '#B45309'; ctx.fill(); ctx.strokeStyle = '#FCD34D'; ctx.lineWidth = 1; ctx.stroke()
  ctx.fillStyle = '#CBD5E1'; ctx.fillText('의사결정 포인트', MG + 198, legY + 13)

  canvasDownload(canvas, filename || `swimlane_${new Date().toISOString().slice(0,10)}.png`)
}

// RACI 매트릭스 Canvas PNG
export const downloadRaciImage = (raciData, processName, filename) => {
  const data = typeof raciData === 'string' ? JSON.parse(raciData) : raciData
  if (!data?.length) { alert('RACI 데이터가 없습니다'); return }

  const SC   = 2
  const MG   = 36
  const FONT = '"Malgun Gothic","맑은 고딕","Apple SD Gothic Neo",sans-serif'
  const COLS = [320, 120, 120, 180, 150]   // 작업, R, A, C, I
  const HDR_H = 46
  const titleH = 56

  // 행 높이: 긴 텍스트는 2줄까지 허용 → 고정 72px
  const ROW_H = 72
  const totalW = MG * 2 + COLS.reduce((s, c) => s + c, 0)
  const totalH = MG + titleH + HDR_H + data.length * ROW_H + MG

  const canvas = document.createElement('canvas')
  canvas.width = totalW * SC; canvas.height = totalH * SC
  const ctx = canvas.getContext('2d')
  ctx.scale(SC, SC)

  ctx.fillStyle = '#0A0F1E'; ctx.fillRect(0, 0, totalW, totalH)

  // 제목
  ctx.fillStyle = '#93C5FD'; ctx.font = `bold 22px ${FONT}`
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillText(processName ? `${processName} — RACI 매트릭스` : 'RACI 매트릭스', MG, MG + titleH / 2)

  const tableY = MG + titleH
  const headers = ['작업', 'R (수행)', 'A (책임)', 'C (합의)', 'I (보고)']

  // 헤더 행
  let cx = MG
  headers.forEach((h, i) => {
    ctx.fillStyle = '#1E3A8A'; ctx.fillRect(cx, tableY, COLS[i], HDR_H)
    ctx.strokeStyle = '#4F46E5'; ctx.lineWidth = 0.8; ctx.strokeRect(cx, tableY, COLS[i], HDR_H)
    ctx.fillStyle = '#93C5FD'; ctx.font = `bold 12px ${FONT}`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(h, cx + COLS[i] / 2, tableY + HDR_H / 2)
    cx += COLS[i]
  })

  // 데이터 행
  data.forEach((item, ri) => {
    const rowY = tableY + HDR_H + ri * ROW_H
    const cells = [item.task||'', item.responsible||'', item.accountable||'', item.consulted||'', item.informed||'']
    let dx = MG
    cells.forEach((cell, ci) => {
      ctx.fillStyle = ri % 2 === 0 ? '#0F172A' : '#1E293B'
      ctx.fillRect(dx, rowY, COLS[ci], ROW_H)
      ctx.strokeStyle = '#1E3A5F'; ctx.lineWidth = 0.5; ctx.strokeRect(dx, rowY, COLS[ci], ROW_H)

      ctx.fillStyle = ci === 0 ? '#E2E8F0' : '#CBD5E1'
      ctx.font = `${ci === 0 ? 'bold ' : ''}12px ${FONT}`
      ctx.textAlign = ci === 0 ? 'left' : 'center'
      ctx.textBaseline = 'top'

      if (ci === 0) {
        drawWrappedText(ctx, cell, dx + 10, rowY + (ROW_H - 30) / 2, COLS[ci] - 20, 15, 2)
      } else {
        drawWrappedText(ctx, cell, dx + COLS[ci] / 2, rowY + (ROW_H - 15) / 2, COLS[ci] - 10, 14, 2)
      }
      dx += COLS[ci]
    })
  })

  canvasDownload(canvas, filename || `raci_${new Date().toISOString().slice(0,10)}.png`)
}

// 의사결정 포인트 Canvas PNG
export const downloadDecisionsImage = (decisionsData, processName, filename) => {
  const data = typeof decisionsData === 'string' ? JSON.parse(decisionsData) : decisionsData
  if (!data?.length) { alert('의사결정 데이터가 없습니다'); return }

  const SC     = 2
  const MG     = 36
  const FONT   = '"Malgun Gothic","맑은 고딕","Apple SD Gothic Neo",sans-serif'
  const CARD_W = 880
  const CARD_MG = 16
  const titleH = 56

  // 카드 높이: ID행(40) + 구분선(1) + Yes(60) + No(60) + 여백
  const CARD_H    = 185
  const CARD_GAP  = 14
  const totalW    = MG * 2 + CARD_W
  const totalH    = MG + titleH + data.length * (CARD_H + CARD_GAP) - CARD_GAP + MG

  const canvas = document.createElement('canvas')
  canvas.width = totalW * SC; canvas.height = totalH * SC
  const ctx = canvas.getContext('2d')
  ctx.scale(SC, SC)

  ctx.fillStyle = '#0A0F1E'; ctx.fillRect(0, 0, totalW, totalH)

  // 제목
  ctx.fillStyle = '#93C5FD'; ctx.font = `bold 22px ${FONT}`
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillText(processName ? `${processName} — 의사결정 포인트` : '의사결정 포인트', MG, MG + titleH / 2)

  const startY = MG + titleH

  data.forEach((d, di) => {
    const cY = startY + di * (CARD_H + CARD_GAP)

    // 카드 배경
    roundRect(ctx, MG, cY, CARD_W, CARD_H, 12)
    ctx.fillStyle = '#1E293B'; ctx.fill()
    ctx.strokeStyle = '#4F46E5'; ctx.lineWidth = 1.5; ctx.stroke()

    // ID 배지
    roundRect(ctx, MG + CARD_MG, cY + CARD_MG, 58, 26, 13)
    ctx.fillStyle = '#312E81'; ctx.fill()
    ctx.strokeStyle = '#4F46E5'; ctx.lineWidth = 1; ctx.stroke()
    ctx.fillStyle = '#A5B4FC'; ctx.font = `bold 11px ${FONT}`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(`#${d.id || di + 1}`, MG + CARD_MG + 29, cY + CARD_MG + 13)

    // 질문 텍스트
    ctx.fillStyle = '#F8FAFC'; ctx.font = `bold 14px ${FONT}`
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'
    drawWrappedText(ctx, d.question || '', MG + CARD_MG + 68, cY + CARD_MG + 5, CARD_W - 90, 18, 2)

    // 구분선
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 0.6
    ctx.beginPath(); ctx.moveTo(MG + CARD_MG, cY + 58); ctx.lineTo(MG + CARD_W - CARD_MG, cY + 58); ctx.stroke()

    // Yes 결과
    roundRect(ctx, MG + CARD_MG, cY + 68, 62, 22, 4)
    ctx.fillStyle = 'rgba(34,197,94,0.15)'; ctx.fill()
    ctx.strokeStyle = 'rgba(34,197,94,0.5)'; ctx.lineWidth = 1; ctx.stroke()
    ctx.fillStyle = '#4ADE80'; ctx.font = `bold 11px ${FONT}`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('Yes (✓)', MG + CARD_MG + 31, cY + 79)

    ctx.fillStyle = '#E2E8F0'; ctx.font = `12px ${FONT}`
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'
    drawWrappedText(ctx, d.yes_outcome || '-', MG + CARD_MG + 72, cY + 68, CARD_W - 100, 16, 3)

    // No 결과
    roundRect(ctx, MG + CARD_MG, cY + 122, 62, 22, 4)
    ctx.fillStyle = 'rgba(239,68,68,0.15)'; ctx.fill()
    ctx.strokeStyle = 'rgba(239,68,68,0.5)'; ctx.lineWidth = 1; ctx.stroke()
    ctx.fillStyle = '#F87171'; ctx.font = `bold 11px ${FONT}`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('No  (✗)', MG + CARD_MG + 31, cY + 133)

    ctx.fillStyle = '#E2E8F0'; ctx.font = `12px ${FONT}`
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'
    drawWrappedText(ctx, d.no_outcome || '-', MG + CARD_MG + 72, cY + 122, CARD_W - 100, 16, 3)
  })

  canvasDownload(canvas, filename || `decisions_${new Date().toISOString().slice(0,10)}.png`)
}

// DOM 요소를 PNG 이미지로 다운로드 (React Flow 포함 모든 요소에 사용 가능)
export const downloadElementAsImage = async (element, filename = 'diagram.png') => {
  try {
    if (!element) { alert('캡처할 요소를 찾을 수 없습니다'); return }
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(element, {
      backgroundColor: '#0a0f1e',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    })
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = filename
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)
    }, 'image/png')
  } catch (err) {
    console.error('이미지 저장 실패:', err)
    alert('이미지 저장에 실패했습니다')
  }
}

// DOM 요소를 PDF A3 세로 형식으로 저장
export const downloadElementAsPdfA3 = async (element, title = '', filename = 'diagram.pdf') => {
  try {
    if (!element) { alert('캡처할 요소를 찾을 수 없습니다'); return }

    const html2canvas = (await import('html2canvas')).default
    const { jsPDF } = await import('jspdf')

    // A3 세로: 297mm × 420mm
    const A3_W_MM = 297
    const A3_H_MM = 420
    const MARGIN_MM = 8

    const canvas = await html2canvas(element, {
      backgroundColor: null,   // 화면 배경색 그대로 보존
      scale: 3,
      useCORS: true,
      allowTaint: true,
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const imgW = canvas.width
    const imgH = canvas.height

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a3' })

    // 타이틀 영역 확보
    const titleH = title ? 10 : 0
    const areaW = A3_W_MM - MARGIN_MM * 2
    const areaH = A3_H_MM - MARGIN_MM * 2 - titleH

    // 이미지 비율 유지하며 A3에 맞게 스케일
    const ratio = imgW / imgH
    let drawW = areaW
    let drawH = drawW / ratio
    if (drawH > areaH) { drawH = areaH; drawW = drawH * ratio }
    const drawX = MARGIN_MM + (areaW - drawW) / 2
    const drawY = MARGIN_MM + titleH + (areaH - drawH) / 2

    if (title) {
      pdf.setFontSize(13)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(30, 64, 175)
      pdf.text(title, MARGIN_MM, MARGIN_MM + 7)
    }

    pdf.addImage(imgData, 'PNG', drawX, drawY, drawW, drawH)
    pdf.save(filename)
  } catch (err) {
    console.error('PDF 저장 실패:', err)
    alert('PDF 저장에 실패했습니다: ' + err.message)
  }
}

// Swim Lane 데이터를 PPT(pptxgenjs)로 다운로드
// A3 가로 스윔레인 PPT — 행=역할, 열=단계(order 기준), A3 가로 사이즈, 페이지 넘김 지원
export const downloadSwimlanePPT = async (swimData, processName, filename) => {
  try {
    const pptxgen = (await import('pptxgenjs')).default
    const pptx = new pptxgen()

    // A3 가로 (420mm × 297mm = 16.54" × 11.69")
    pptx.defineLayout({ name: 'A3_LANDSCAPE', width: 16.54, height: 11.69 })
    pptx.layout = 'A3_LANDSCAPE'
    pptx.title = processName || 'Swim Lane Diagram'

    const FONT    = 'Malgun Gothic'
    const M       = 0.25    // 외부 여백
    const TITLE_H = 0.45
    const HDR_W   = 1.55    // 레인 헤더 너비
    const STEP_W  = 1.90    // 스텝 열 너비
    const CARD_MX = 0.12    // 카드 좌우 내부 여백
    const CARD_W  = STEP_W - CARD_MX * 2

    const SLIDE_W = 16.54
    const SLIDE_H = 11.69
    const startY  = M + TITLE_H

    // 슬라이드당 표시 가능한 스텝 수
    const availStepW   = SLIDE_W - M * 2 - HDR_W
    const stepsPerSlide = Math.max(1, Math.floor(availStepW / STEP_W))

    // 레인 높이 (레인 수에 맞게 분배, 1.0" ~ 2.2")
    const numLanes = swimData.length
    const availH   = SLIDE_H - M * 2 - TITLE_H - 0.35  // 0.35 = 범례 공간
    const LANE_H   = Math.min(2.2, Math.max(1.0, availH / Math.max(numLanes, 1)))
    const CARD_H   = LANE_H * 0.76

    // 전체 고유 order 목록 수집
    const allOrders = new Set()
    swimData.forEach(lane => {
      ;(lane.steps || []).forEach(s => allOrders.add(s.order != null ? s.order : 9999))
    })
    const sortedOrders = [...allOrders].sort((a, b) => a - b)
    if (!sortedOrders.length) { alert('steps 데이터가 없습니다'); return }

    // 페이지 분할: 각 페이지는 stepsPerSlide 개의 order를 담당
    const pages = []
    for (let i = 0; i < sortedOrders.length; i += stepsPerSlide)
      pages.push(sortedOrders.slice(i, i + stepsPerSlide))

    const totalPages = pages.length

    pages.forEach((pageOrders, pageIdx) => {
      // 이 페이지의 order → 열 인덱스 (0-based) 매핑
      const orderToCol = {}
      pageOrders.forEach((ord, ci) => { orderToCol[ord] = ci })

      const slide = pptx.addSlide()
      slide.background = { fill: '0A0F1E' }

      // ── 제목 ──
      const pageLabel = totalPages > 1 ? `  (${pageIdx + 1}/${totalPages})` : ''
      slide.addText(`${processName || 'Swim Lane 다이어그램'}${pageLabel}`, {
        x: M, y: M * 0.4, w: SLIDE_W - M * 2, h: TITLE_H,
        fontSize: 16, bold: true, color: '93C5FD',
        fontFace: FONT, align: 'left',
      })

      // ── 레인별 렌더링 ──
      swimData.forEach((lane, li) => {
        const lY    = startY + li * LANE_H
        const bgFill = li % 2 === 0 ? '1E293B' : '0F172A'
        const totalRowW = HDR_W + pageOrders.length * STEP_W

        // 레인 배경
        slide.addShape(pptx.ShapeType.rect, {
          x: M, y: lY, w: totalRowW, h: LANE_H,
          fill: { color: bgFill }, line: { color: '1E3A5F', width: 0.4 },
        })

        // 헤더 구분선
        slide.addShape(pptx.ShapeType.line, {
          x: M + HDR_W, y: lY, w: 0, h: LANE_H,
          line: { color: '4F46E5', width: 0.6 },
        })

        // 헤더 카드
        const hX = M + 0.06
        const hY = lY + (LANE_H - CARD_H) / 2
        slide.addShape(pptx.ShapeType.roundRect, {
          x: hX, y: hY, w: HDR_W - 0.14, h: CARD_H,
          fill: { color: '0F172A' }, line: { color: '4F46E5', width: 1.5 }, arcSize: 8,
        })
        slide.addText(lane.role || '', {
          x: hX, y: hY, w: HDR_W - 0.14, h: CARD_H,
          fontSize: (lane.role || '').length > 14 ? 7 : 9,
          bold: true, color: '93C5FD',
          align: 'center', valign: 'middle', fontFace: FONT, wrap: true,
        })

        // ── 스텝 카드 ──
        const sorted = [...(lane.steps || [])].sort((a, b) => (a.order || 0) - (b.order || 0))

        sorted.forEach((step) => {
          const lo = step.order != null ? step.order : 9999
          if (!(lo in orderToCol)) return  // 이 페이지에 없는 스텝 skip

          const colIdx = orderToCol[lo]
          const cX     = M + HDR_W + colIdx * STEP_W + CARD_MX
          const cY     = lY + (LANE_H - CARD_H) / 2
          const isDec  = step.decision === true

          // 카드 배경 (흰색 카드)
          slide.addShape(pptx.ShapeType.roundRect, {
            x: cX, y: cY, w: CARD_W, h: CARD_H,
            fill: { color: isDec ? 'FEF9C3' : 'FFFFFF' },
            line: { color: isDec ? 'F59E0B' : '93C5FD', width: 0.8 },
            arcSize: 12,
          })

          if (isDec) {
            const actionText = step.action || ''
            let refStr = ''
            if (step.regulation_ref && step.regulation_ref !== '알 수 없음') {
                refStr = step.regulation_ref
            } else if (step.related_editions && step.related_editions.length > 0) {
                refStr = step.related_editions.map(e => `${e}편`).join(', ')
            }
            const refText = refStr ? `\n[${refStr}]` : ''
            const textToDraw = actionText + refText
            // 의사결정 레이블 + 텍스트
            slide.addText('⚡ 의사결정', {
              x: cX, y: cY + 0.05, w: CARD_W, h: 0.18,
              fontSize: 6.5, bold: true, color: 'B45309',
              align: 'center', fontFace: FONT,
            })
            slide.addText(finalAction, {
              x: cX + 0.04, y: cY + 0.25, w: CARD_W - 0.08, h: CARD_H - 0.44,
              fontSize: 8, bold: true, color: '78350F',
              align: 'center', valign: 'top', fontFace: FONT, wrap: true,
            })
          } else {
            // 번호 배지 (좌상단, 파란 사각형) — 최소 2자리 한 줄 보장
            const numStr = String(lo)
            const nbW = Math.max(0.32, numStr.length * 0.11 + 0.10)
            const nbH = 0.20
            slide.addShape(pptx.ShapeType.roundRect, {
              x: cX + 0.06, y: cY + 0.06, w: nbW, h: nbH,
              fill: { color: '2563EB' }, line: { color: '2563EB', width: 0 },
              arcSize: 15,
            })
            slide.addText(numStr, {
              x: cX + 0.06, y: cY + 0.06, w: nbW, h: nbH,
              fontSize: 6, bold: true, color: 'FFFFFF',
              fontFace: FONT, align: 'center', valign: 'middle',
            })

            // 시스템/유형 칩 (우상단)
            const typeLabel = { system: '시스템', approval: '수기', document: '문서', general: '일반' }[step.task_type] || ''
            const sysLabel = step.system_used || ''
            const chipText = [typeLabel, sysLabel].filter(Boolean).join('/')
            if (chipText) {
              const chipW = Math.max(0.42, chipText.length * 0.065 + 0.08)
              const chipH = 0.15
              const chipX = cX + CARD_W - chipW - 0.04
              const chipY = cY + 0.05
              const chipColor = sysLabel ? '059669' : '64748B'
              slide.addShape(pptx.ShapeType.roundRect, {
                x: chipX, y: chipY, w: chipW, h: chipH,
                fill: { color: chipColor }, line: { color: chipColor, width: 0 },
                arcSize: 50,
              })
              slide.addText(chipText, {
                x: chipX, y: chipY, w: chipW, h: chipH,
                fontSize: 5, bold: true, color: 'FFFFFF',
                fontFace: FONT, align: 'center', valign: 'middle',
              })
            }

            // 액션 텍스트 (진하고 어두운 색)
            const actionText = step.action || ''
            const refText = (step.regulation_ref && step.regulation_ref !== '알 수 없음') ? `\n[${step.regulation_ref}]` : ''
            const finalAction = actionText + refText
            slide.addText(finalAction, {
              x: cX + 0.06, y: cY + 0.28, w: CARD_W - 0.12, h: CARD_H - 0.48,
              fontSize: 8, bold: true, color: '1E293B',
              align: 'center', valign: 'top', fontFace: FONT, wrap: true,
            })

            // 업무 유형 레이블 (하단, 회색)
            const taskTypeName = { system: '시스템', approval: '수기', document: '문서작업', general: '일반업무' }[step.task_type] || ''
            if (taskTypeName) {
              slide.addText(taskTypeName, {
                x: cX + 0.04, y: cY + CARD_H - 0.18, w: CARD_W - 0.08, h: 0.16,
                fontSize: 5.5, color: '94A3B8', align: 'center', fontFace: FONT,
              })
            }
          }

          // 열 사이 화살표 (같은 레인, 다음 열로)
          if (colIdx < pageOrders.length - 1) {
            slide.addShape(pptx.ShapeType.line, {
              x: cX + CARD_W, y: lY + LANE_H / 2,
              w: STEP_W - CARD_W - CARD_MX, h: 0,
              line: { color: '6366F1', width: 1.5, endArrowhead: 'arrow' },
            })
          }
        })
      })

      // ── 범례 ──
      const legendY = startY + numLanes * LANE_H + 0.08
      if (legendY + 0.25 < SLIDE_H - M) {
        slide.addShape(pptx.ShapeType.roundRect, {
          x: M, y: legendY, w: 0.42, h: 0.22,
          fill: { color: '312E81' }, line: { color: '818CF8', width: 1 }, arcSize: 8,
        })
        slide.addText('일반 프로세스', {
          x: M + 0.48, y: legendY, w: 1.2, h: 0.22, fontSize: 8, color: 'CBD5E1', fontFace: FONT,
        })
        slide.addShape(pptx.ShapeType.roundRect, {
          x: M + 2.1, y: legendY, w: 0.42, h: 0.22,
          fill: { color: 'B45309' }, line: { color: 'FCD34D', width: 1 }, arcSize: 8,
        })
        slide.addText('의사결정 포인트', {
          x: M + 2.58, y: legendY, w: 1.3, h: 0.22, fontSize: 8, color: 'CBD5E1', fontFace: FONT,
        })
        if (totalPages > 1) {
          slide.addText(`${pageIdx + 1} / ${totalPages}`, {
            x: SLIDE_W - M - 0.8, y: legendY, w: 0.8, h: 0.22,
            fontSize: 8, color: '64748B', fontFace: FONT, align: 'right',
          })
        }
      }
    })

    const dateStr = new Date().toISOString().slice(0, 10)
    await pptx.writeFile({ fileName: filename || `swimlane_A3가로_${dateStr}.pptx` })
  } catch (err) {
    console.error('PPT 저장 실패:', err)
    alert('PPT 저장에 실패했습니다: ' + err.message)
  }
}

// DOM 요소를 html2canvas로 캡처 후 이미지 그대로 PPT 슬라이드에 삽입
export const downloadElementAsPPT = async (element, title = '', filename = 'diagram.pptx') => {
  try {
    if (!element) { alert('캡처할 요소를 찾을 수 없습니다'); return }

    const html2canvas = (await import('html2canvas')).default
    const pptxgen    = (await import('pptxgenjs')).default

    const canvas = await html2canvas(element, {
      backgroundColor: '#f8fafc',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const imgW    = canvas.width  / 2
    const imgH    = canvas.height / 2

    const pptx = new pptxgen()
    pptx.layout = 'LAYOUT_WIDE'
    pptx.title  = title || 'Diagram'

    const slide = pptx.addSlide()
    slide.background = { fill: '0A0F1E' }

    const M       = 0.2
    const TITLE_H = title ? 0.42 : 0
    const slideW  = 13.33 - M * 2
    const slideH  = 7.5  - M * 2 - TITLE_H

    if (title) {
      slide.addText(title, {
        x: M, y: M * 0.5, w: slideW, h: TITLE_H,
        fontSize: 16, bold: true, color: '93C5FD',
        fontFace: 'Malgun Gothic', align: 'left',
      })
    }

    const ratio = imgW / imgH
    let iW = slideW
    let iH = iW / ratio
    if (iH > slideH) { iH = slideH; iW = iH * ratio }
    const iX = M + (slideW - iW) / 2
    const iY = M + TITLE_H + (slideH - iH) / 2

    slide.addImage({ data: imgData, x: iX, y: iY, w: iW, h: iH })

    await pptx.writeFile({ fileName: filename })
  } catch (err) {
    console.error('이미지 PPT 저장 실패:', err)
    alert('이미지 PPT 저장에 실패했습니다: ' + err.message)
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

// A3 세로 스윔레인 PPT — 컬럼=역할, 행=단계(전역 order 기준), 페이지 초과시 다음 슬라이드로
export const downloadSwimlaneA3PPT = async (swimData, processName, filename) => {
  try {
    const pptxgen = (await import('pptxgenjs')).default
    const pptx = new pptxgen()

    // A3 Portrait (297mm × 420mm = 11.69" × 16.54")
    pptx.defineLayout({ name: 'A3_PORTRAIT', width: 11.69, height: 16.54 })
    pptx.layout = 'A3_PORTRAIT'
    pptx.title = processName || 'Swim Lane 다이어그램'

    // Layout constants (inches)
    const M = 0.25          // outer margin
    const TITLE_H = 0.42    // title bar
    const HDR_H = 0.52      // lane header height
    const STEP_H = 0.82     // step box height
    const STEP_GAP = 0.18   // gap between boxes
    const STEP_SLOT = STEP_H + STEP_GAP

    const SLIDE_W = 11.69
    const SLIDE_H = 16.54
    const laneAreaW = SLIDE_W - M * 2
    const contentY = M + TITLE_H + HDR_H
    const contentH = SLIDE_H - contentY - M
    const stepsPerSlide = Math.max(1, Math.floor(contentH / STEP_SLOT))

    const numLanes = swimData.length
    if (!numLanes) { alert('swim_lanes 데이터가 없습니다'); return }
    const laneW = laneAreaW / numLanes

    // { order: { laneIdx: step } }
    const rowMap = {}
    swimData.forEach((lane, li) => {
      ;(lane.steps || []).forEach(step => {
        const ord = step.order != null ? step.order : 9999
        if (!rowMap[ord]) rowMap[ord] = {}
        rowMap[ord][li] = step
      })
    })

    const sortedOrders = Object.keys(rowMap).map(Number).sort((a, b) => a - b)
    if (!sortedOrders.length) { alert('steps 데이터가 없습니다'); return }

    const pages = []
    for (let i = 0; i < sortedOrders.length; i += stepsPerSlide)
      pages.push(sortedOrders.slice(i, i + stepsPerSlide))

    const FONT = 'Malgun Gothic'
    const totalPages = pages.length

    // Lane alternate background colors
    const LANE_BG = ['F0F9FF', 'F5F3FF', 'F0FDF4', 'FFFBEB', 'FFF1F2', 'F8FAFC']

    pages.forEach((pageOrders, pageIdx) => {
      const slide = pptx.addSlide()
      slide.background = { fill: 'FFFFFF' }

      // ── Title bar ──
      const pageLabel = totalPages > 1 ? ` (${pageIdx + 1}/${totalPages})` : ''
      slide.addShape(pptx.ShapeType.rect, {
        x: M, y: M, w: laneAreaW, h: TITLE_H,
        fill: { color: '1D4ED8' }, line: { color: '1D4ED8', width: 0 },
      })
      slide.addText(`${processName || '업무 프로세스'}${pageLabel}`, {
        x: M, y: M, w: laneAreaW, h: TITLE_H,
        fontSize: 14, bold: true, color: 'FFFFFF',
        fontFace: FONT, align: 'center', valign: 'middle',
      })

      // ── Lane columns ──
      swimData.forEach((lane, li) => {
        const lx = M + li * laneW

        // Lane background (alternating)
        slide.addShape(pptx.ShapeType.rect, {
          x: lx, y: M + TITLE_H, w: laneW, h: SLIDE_H - TITLE_H - M * 2,
          fill: { color: LANE_BG[li % LANE_BG.length] },
          line: { color: 'transparent', width: 0 },
        })

        // Vertical separator (except leftmost)
        if (li > 0) {
          slide.addShape(pptx.ShapeType.line, {
            x: lx, y: M + TITLE_H, w: 0, h: SLIDE_H - TITLE_H - M * 2,
            line: { color: 'CBD5E1', width: 0.5, dashType: 'dash' },
          })
        }

        // Lane header box
        slide.addShape(pptx.ShapeType.rect, {
          x: lx, y: M + TITLE_H, w: laneW, h: HDR_H,
          fill: { color: 'DBEAFE' }, line: { color: '93C5FD', width: 0.5 },
        })
        const roleName = lane.role || `레인 ${li + 1}`
        const roleFontSize = Math.min(9, Math.max(6, Math.floor(72 / roleName.length)))
        slide.addText(roleName, {
          x: lx + 0.05, y: M + TITLE_H, w: laneW - 0.1, h: HDR_H,
          fontSize: roleFontSize, bold: true, color: '1E40AF',
          fontFace: FONT, align: 'center', valign: 'middle', wrap: true,
        })
      })

      // ── Step boxes ──
      pageOrders.forEach((order, rowIdx) => {
        const rowSteps = rowMap[order] || {}
        const sy = contentY + rowIdx * STEP_SLOT

        Object.entries(rowSteps).forEach(([liStr, step]) => {
          const li = parseInt(liStr, 10)
          const lx = M + li * laneW
          const isDecision = step.decision === true
          const action = step.action || step.step_name || ''
          const refText = (step.regulation_ref && step.regulation_ref !== '알 수 없음') ? `\n[${step.regulation_ref}]` : ''
          const finalAction = action + refText
          const systemUsed = step.system_used || null

          const pad = 0.1
          const bx = lx + pad
          const bw = laneW - pad * 2
          const bh = STEP_H

          if (isDecision) {
            // Decision point — diamond, amber palette (유지)
            slide.addShape(pptx.ShapeType.diamond, {
              x: bx, y: sy, w: bw, h: bh,
              fill: { color: 'FEF9C3' }, line: { color: 'F59E0B', width: 1.2 },
            })
            slide.addText(finalAction, {
              x: bx, y: sy, w: bw, h: bh,
              fontSize: 7, bold: true, color: '78350F',
              fontFace: FONT, align: 'center', valign: 'middle', wrap: true,
            })
          } else {
            // Regular task — 흰색 카드, 파란 테두리
            slide.addShape(pptx.ShapeType.roundRect, {
              x: bx, y: sy, w: bw, h: bh,
              fill: { color: 'FFFFFF' }, line: { color: '93C5FD', width: 0.8 },
              arcSize: 12,
            })

            // 번호 배지 (좌상단, 파란 사각형) — 자릿수에 따라 너비 동적 계산
            const numStr = String(order)
            const badgeW = Math.max(0.28, numStr.length * 0.10 + 0.10)
            const badgeH = 0.20
            const badgeX = bx + 0.05
            const badgeY = sy + 0.05
            slide.addShape(pptx.ShapeType.roundRect, {
              x: badgeX, y: badgeY, w: badgeW, h: badgeH,
              fill: { color: '2563EB' }, line: { color: '2563EB', width: 0 },
              arcSize: 15,
            })
            slide.addText(numStr, {
              x: badgeX, y: badgeY, w: badgeW, h: badgeH,
              fontSize: 6, bold: true, color: 'FFFFFF',
              fontFace: FONT, align: 'center', valign: 'middle',
            })

            // 시스템/유형 칩 (우상단)
            const typeLabel = { system: '시스템', approval: '수기', document: '문서', general: '일반' }[step.task_type] || ''
            const sysLabel = systemUsed || ''
            const chipText = [typeLabel, sysLabel].filter(Boolean).join('/')
            if (chipText) {
              const charW = /[^\x00-\x7F]/.test(chipText) ? 0.075 : 0.060
              const chipW = Math.max(0.40, chipText.length * charW + 0.10)
              const chipH = 0.16
              const chipX = bx + bw - chipW - 0.04
              const chipY = sy + 0.04
              const chipColor = sysLabel ? '059669' : '64748B'
              slide.addShape(pptx.ShapeType.roundRect, {
                x: chipX, y: chipY, w: chipW, h: chipH,
                fill: { color: chipColor }, line: { color: chipColor, width: 0 },
                arcSize: 50,
              })
              slide.addText(chipText, {
                x: chipX, y: chipY, w: chipW, h: chipH,
                fontSize: 5, bold: true, color: 'FFFFFF',
                fontFace: FONT, align: 'center', valign: 'middle',
              })
            }

            // 액션 텍스트 (배지 오른쪽, 진하고 어두운 색)
            const textStartX = badgeX + badgeW + 0.05
            slide.addText(finalAction, {
              x: textStartX, y: sy + 0.04, w: bw - (textStartX - bx) - 0.04, h: bh - 0.22,
              fontSize: 7.5, bold: true, color: '1E293B',
              fontFace: FONT, align: 'left', valign: 'middle', wrap: true,
            })

            // 업무 유형 레이블 (하단, 회색)
            const taskTypeName = { system: '시스템', approval: '수기', document: '문서작업', general: '일반업무' }[step.task_type] || ''
            if (taskTypeName) {
              slide.addText(taskTypeName, {
                x: bx + 0.05, y: sy + bh - 0.18, w: bw - 0.10, h: 0.16,
                fontSize: 5.5, color: '94A3B8',
                fontFace: FONT, align: 'right',
              })
            }
          }
        })
      })

      // ── Legend ──
      const legendY = SLIDE_H - M - 0.28
      slide.addShape(pptx.ShapeType.roundRect, {
        x: M, y: legendY, w: 0.38, h: 0.2,
        fill: { color: '2563EB' }, line: { color: '1D4ED8', width: 0 }, arcSize: 12,
      })
      slide.addText('일반 프로세스', {
        x: M + 0.44, y: legendY, w: 1.2, h: 0.2,
        fontSize: 7.5, color: '475569', fontFace: FONT,
      })
      slide.addShape(pptx.ShapeType.diamond, {
        x: M + 2.0, y: legendY, w: 0.38, h: 0.2,
        fill: { color: 'FEF9C3' }, line: { color: 'F59E0B', width: 1 },
      })
      slide.addText('의사결정 포인트', {
        x: M + 2.44, y: legendY, w: 1.3, h: 0.2,
        fontSize: 7.5, color: '475569', fontFace: FONT,
      })
      slide.addShape(pptx.ShapeType.roundRect, {
        x: M + 4.1, y: legendY, w: 0.32, h: 0.2,
        fill: { color: '059669' }, line: { color: '059669', width: 0 }, arcSize: 50,
      })
      slide.addText('null = 미사용 시스템', {
        x: M + 4.48, y: legendY, w: 1.6, h: 0.2,
        fontSize: 7.5, color: '475569', fontFace: FONT,
      })
      slide.addShape(pptx.ShapeType.roundRect, {
        x: M + 6.5, y: legendY, w: 0.32, h: 0.2,
        fill: { color: '7C3AED' }, line: { color: '7C3AED', width: 0 }, arcSize: 50,
      })
      slide.addText('시스템 사용', {
        x: M + 6.88, y: legendY, w: 1.2, h: 0.2,
        fontSize: 7.5, color: '475569', fontFace: FONT,
      })

      // Page number
      if (totalPages > 1) {
        slide.addText(`${pageIdx + 1} / ${totalPages}`, {
          x: laneAreaW - 0.5, y: legendY, w: 0.8, h: 0.2,
          fontSize: 8, color: '94A3B8', fontFace: FONT, align: 'right',
        })
      }
    })

    const dateStr = new Date().toISOString().slice(0, 10)
    await pptx.writeFile({ fileName: filename || `swimlane_A3세로_${dateStr}.pptx` })
  } catch (err) {
    console.error('A3 PPT 저장 실패:', err)
    alert('A3 세로 PPT 저장에 실패했습니다: ' + err.message)
  }
}