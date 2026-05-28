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
        swimData = data
      }
    }

    // Swim Lane 구성 데이터 생성
    const lanes = [
      { id: 'customer', name: '고객', color: '#e8f0fe', textColor: '#1e3a8a' },
      { id: 'sales', name: '영업팀', color: '#f3e8ff', textColor: '#581c87' },
      { id: 'manager', name: '영업정장', color: '#dbeafe', textColor: '#0c4a6e' },
      { id: 'reviewer', name: '심사역/부장', color: '#fce7f3', textColor: '#831843' },
      { id: 'committee', name: '심사역협의회', color: '#fef3c7', textColor: '#78350f' },
      { id: 'system', name: '전산시스템', color: '#d1fae5', textColor: '#065f46' }
    ]

    const viewBox = '0 0 1600 800'
    const laneWidth = 260
    const laneHeight = 750
    const startX = 20
    const startY = 60

    return (
      <svg viewBox={viewBox} xmlns="http://www.w3.org/2000/svg" style={{
        width: '100%',
        height: 'auto',
        minHeight: '600px',
        background: '#0f172a',
        borderRadius: '8px'
      }}>
        <defs>
          <style>{`
            .lane-header { fill: #1e293b; stroke: #4f46e5; stroke-width: 2; }
            .lane-header-text { fill: #93c5fd; font-size: 12px; font-weight: bold; }
            .activity { fill: #e0e7ff; stroke: #3730a3; stroke-width: 2; border-radius: 4px; }
            .activity-text { fill: #1e1b4b; font-size: 11px; text-anchor: middle; font-weight: 600; }
            .decision { fill: #fef08a; stroke: #b45309; stroke-width: 2; }
            .decision-text { fill: #78350f; font-size: 10px; text-anchor: middle; font-weight: bold; }
            .system { fill: #c7d2fe; stroke: #4c1d95; stroke-width: 2; border-radius: 4px; }
            .system-text { fill: #2e1065; font-size: 10px; text-anchor: middle; font-weight: 600; }
            .arrow { stroke: #3b82f6; stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
            .arrow-yes { stroke: #10b981; stroke-width: 2; fill: none; marker-end: url(#arrowhead-yes); }
            .arrow-no { stroke: #ef4444; stroke-width: 2; fill: none; marker-end: url(#arrowhead-no); }
            .divider { stroke: #4f46e5; stroke-width: 1; stroke-dasharray: 3,3; opacity: 0.5; }
          `}</style>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
          </marker>
          <marker id="arrowhead-yes" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
          </marker>
          <marker id="arrowhead-no" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#ef4444" />
          </marker>
        </defs>

        {/* Lane Headers */}
        {lanes.map((lane, idx) => (
          <g key={`lane-${lane.id}`}>
            <rect 
              x={startX + idx * laneWidth} 
              y={startY} 
              width={laneWidth} 
              height={laneHeight} 
              className="lane-header"
            />
            <text 
              x={startX + idx * laneWidth + laneWidth / 2} 
              y={startY + laneHeight / 2}
              className="lane-header-text"
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(-90 ${startX + idx * laneWidth + laneWidth / 2} ${startY + laneHeight / 2})`}
            >
              {lane.name}
            </text>
          </g>
        ))}

        {/* Stage 1: 신청 (Y: 100) */}
        {/* 고객: 신청 */}
        <rect x="45" y="100" width="80" height="40" rx="3" className="activity"/>
        <text x="85" y="125" className="activity-text">신청</text>

        {/* 화살표 */}
        <path d="M 125 120 L 140 120" className="arrow"/>

        {/* 영업: 접수 */}
        <rect x="165" y="100" width="80" height="40" rx="3" className="activity"/>
        <text x="205" y="125" className="activity-text">접수</text>

        {/* 화살표 */}
        <path d="M 245 120 L 280 120" className="arrow"/>

        {/* 영업정장: 기초검증 */}
        <rect x="305" y="100" width="80" height="40" rx="3" className="activity"/>
        <text x="345" y="125" className="activity-text">기초검증</text>

        {/* 화살표 */}
        <path d="M 385 120 L 420 120" className="arrow"/>

        {/* Stage 2: 의사결정 - 기초검증 (Y: 100) */}
        <polygon points="500,100 540,120 500,140 460,120" className="decision"/>
        <text x="500" y="116" className="decision-text">기초</text>
        <text x="500" y="128" className="decision-text">통과?</text>

        {/* YES 경로 */}
        <path d="M 540 120 L 580 120" className="arrow-yes"/>
        <text x="555" y="115" style={{ fill: '#10b981', fontWeight: 'bold', fontSize: '10px' }}>YES</text>

        {/* NO 경로 - 거절 */}
        <path d="M 500 140 L 500 200" className="arrow-no"/>
        <text x="515" y="170" style={{ fill: '#ef4444', fontWeight: 'bold', fontSize: '10px' }}>NO</text>

        {/* Stage 3: 상세 심사 (Y: 180) */}
        {/* 영업: 신용조사 */}
        <rect x="165" y="180" width="80" height="40" rx="3" className="activity"/>
        <text x="205" y="205" className="activity-text">신용조사</text>

        {/* 화살표 */}
        <path d="M 245 200 L 280 200" className="arrow"/>

        {/* 영업정장: 재무분석 */}
        <rect x="305" y="180" width="80" height="40" rx="3" className="activity"/>
        <text x="345" y="205" className="activity-text">재무분석</text>

        {/* 화살표 */}
        <path d="M 385 200 L 420 200" className="arrow"/>

        {/* 심사역: 의견제시 */}
        <rect x="445" y="180" width="80" height="40" rx="3" className="activity"/>
        <text x="485" y="205" className="activity-text">의견제시</text>

        {/* 화살표 */}
        <path d="M 525 200 L 580 200" className="arrow"/>

        {/* Stage 4: 의사결정 - 심사 (Y: 180) */}
        <polygon points="650,180 690,200 650,220 610,200" className="decision"/>
        <text x="650" y="196" className="decision-text">심사</text>
        <text x="650" y="208" className="decision-text">승인?</text>

        {/* YES 경로 - 협의회 */}
        <path d="M 690 200 L 740 200" className="arrow-yes"/>
        <text x="710" y="195" style={{ fill: '#10b981', fontWeight: 'bold', fontSize: '10px' }}>YES</text>

        {/* NO 경로 */}
        <path d="M 650 220 L 650 280" className="arrow-no"/>
        <text x="665" y="250" style={{ fill: '#ef4444', fontWeight: 'bold', fontSize: '10px' }}>NO</text>

        {/* 협의회: 최종 협의 */}
        <polygon points="800,180 840,200 800,220 760,200" className="decision"/>
        <text x="800" y="196" className="decision-text">협의회</text>
        <text x="800" y="208" className="decision-text">승인?</text>

        {/* YES - 시스템 처리 */}
        <path d="M 840 200 L 900 200" className="arrow-yes"/>
        <text x="860" y="195" style={{ fill: '#10b981', fontWeight: 'bold', fontSize: '10px' }}>YES</text>

        {/* Stage 5: 시스템 처리 (Y: 180) */}
        {/* 여신도 확인 */}
        <rect x="900" y="180" width="70" height="40" rx="3" className="system"/>
        <text x="935" y="205" className="system-text">여신도</text>

        {/* 화살표 */}
        <path d="M 970 200 L 1000 200" className="arrow"/>

        {/* 기한연장 */}
        <rect x="1000" y="180" width="70" height="40" rx="3" className="system"/>
        <text x="1035" y="205" className="system-text">기한연장</text>

        {/* 화살표 */}
        <path d="M 1070 200 L 1100 200" className="arrow"/>

        {/* 이수관 처리 */}
        <rect x="1100" y="180" width="70" height="40" rx="3" className="system"/>
        <text x="1135" y="205" className="system-text">이수관</text>

        {/* 화살표 */}
        <path d="M 1170 200 L 1200 200" className="arrow"/>

        {/* 자동정산 */}
        <rect x="1200" y="180" width="70" height="40" rx="3" className="system"/>
        <text x="1235" y="205" className="system-text">자동정산</text>

        {/* Stage 6: 거절 경로 (Y: 280) */}
        {/* 고객 통지 */}
        <rect x="45" y="280" width="80" height="40" rx="3" 
          style={{ fill: '#fee2e2', stroke: '#dc2626', strokeWidth: 2 }}
        />
        <text x="85" y="305" style={{ fill: '#7f1d1d', fontSize: '11px', textAnchor: 'middle', fontWeight: 600 }}>
          거절통지
        </text>

        {/* 화살표 */}
        <path d="M 125 300 L 900 300" className="arrow-no"/>

        {/* 시스템: 거절기록 */}
        <rect x="900" y="280" width="70" height="40" rx="3"
          style={{ fill: '#fee2e2', stroke: '#dc2626', strokeWidth: 2 }}
        />
        <text x="935" y="305" style={{ fill: '#7f1d1d', fontSize: '11px', textAnchor: 'middle', fontWeight: 600 }}>
          거절기록
        </text>

        {/* 범례 */}
        <rect x="35" y="700" width="1520" height="60" rx="4" 
          style={{ fill: 'rgba(79, 70, 229, 0.1)', stroke: '#4F46E5', strokeWidth: 1 }}
        />
        <text x="50" y="720" style={{ fontSize: '12px', fontWeight: 'bold', fill: '#93c5fd' }}>
          📌 요소: 
        </text>
        <rect x="140" y="710" width="50" height="18" rx="2" className="activity"/>
        <text x="165" y="723" className="activity-text" style={{ fontSize: '10px' }}>활동</text>

        <polygon points="230,710 245,719 230,728 215,719" className="decision"/>
        <text x="230" y="722" className="decision-text" style={{ fontSize: '10px' }}>의사</text>

        <rect x="310" y="710" width="50" height="18" rx="2" className="system"/>
        <text x="335" y="723" className="system-text" style={{ fontSize: '10px' }}>시스템</text>

        <text x="430" y="720" style={{ fontSize: '11px', fill: '#cbd5e1' }}>
          부서별 책임 명확화 | 의사결정 포인트로 분기 표시 | YES/NO 경로 분리 | 거절 경로 표현
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
