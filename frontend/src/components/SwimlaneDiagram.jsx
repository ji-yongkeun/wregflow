import { useMemo } from 'react'

export function SwimlaneDiagram({ data }) {
  const generateSwimlane = useMemo(() => {
    if (!data) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#cbd5e1',
          fontSize: '14px'
        }}>
          Swim Lane 데이터가 없습니다
        </div>
      )
    }

    // 데이터 파싱
    let swimData = data
    if (typeof data === 'string') {
      try {
        swimData = JSON.parse(data)
      } catch (e) {
        return (
          <div style={{
            padding: '2rem',
            color: '#ef4444'
          }}>
            데이터 파싱 오류: {e.message}
          </div>
        )
      }
    }

    if (!Array.isArray(swimData) || swimData.length === 0) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#cbd5e1'
        }}>
          역할 데이터가 없습니다
        </div>
      )
    }

    // 최대 단계 수 계산
    const maxSteps = Math.max(...swimData.map(item => item.steps?.length || 0))
    
    // SVG 크기 계산
    const laneHeight = 100
    const stepWidth = 120
    const headerWidth = 150
    const totalHeight = (swimData.length * laneHeight) + 100
    const totalWidth = headerWidth + (maxSteps * stepWidth) + 200
    const viewBox = `0 0 ${totalWidth} ${totalHeight}`

    // 색상 정의
    const colors = {
      lane1: '#e0e7ff',
      lane2: '#f3e8ff',
      lane3: '#dbeafe',
      lane4: '#fce7f3',
      lane5: '#fef3c7'
    }

    const getLaneColor = (idx) => {
      const colorList = Object.values(colors)
      return colorList[idx % colorList.length]
    }

    return (
      <svg viewBox={viewBox} xmlns="http://www.w3.org/2000/svg" style={{
        width: '100%',
        height: 'auto',
        minHeight: '400px',
        background: '#0f172a',
        borderRadius: '8px'
      }}>
        <defs>
          <style>{`
            .lane-header { fill: #1e293b; stroke: #4f46e5; stroke-width: 2; }
            .lane-header-text { fill: #93c5fd; font-size: 13px; font-weight: bold; text-anchor: middle; }
            .step-box { fill: #e0e7ff; stroke: #3730a3; stroke-width: 2; }
            .step-text { fill: #1e1b4b; font-size: 11px; text-anchor: middle; font-weight: 600; }
            .decision-box { fill: #fef08a; stroke: #b45309; stroke-width: 2; }
            .decision-text { fill: #78350f; font-size: 10px; text-anchor: middle; font-weight: bold; }
            .arrow { stroke: #3b82f6; stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
            .arrow-yes { stroke: #10b981; stroke-width: 2; fill: none; marker-end: url(#arrowhead-yes); }
            .lane-divider { stroke: #4f46e5; stroke-width: 1; stroke-dasharray: 3,3; opacity: 0.5; }
          `}</style>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
          </marker>
          <marker id="arrowhead-yes" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
          </marker>
        </defs>

        {/* Lane Headers */}
        {swimData.map((role, roleIdx) => (
          <g key={`header-${roleIdx}`}>
            <rect 
              x="10" 
              y={50 + roleIdx * laneHeight} 
              width={headerWidth - 20} 
              height={laneHeight - 10} 
              rx="4"
              className="lane-header"
            />
            <text 
              x={headerWidth / 2} 
              y={50 + roleIdx * laneHeight + laneHeight / 2 + 5}
              className="lane-header-text"
              dominantBaseline="middle"
            >
              {role.role}
            </text>
          </g>
        ))}

        {/* Lane Dividers */}
        {swimData.map((_, idx) => (
          <line
            key={`divider-${idx}`}
            x1={headerWidth}
            y1={50 + (idx + 1) * laneHeight}
            x2={totalWidth}
            y2={50 + (idx + 1) * laneHeight}
            className="lane-divider"
          />
        ))}

        {/* Steps and Decisions */}
        {swimData.map((role, roleIdx) => {
          const laneY = 50 + roleIdx * laneHeight
          let currentX = headerWidth + 20

          return (
            <g key={`role-${roleIdx}`}>
              {role.steps?.map((step, stepIdx) => {
                const stepY = laneY + laneHeight / 2 - 20
                const isDecision = step.decision === true

                let element = null

                if (isDecision) {
                  // 다이아몬드 모양 (의사결정)
                  const diamondSize = 30
                  const points = [
                    [currentX + diamondSize, stepY + 20],
                    [currentX + diamondSize * 2, stepY + 20 + diamondSize],
                    [currentX + diamondSize, stepY + 20 + diamondSize * 2],
                    [currentX, stepY + 20 + diamondSize]
                  ]

                  element = (
                    <g key={`step-${stepIdx}`}>
                      <polygon 
                        points={points.map(p => p.join(',')).join(' ')}
                        className="decision-box"
                      />
                      <text 
                        x={currentX + diamondSize} 
                        y={stepY + 20 + diamondSize}
                        className="decision-text"
                        dominantBaseline="middle"
                      >
                        의사
                      </text>
                    </g>
                  )

                  currentX += diamondSize * 2.5
                } else {
                  // 사각형 (일반 작업)
                  element = (
                    <g key={`step-${stepIdx}`}>
                      <rect 
                        x={currentX} 
                        y={stepY} 
                        width={100} 
                        height={40} 
                        rx="3"
                        className="step-box"
                      />
                      <text 
                        x={currentX + 50} 
                        y={stepY + 12}
                        className="step-text"
                        dominantBaseline="middle"
                      >
                        {step.action.slice(0, 15)}
                      </text>
                      <text 
                        x={currentX + 50} 
                        y={stepY + 28}
                        className="step-text"
                        dominantBaseline="middle"
                      >
                        (단계 {step.order})
                      </text>
                    </g>
                  )

                  currentX += 120
                }

                return element
              })}
            </g>
          )
        })}

        {/* 범례 */}
        <rect x="10" y={totalHeight - 60} width={totalWidth - 20} height="50" rx="4" 
          style={{ fill: 'rgba(79, 70, 229, 0.1)', stroke: '#4F46E5', strokeWidth: 1 }}
        />
        <text x="30" y={totalHeight - 35} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#93c5fd' }}>
          📌 범례:
        </text>
        <rect x="120" y={totalHeight - 45} width="50" height="20" rx="2" className="step-box"/>
        <text x="145" y={totalHeight - 30} className="step-text" style={{ fontSize: '10px' }}>작업</text>
        
        <polygon points={[[180, totalHeight - 35], [200, totalHeight - 25], [180, totalHeight - 15], [160, totalHeight - 25]].map(p => p.join(',')).join(' ')}
          className="decision-box"
        />
        <text x="180" y={totalHeight - 25} className="decision-text" style={{ fontSize: '10px' }}>의사</text>

        <text x="250" y={totalHeight - 30} style={{ fontSize: '11px', fill: '#cbd5e1' }}>
          • 각 역할별 단계 표시 | 의사결정 포인트는 다이아몬드로 표시
        </text>
      </svg>
    )
  }, [data])

  return (
    <div style={{
      width: '100%',
      overflow: 'auto',
      background: 'rgba(79, 70, 229, 0.02)',
      borderRadius: '8px',
      padding: '1rem'
    }}>
      {generateSwimlane}
    </div>
  )
}

export default SwimlaneDiagram
