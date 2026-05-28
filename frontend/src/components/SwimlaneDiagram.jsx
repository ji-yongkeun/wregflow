import { useState, useMemo } from 'react'

export function SwimlaneDiagram({ data, analysis, raci, decisions }) {
  const [selectedStep, setSelectedStep] = useState(null)

  // props 또는 analysis 객체로부터 데이터 추출 및 파싱
  const resolvedSwimData = useMemo(() => {
    const rawData = data || analysis?.swim_lanes;
    if (!rawData) return null;
    
    if (typeof rawData === 'string') {
      try {
        return JSON.parse(rawData);
      } catch (e) {
        console.error('Swimlane data parse error:', e);
        return null;
      }
    }
    return rawData;
  }, [data, analysis?.swim_lanes]);

  const resolvedRaci = useMemo(() => {
    const rawRaci = raci || analysis?.raci;
    if (!rawRaci) return [];
    if (typeof rawRaci === 'string') {
      try {
        return JSON.parse(rawRaci);
      } catch (e) {
        return [];
      }
    }
    return rawRaci;
  }, [raci, analysis?.raci]);

  const resolvedDecisions = useMemo(() => {
    const rawDecisions = decisions || analysis?.decisions;
    if (!rawDecisions) return [];
    if (typeof rawDecisions === 'string') {
      try {
        return JSON.parse(rawDecisions);
      } catch (e) {
        return [];
      }
    }
    return rawDecisions;
  }, [decisions, analysis?.decisions]);

  const handleCardClick = (step, roleName) => {
    const stepAction = (step.action || '').trim();
    
    // 1. RACI 매칭 찾기
    const matchedRaci = resolvedRaci.find(r => {
      const taskName = (r.task || '').trim();
      return taskName && (
        taskName === stepAction || 
        stepAction.includes(taskName) || 
        taskName.includes(stepAction)
      );
    });

    // 2. 의사결정 매칭 찾기
    const matchedDecision = resolvedDecisions.find(d => {
      const qText = (d.question || '').trim();
      return qText && (
        qText === stepAction || 
        stepAction.includes(qText) || 
        qText.includes(stepAction)
      );
    });

    setSelectedStep({
      ...step,
      role: roleName,
      matchedRaci,
      matchedDecision
    });
  };

  const generateSwimlane = useMemo(() => {
    const swimData = resolvedSwimData;
    if (!swimData || !Array.isArray(swimData) || swimData.length === 0) {
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

    // 최대 단계 수 계산
    let maxSteps = 1
    swimData.forEach(role => {
      role.steps?.forEach(step => {
        if (step.order && step.order > maxSteps) {
          maxSteps = step.order
        }
      })
    })

    // 레이아웃 치수 정의 (더 여유로운 크기로 조정)
    const laneHeight = 110
    const stepWidth = 200
    const headerWidth = 160
    const cardWidth = 145
    const cardHeight = 64
    const totalWidth = headerWidth + (maxSteps * stepWidth) + 120
    const totalHeight = (swimData.length * laneHeight)

    // 각 단계의 좌표 수집
    const stepPositions = {}
    swimData.forEach((role, roleIdx) => {
      const laneCenterY = roleIdx * laneHeight + (laneHeight / 2)
      
      role.steps?.forEach((step, stepIdx) => {
        const order = step.order || (stepIdx + 1)
        const stepX = (order - 1) * stepWidth
        
        const startX = stepX - 25 + cardWidth
        const startY = laneCenterY
        const endX = stepX - 25
        const endY = laneCenterY
        
        stepPositions[order] = {
          startX, startY, endX, endY,
          roleIdx
        }
      })
    })

    // 단계 간 화살표 생성 (SVG 오버레이용)
    const connectorPaths = []
    const orders = Object.keys(stepPositions).map(Number).sort((a, b) => a - b)
    for (let i = 0; i < orders.length - 1; i++) {
      const currentOrder = orders[i]
      const nextOrder = orders[i + 1]
      const p1 = stepPositions[currentOrder]
      const p2 = stepPositions[nextOrder]
      
      if (p1 && p2) {
        const midX = p1.startX + (p2.endX - p1.startX) / 2
        const pathD = `M ${p1.startX} ${p1.startY} L ${midX} ${p1.startY} L ${midX} ${p2.endY} L ${p2.endX} ${p2.endY}`
        connectorPaths.push(
          <path
            key={`connector-${currentOrder}-${nextOrder}`}
            d={pathD}
            style={{
              stroke: '#6366f1',
              strokeWidth: 2,
              fill: 'none',
              markerEnd: 'url(#arrowhead)'
            }}
          />
        )
      }
    }

    return (
      <div style={{
        position: 'relative',
        width: `${totalWidth}px`,
        height: `${totalHeight + 160}px`,
        background: '#0f172a',
        borderRadius: '12px',
        padding: '24px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        border: '1px solid rgba(99, 102, 241, 0.2)'
      }}>
        {/* CSS 스타일 주입 (호버 효과 및 애니메이션) */}
        <style>{`
          .swimlane-card {
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            user-select: none;
          }
          .swimlane-card:hover {
            transform: translateY(-50%) scale(1.04) !important;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4), 0 0 12px rgba(99, 102, 241, 0.4) !important;
            filter: brightness(1.1);
          }
          .swimlane-card.decision-card:hover {
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4), 0 0 12px rgba(245, 158, 11, 0.4) !important;
          }
          .dept-header-box {
            transition: all 0.3s ease;
          }
          .dept-header-box:hover {
            border-color: #818cf8 !important;
            background: #1e1b4b !important;
            box-shadow: 0 0 8px rgba(99, 102, 241, 0.2) !important;
          }
        `}</style>

        {/* 그리드 레이아웃 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `${headerWidth}px 1fr`,
          position: 'relative',
          width: '100%',
          height: `${totalHeight}px`
        }}>
          
          {/* 왼쪽: 부서 헤더 칼럼 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10
          }}>
            {swimData.map((role, roleIdx) => (
              <div 
                key={`header-${roleIdx}`}
                style={{
                  height: `${laneHeight}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5px 15px 5px 0',
                  boxSizing: 'border-box'
                }}
              >
                <div 
                  className="dept-header-box"
                  style={{
                    width: '100%',
                    height: '84px',
                    background: '#1e293b',
                    border: '1.5px solid #4f46e5',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#93c5fd',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    wordBreak: 'break-all',
                    padding: '8px',
                    boxSizing: 'border-box',
                    lineHeight: '1.4',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {role.role}
                </div>
              </div>
            ))}
          </div>

          {/* 오른쪽: 콘텐츠 칼럼 */}
          <div style={{
            position: 'relative',
            height: '100%'
          }}>
            {/* 가로 분리 점선 그리기 */}
            {swimData.map((_, idx) => (
              <div 
                key={`line-${idx}`}
                style={{
                  position: 'absolute',
                  top: `${(idx + 1) * laneHeight}px`,
                  left: 0,
                  right: 0,
                  borderBottom: '1.5px dashed rgba(99, 102, 241, 0.15)',
                  pointerEvents: 'none'
                }}
              />
            ))}

            {/* SVG 화살표 오버레이 */}
            <svg style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 2
            }}>
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="3.5" orient="auto">
                  <polygon points="0 0, 8 3.5, 0 7" fill="#6366f1" />
                </marker>
              </defs>
              {connectorPaths}
            </svg>

            {/* 카드 액션 박스 렌더링 (HTML) */}
            {swimData.map((role, roleIdx) => {
              const laneCenterY = roleIdx * laneHeight + (laneHeight / 2)
              
              return (
                <div key={`lane-cards-${roleIdx}`}>
                  {role.steps?.map((step, stepIdx) => {
                    const order = step.order || (stepIdx + 1)
                    const isDecision = step.decision === true
                    const stepX = (order - 1) * stepWidth
                    
                    if (isDecision) {
                      return (
                        <div 
                          key={`step-${stepIdx}`}
                          className="swimlane-card decision-card"
                          onClick={() => handleCardClick(step, role.role)}
                          style={{
                            position: 'absolute',
                            left: `${stepX - 25}px`,
                            top: `${laneCenterY}px`,
                            transform: 'translateY(-50%)',
                            width: `${cardWidth}px`,
                            height: `${cardHeight}px`,
                            background: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
                            border: '2px solid #d97706',
                            borderRadius: '8px',
                            padding: '6px 8px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 5,
                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)'
                          }}
                        >
                          <div style={{
                            color: '#b45309',
                            fontSize: '8.5px',
                            fontWeight: '800',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            marginBottom: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            ⚡ 의사결정
                          </div>
                          <div style={{
                            color: '#78350f',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            width: '100%',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: '1.2'
                          }} title={step.action}>
                            {step.action}
                          </div>
                        </div>
                      )
                    } else {
                      return (
                        <div 
                          key={`step-${stepIdx}`}
                          className="swimlane-card"
                          onClick={() => handleCardClick(step, role.role)}
                          style={{
                            position: 'absolute',
                            left: `${stepX - 25}px`,
                            top: `${laneCenterY}px`,
                            transform: 'translateY(-50%)',
                            width: `${cardWidth}px`,
                            height: `${cardHeight}px`,
                            background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                            border: '2px solid #4f46e5',
                            borderRadius: '8px',
                            padding: '6px 8px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 5,
                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)'
                          }}
                        >
                          <div style={{
                            color: '#3730a3',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            width: '100%',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: '1.2'
                          }} title={step.action}>
                            {step.action}
                          </div>
                          <div style={{
                            color: '#4f46e5',
                            fontSize: '9px',
                            marginTop: '4px',
                            fontWeight: 'bold'
                          }}>
                            단계 {order}
                          </div>
                        </div>
                      )
                    }
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* 범례 영역 */}
        <div style={{
          position: 'absolute',
          top: `${totalHeight + 80}px`,
          left: '24px',
          right: '24px',
          height: '55px',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          boxSizing: 'border-box',
          fontSize: '12px',
          color: '#cbd5e1'
        }}>
          <strong style={{ color: '#93c5fd', marginRight: '15px' }}>📌 안내:</strong>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginRight: '20px'
          }}>
            <div style={{
              width: '35px',
              height: '18px',
              background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
              border: '1.5px solid #4f46e5',
              borderRadius: '4px',
              marginRight: '6px'
            }} />
            <span>일반 프로세스 단계</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginRight: '20px'
          }}>
            <div style={{
              width: '35px',
              height: '18px',
              background: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
              border: '1.5px solid #d97706',
              borderRadius: '4px',
              marginRight: '6px'
            }} />
            <span>의사결정 프로세스 단계</span>
          </div>

          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            💡 각 프로세스 카드를 클릭하면 상세 설명, 관련 편, 산출물 및 RACI 등의 상세 정보를 확인할 수 있습니다.
          </span>
        </div>
      </div>
    )
  }, [resolvedSwimData])

  return (
    <div style={{
      width: 'max-content',
      minWidth: '100%',
      background: 'rgba(79, 70, 229, 0.02)',
      borderRadius: '8px',
      padding: '1rem',
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      {generateSwimlane}

      {/* 대화형 상세 정보 모달 */}
      {selectedStep && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          animation: 'fadeIn 0.25s ease-out'
        }} onClick={() => setSelectedStep(null)}>
          
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { transform: translateY(30px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            .modal-content-box {
              animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .modal-close-icon {
              transition: all 0.2s ease;
            }
            .modal-close-icon:hover {
              transform: rotate(90deg);
              color: #f43f5e !important;
            }
          `}</style>

          <div 
            className="modal-content-box"
            style={{
              background: '#1e293b',
              border: '1.5px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 24px rgba(99, 102, 241, 0.2)',
              overflow: 'hidden'
            }} onClick={(e) => e.stopPropagation()}>
            
            {/* 모달 헤더 */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              background: 'linear-gradient(to bottom, #1e293b, #0f172a)'
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    background: selectedStep.decision ? 'rgba(217, 119, 6, 0.2)' : 'rgba(79, 70, 229, 0.2)',
                    color: selectedStep.decision ? '#fbbf24' : '#818cf8',
                    border: selectedStep.decision ? '1px solid #d97706' : '1px solid #4f46e5',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '3px 8px',
                    borderRadius: '20px'
                  }}>
                    {selectedStep.decision ? '⚡ 의사결정' : '📋 일반 작업'}
                  </span>
                  <span style={{
                    background: 'rgba(148, 163, 184, 0.1)',
                    color: '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '3px 8px',
                    borderRadius: '20px'
                  }}>
                    단계 {selectedStep.order}
                  </span>
                </div>
                <h3 style={{
                  margin: 0,
                  color: '#f8fafc',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  lineHeight: '1.4'
                }}>
                  {selectedStep.action}
                </h3>
              </div>
              <button 
                className="modal-close-icon"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1
                }}
                onClick={() => setSelectedStep(null)}
              >
                ✕
              </button>
            </div>

            {/* 모달 본문 */}
            <div style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              color: '#cbd5e1',
              fontSize: '13.5px',
              lineHeight: '1.6'
            }}>
              {/* 담당 주체 */}
              <div>
                <strong style={{ color: '#93c5fd', display: 'block', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  👥 담당 부서/주체
                </strong>
                <div style={{ color: '#f1f5f9', fontWeight: 'bold' }}>{selectedStep.role || '미지정'}</div>
              </div>

              {/* RACI 역할 분담 (RACI 데이터 매칭이 있는 경우 표시) */}
              {selectedStep.matchedRaci && (
                <div>
                  <strong style={{ color: '#93c5fd', display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    👥 RACI 역할 분담
                  </strong>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    background: 'rgba(15, 23, 42, 0.3)',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    textAlign: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>R (수행)</div>
                      <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 'bold', marginTop: '4px' }}>{selectedStep.matchedRaci.responsible || '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>A (책임)</div>
                      <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 'bold', marginTop: '4px' }}>{selectedStep.matchedRaci.accountable || '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>C (합의)</div>
                      <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 'bold', marginTop: '4px' }}>{selectedStep.matchedRaci.consulted || '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>I (보고)</div>
                      <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 'bold', marginTop: '4px' }}>{selectedStep.matchedRaci.informed || '-'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 의사결정 분기 결과 (의사결정 매칭이 있는 경우 표시) */}
              {selectedStep.matchedDecision && (
                <div>
                  <strong style={{ color: '#93c5fd', display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🔀 의사결정 분기 결과
                  </strong>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    background: 'rgba(15, 23, 42, 0.3)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{
                        background: 'rgba(34, 197, 94, 0.2)',
                        color: '#4ade80',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        minWidth: '50px',
                        textAlign: 'center'
                      }}>Yes (✓)</span>
                      <span style={{ color: '#e2e8f0' }}>{selectedStep.matchedDecision.yes_outcome || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px' }}>
                      <span style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        minWidth: '50px',
                        textAlign: 'center'
                      }}>No (✗)</span>
                      <span style={{ color: '#e2e8f0' }}>{selectedStep.matchedDecision.no_outcome || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 상세 설명 (통합 분석이나 개별 분석 설명이 있는 경우 표시) */}
              {(selectedStep.description || !selectedStep.matchedRaci) && (
                <div>
                  <strong style={{ color: '#93c5fd', display: 'block', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    📝 상세 설명
                  </strong>
                  <div style={{ 
                    color: '#e2e8f0', 
                    background: 'rgba(15, 23, 42, 0.3)', 
                    padding: '12px 14px', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    whiteSpace: 'pre-line'
                  }}>
                    {selectedStep.description || '이 단계에 대한 추가 설명이 없습니다.'}
                  </div>
                </div>
              )}

              {/* 산출물 (출력 정보) */}
              {selectedStep.outputs && selectedStep.outputs.length > 0 && (
                <div>
                  <strong style={{ color: '#93c5fd', display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    📦 생성 산출물 (Outputs)
                  </strong>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    {selectedStep.outputs.map((out, idx) => (
                      <span 
                        key={idx}
                        style={{
                          background: 'rgba(34, 197, 94, 0.12)',
                          color: '#4ade80',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      >
                        📄 {out}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 관련 규정 편 */}
              {selectedStep.related_editions && selectedStep.related_editions.length > 0 && (
                <div>
                  <strong style={{ color: '#93c5fd', display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🔗 관련 규정 편(章)
                  </strong>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    {selectedStep.related_editions.map((ed, idx) => (
                      <span 
                        key={idx}
                        style={{
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#a5b4fc',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {ed}편
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div style={{
              padding: '16px 24px',
              background: '#0f172a',
              borderTop: '1px solid rgba(99, 102, 241, 0.15)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button 
                style={{
                  background: '#312e81',
                  color: '#e0e7ff',
                  border: '1px solid #4f46e5',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setSelectedStep(null)}
                onMouseEnter={(e) => {
                  e.target.style.background = '#3730a3';
                  e.target.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#312e81';
                  e.target.style.color = '#e0e7ff';
                }}
              >
                확인
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default SwimlaneDiagram
