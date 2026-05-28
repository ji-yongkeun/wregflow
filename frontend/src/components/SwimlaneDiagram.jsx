import { useState, useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  MarkerType,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

const LANE_HEIGHT = 150
const STEP_WIDTH = 240
const HEADER_WIDTH = 185
const NODE_WIDTH = 170
const NODE_HEIGHT = 88

// ── Lane background node ──────────────────────────────────────────────────────
function LaneGroupNode({ data }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: data.isEven
        ? 'rgba(30, 41, 59, 0.55)'
        : 'rgba(15, 23, 42, 0.55)',
      borderBottom: '1px dashed rgba(99, 102, 241, 0.2)',
      position: 'relative',
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: `${HEADER_WIDTH - 16}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 10px',
        boxSizing: 'border-box',
        borderRight: '1px solid rgba(99, 102, 241, 0.25)',
      }}>
        <div style={{
          background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
          border: '1.5px solid rgba(79, 70, 229, 0.9)',
          borderRadius: '10px',
          padding: '10px 8px',
          color: '#93c5fd',
          fontSize: '12px',
          fontWeight: '700',
          textAlign: 'center',
          wordBreak: 'break-all',
          lineHeight: '1.5',
          width: '100%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
          letterSpacing: '0.2px',
        }}>
          {data.role}
        </div>
      </div>
    </div>
  )
}

// ── Process step node ─────────────────────────────────────────────────────────
function ProcessNode({ data, selected }) {
  return (
    <div style={{
      width: `${NODE_WIDTH}px`,
      minHeight: `${NODE_HEIGHT}px`,
      background: selected
        ? 'linear-gradient(135deg, rgba(99,102,241,0.4) 0%, rgba(79,70,229,0.55) 100%)'
        : 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(79,70,229,0.32) 100%)',
      border: `2px solid ${selected ? '#a5b4fc' : 'rgba(79,70,229,0.9)'}`,
      borderRadius: '14px',
      padding: '10px 12px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(12px)',
      boxShadow: selected
        ? '0 0 30px rgba(99,102,241,0.65), 0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)'
        : '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
    }}>
      <Handle type="target" position={Position.Left}
        style={{ background: '#4f46e5', border: '2px solid #818cf8', width: '10px', height: '10px' }} />
      <div style={{
        background: 'rgba(99,102,241,0.3)',
        border: '1px solid rgba(99,102,241,0.5)',
        color: '#a5b4fc',
        fontSize: '10px',
        fontWeight: '800',
        padding: '2px 10px',
        borderRadius: '20px',
        marginBottom: '7px',
        letterSpacing: '1px',
      }}>
        STEP {data.order}
      </div>
      <div style={{
        color: '#e0e7ff',
        fontSize: '12px',
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: '1.5',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {data.action}
      </div>
      <Handle type="source" position={Position.Right}
        style={{ background: '#4f46e5', border: '2px solid #818cf8', width: '10px', height: '10px' }} />
    </div>
  )
}

// ── Decision node ─────────────────────────────────────────────────────────────
function DecisionNode({ data, selected }) {
  return (
    <div style={{ width: `${NODE_WIDTH}px`, minHeight: `${NODE_HEIGHT}px`, position: 'relative' }}>
      <Handle type="target" position={Position.Left}
        style={{ background: '#d97706', border: '2px solid #fbbf24', width: '10px', height: '10px', zIndex: 10 }} />
      {/* Rotated shadow layer */}
      <div style={{
        position: 'absolute',
        inset: '5px',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.25) 100%)',
        border: `1.5px solid ${selected ? '#fbbf24' : 'rgba(217,119,6,0.6)'}`,
        borderRadius: '10px',
        transform: 'rotate(-4deg)',
        transition: 'all 0.2s ease',
      }} />
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '100%',
        background: selected
          ? 'linear-gradient(135deg, rgba(254,240,138,0.22) 0%, rgba(253,224,71,0.3) 100%)'
          : 'linear-gradient(135deg, rgba(254,240,138,0.09) 0%, rgba(253,224,71,0.15) 100%)',
        border: `2px solid ${selected ? '#fbbf24' : 'rgba(217,119,6,0.85)'}`,
        borderRadius: '14px',
        padding: '10px 12px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(12px)',
        boxShadow: selected
          ? '0 0 30px rgba(245,158,11,0.65), 0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)'
          : '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        cursor: 'pointer',
      }}>
        <div style={{ color: '#fbbf24', fontSize: '10px', fontWeight: '800', marginBottom: '6px', letterSpacing: '0.5px' }}>
          ⚡ 의사결정
        </div>
        <div style={{
          color: '#fef3c7',
          fontSize: '12px',
          fontWeight: '600',
          textAlign: 'center',
          lineHeight: '1.5',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {data.action}
        </div>
      </div>
      <Handle type="source" position={Position.Right}
        style={{ background: '#d97706', border: '2px solid #fbbf24', width: '10px', height: '10px', zIndex: 10 }} />
    </div>
  )
}

const nodeTypes = {
  laneGroup: LaneGroupNode,
  processNode: ProcessNode,
  decisionNode: DecisionNode,
}

// ── Graph builder ─────────────────────────────────────────────────────────────
// 데이터 감지:
//   · 전체 step의 order가 모두 고유 → Global 순서 (레인 간 연결, 전체 흐름)
//   · 레인마다 order가 중복       → Local  순서 (레인 내부만 연결)
function buildFlowGraph(swimData) {
  const allOrders = swimData.flatMap(l => (l.steps || []).map(s => s.order || 0)).filter(o => o > 0)
  const isGlobal  = new Set(allOrders).size === allOrders.length

  let maxOrder = 1
  allOrders.forEach(o => { if (o > maxOrder) maxOrder = o })

  const totalWidth  = HEADER_WIDTH + maxOrder * STEP_WIDTH + 80
  const totalHeight = swimData.length * LANE_HEIGHT
  const nodes = []
  const edges = []

  // ── Lane 배경 노드 ────────────────────────────────────────────────────────
  swimData.forEach((lane, li) => {
    nodes.push({
      id: `lane-${li}`,
      type: 'laneGroup',
      position: { x: 0, y: li * LANE_HEIGHT },
      style: { width: totalWidth, height: LANE_HEIGHT },
      data: { role: lane.role, isEven: li % 2 === 0 },
      selectable: false, draggable: false, focusable: false, zIndex: 0,
    })
  })

  if (isGlobal) {
    // ── Global: 전체 order로 배치 + 레인 간 연결 ─────────────────────────
    const allSteps = []
    swimData.forEach((lane, li) =>
      (lane.steps || []).forEach((step, si) =>
        allSteps.push({ ...step, laneIdx: li, role: lane.role, order: step.order || si + 1 })
      )
    )
    allSteps.sort((a, b) => a.order - b.order)

    allSteps.forEach(step => {
      const x = HEADER_WIDTH + (step.order - 1) * STEP_WIDTH + (STEP_WIDTH - NODE_WIDTH) / 2
      const y = step.laneIdx * LANE_HEIGHT + (LANE_HEIGHT - NODE_HEIGHT) / 2
      nodes.push({
        id: `step-${step.order}`,
        type: step.decision ? 'decisionNode' : 'processNode',
        position: { x, y },
        data: step,
        draggable: false, zIndex: 10,
      })
    })

    for (let i = 0; i < allSteps.length - 1; i++) {
      const curr = allSteps[i], next = allSteps[i + 1]
      const cross = curr.laneIdx !== next.laneIdx
      edges.push({
        id: `edge-${curr.order}-${next.order}`,
        source: `step-${curr.order}`,
        target: `step-${next.order}`,
        type: 'smoothstep',
        animated: cross,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: cross ? '#818cf8' : '#6366f1',
          width: 16, height: 16,
        },
        style: {
          stroke: cross ? '#818cf8' : '#6366f1',
          strokeWidth: 2.5,
          filter: cross ? 'drop-shadow(0 0 4px rgba(99,102,241,0.5))' : undefined,
        },
      })
    }
  } else {
    // ── Local: 레인별 독립 배치 + 레인 내부 연결만 ───────────────────────
    swimData.forEach((lane, li) => {
      const sorted = [...(lane.steps || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
      sorted.forEach((step, si) => {
        const lo = step.order || si + 1
        const nodeId = `step-l${li}-o${lo}`
        const x = HEADER_WIDTH + (lo - 1) * STEP_WIDTH + (STEP_WIDTH - NODE_WIDTH) / 2
        const y = li * LANE_HEIGHT + (LANE_HEIGHT - NODE_HEIGHT) / 2
        nodes.push({
          id: nodeId,
          type: step.decision ? 'decisionNode' : 'processNode',
          position: { x, y },
          data: { ...step, laneIdx: li, role: lane.role },
          draggable: false, zIndex: 10,
        })
        if (si > 0) {
          const prevOrder = sorted[si - 1].order || si
          edges.push({
            id: `edge-l${li}-${prevOrder}-${lo}`,
            source: `step-l${li}-o${prevOrder}`,
            target: nodeId,
            type: 'smoothstep',
            animated: false,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1', width: 16, height: 16 },
            style: { stroke: '#6366f1', strokeWidth: 2.5 },
          })
        }
      })
    })
  }

  return { nodes, edges, totalWidth, totalHeight }
}

// ── Field display helpers ─────────────────────────────────────────────────────
const FIELD_META = {
  description:      { icon: '📝', label: '상세 설명' },
  inputs:           { icon: '📥', label: '입력 자료' },
  outputs:          { icon: '📦', label: '생성 산출물' },
  related_editions: { icon: '🔗', label: '관련 규정 편' },
  tools:            { icon: '🛠️', label: '사용 도구/시스템' },
  systems:          { icon: '💻', label: '관련 시스템' },
  regulations:      { icon: '📋', label: '관련 규정' },
  notes:            { icon: '📌', label: '참고 사항' },
  conditions:       { icon: '🔍', label: '조건/요건' },
  duration:         { icon: '⏱️', label: '처리 기간' },
  department:       { icon: '🏢', label: '부서' },
  approver:         { icon: '✅', label: '승인자' },
  exceptions:       { icon: '⚠️', label: '예외 사항' },
  references:       { icon: '📎', label: '참조 문서' },
}

// 내부 관리용 키 - 화면에 표시하지 않음
const INTERNAL_KEYS = new Set([
  'action', 'order', 'decision', 'role', 'laneIdx',
  'matchedRaci', 'matchedDecision',
])

function renderFieldValue(value) {
  if (value === null || value === undefined) return null

  // 배열
  if (Array.isArray(value)) {
    if (value.length === 0) return null
    // 배열 원소가 객체인 경우
    if (typeof value[0] === 'object') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {value.map((item, idx) => (
            <pre key={idx} style={{
              margin: 0, padding: '10px 12px',
              background: 'rgba(15,23,42,0.5)', borderRadius: '8px',
              border: '1px solid rgba(148,163,184,0.1)',
              color: '#e2e8f0', fontSize: '12px', lineHeight: '1.6',
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              {JSON.stringify(item, null, 2)}
            </pre>
          ))}
        </div>
      )
    }
    // 배열 원소가 문자열/숫자인 경우
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {value.map((v, idx) => (
          <span key={idx} style={{
            background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
            border: '1px solid rgba(99,102,241,0.3)',
            padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
          }}>{String(v)}</span>
        ))}
      </div>
    )
  }

  // 객체
  if (typeof value === 'object') {
    return (
      <pre style={{
        margin: 0, padding: '10px 12px',
        background: 'rgba(15,23,42,0.5)', borderRadius: '8px',
        border: '1px solid rgba(148,163,184,0.1)',
        color: '#e2e8f0', fontSize: '12px', lineHeight: '1.6',
        whiteSpace: 'pre-wrap', wordBreak: 'break-all',
      }}>
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }

  // boolean
  if (typeof value === 'boolean') {
    return (
      <span style={{
        background: value ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
        color: value ? '#4ade80' : '#f87171',
        border: `1px solid ${value ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
        padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
      }}>
        {value ? 'True' : 'False'}
      </span>
    )
  }

  // 문자열 / 숫자
  return (
    <div style={{
      color: '#e2e8f0', background: 'rgba(15,23,42,0.4)',
      padding: '10px 14px', borderRadius: '10px',
      border: '1px solid rgba(148,163,184,0.1)', whiteSpace: 'pre-line',
      fontSize: '13px', lineHeight: '1.7',
    }}>
      {String(value)}
    </div>
  )
}

function FieldSection({ fieldKey, value }) {
  const rendered = renderFieldValue(value)
  if (rendered === null) return null
  const meta = FIELD_META[fieldKey]
  const icon = meta?.icon ?? '📌'
  const label = meta?.label ?? fieldKey
  return (
    <div>
      <strong style={{
        color: '#93c5fd', display: 'block', marginBottom: '7px',
        fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px',
      }}>
        {icon} {label}
      </strong>
      {rendered}
    </div>
  )
}

// ── Detail modal ──────────────────────────────────────────────────────────────
function StepDetailModal({ step, onClose }) {
  // 미리 정해진 표시 순서: 알려진 필드 먼저, 나머지는 이후
  const ORDERED_KNOWN_KEYS = [
    'description', 'inputs', 'outputs', 'related_editions',
    'tools', 'systems', 'regulations', 'notes', 'conditions',
    'duration', 'approver', 'exceptions', 'references', 'department',
  ]

  // step 객체에서 표시할 키 목록 (INTERNAL_KEYS 제외)
  const allDisplayKeys = Object.keys(step).filter(k => !INTERNAL_KEYS.has(k))
  const knownOrdered = ORDERED_KNOWN_KEYS.filter(k => allDisplayKeys.includes(k))
  const extraKeys = allDisplayKeys.filter(k => !ORDERED_KNOWN_KEYS.includes(k))

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15, 23, 42, 0.82)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px',
    }} onClick={onClose}>
      <style>{`
        @keyframes rfSlideUp {
          from { transform: translateY(28px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .rf-modal { animation: rfSlideUp 0.28s cubic-bezier(0.16,1,0.3,1); }
        .rf-modal-close { transition: all 0.2s ease; }
        .rf-modal-close:hover { transform: rotate(90deg); color: #f43f5e !important; }
        .rf-modal-body::-webkit-scrollbar { width: 5px; }
        .rf-modal-body::-webkit-scrollbar-track { background: rgba(15,23,42,0.3); border-radius: 3px; }
        .rf-modal-body::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.5); border-radius: 3px; }
      `}</style>

      <div
        className="rf-modal"
        style={{
          background: '#1e293b',
          border: '1.5px solid rgba(99,102,241,0.4)',
          borderRadius: '18px',
          width: '100%', maxWidth: '580px',
          boxShadow: '0 30px 60px -12px rgba(0,0,0,0.6), 0 0 28px rgba(99,102,241,0.2)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          maxHeight: '88vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(99,102,241,0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          background: 'linear-gradient(to bottom, #1e293b, #0f172a)',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, marginRight: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span style={{
                background: step.decision ? 'rgba(217,119,6,0.2)' : 'rgba(79,70,229,0.2)',
                color: step.decision ? '#fbbf24' : '#818cf8',
                border: `1px solid ${step.decision ? '#d97706' : '#4f46e5'}`,
                fontSize: '11px', fontWeight: 'bold',
                padding: '3px 10px', borderRadius: '20px',
              }}>
                {step.decision ? '⚡ 의사결정' : '📋 일반 작업'}
              </span>
              <span style={{
                background: 'rgba(148,163,184,0.1)', color: '#94a3b8',
                fontSize: '11px', fontWeight: 'bold',
                padding: '3px 10px', borderRadius: '20px',
              }}>
                STEP {step.order}
              </span>
            </div>
            {/* 전체 action 텍스트 — 잘림 없음 */}
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '17px', fontWeight: '700', lineHeight: '1.5' }}>
              {step.action}
            </h3>
          </div>
          <button
            className="rf-modal-close"
            style={{
              background: 'none', border: 'none', color: '#94a3b8',
              fontSize: '22px', cursor: 'pointer', padding: '4px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
            }}
            onClick={onClose}
          >✕</button>
        </div>

        {/* ── Body (스크롤 가능, 모든 내용 표시) ── */}
        <div
          className="rf-modal-body"
          style={{
            padding: '20px 24px',
            display: 'flex', flexDirection: 'column', gap: '18px',
            color: '#cbd5e1', fontSize: '13.5px', lineHeight: '1.6',
            overflowY: 'auto', flex: 1,
          }}
        >
          {/* 담당 부서 */}
          <div>
            <strong style={{ color: '#93c5fd', display: 'block', marginBottom: '5px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              👥 담당 부서/주체
            </strong>
            <div style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '14px' }}>{step.role || '미지정'}</div>
          </div>

          {/* 알려진 step 필드들 (순서대로) */}
          {knownOrdered.map(key => (
            <FieldSection key={key} fieldKey={key} value={step[key]} />
          ))}

          {/* 알 수 없는 추가 필드들 (JSON에 있지만 미리 정의되지 않은 것) */}
          {extraKeys.map(key => (
            <FieldSection key={key} fieldKey={key} value={step[key]} />
          ))}

          {/* ── 구분선 ── */}
          {(step.matchedRaci || step.matchedDecision) && (
            <div style={{ borderTop: '1px dashed rgba(99,102,241,0.25)', paddingTop: '4px' }} />
          )}

          {/* RACI — 매칭된 전체 레코드 표시 */}
          {step.matchedRaci && (
            <div>
              <strong style={{ color: '#93c5fd', display: 'block', marginBottom: '10px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                👥 RACI 역할 분담
              </strong>
              <div style={{
                background: 'rgba(15,23,42,0.4)', padding: '14px', borderRadius: '10px',
                border: '1px solid rgba(148,163,184,0.12)',
                display: 'flex', flexDirection: 'column', gap: '10px',
              }}>
                {/* R/A/C/I 그리드 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', textAlign: 'center' }}>
                  {[
                    { key: 'responsible', label: 'R (수행)' },
                    { key: 'accountable', label: 'A (책임)' },
                    { key: 'consulted',   label: 'C (합의)' },
                    { key: 'informed',    label: 'I (보고)' },
                  ].map(({ key, label }) => (
                    <div key={key} style={{
                      background: 'rgba(99,102,241,0.1)', borderRadius: '8px', padding: '8px 6px',
                      border: '1px solid rgba(99,102,241,0.2)',
                    }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '5px' }}>{label}</div>
                      <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: '700' }}>{step.matchedRaci[key] || '-'}</div>
                    </div>
                  ))}
                </div>
                {/* RACI 레코드에 추가 필드가 있으면 모두 표시 */}
                {Object.entries(step.matchedRaci)
                  .filter(([k]) => !['task','responsible','accountable','consulted','informed'].includes(k))
                  .map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                      <span style={{ color: '#64748b', minWidth: '80px', fontWeight: '600' }}>{k}</span>
                      <span style={{ color: '#e2e8f0' }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* 의사결정 — 매칭된 전체 레코드 표시 */}
          {step.matchedDecision && (
            <div>
              <strong style={{ color: '#93c5fd', display: 'block', marginBottom: '10px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                🔀 의사결정 분기
              </strong>
              <div style={{
                background: 'rgba(15,23,42,0.4)', padding: '14px', borderRadius: '10px',
                border: '1px solid rgba(148,163,184,0.12)',
                display: 'flex', flexDirection: 'column', gap: '10px',
              }}>
                {/* 질문 */}
                {step.matchedDecision.question && (
                  <div style={{ fontSize: '13px', color: '#fbbf24', fontWeight: '600', paddingBottom: '8px', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
                    Q. {step.matchedDecision.question}
                  </div>
                )}
                {/* Yes / No 결과 */}
                {['yes_outcome', 'no_outcome'].map(key => {
                  const isYes = key === 'yes_outcome'
                  const val = step.matchedDecision[key]
                  if (!val) return null
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{
                        background: isYes ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                        color: isYes ? '#4ade80' : '#f87171',
                        fontSize: '11px', fontWeight: 'bold',
                        padding: '3px 10px', borderRadius: '4px', minWidth: '56px', textAlign: 'center', flexShrink: 0,
                      }}>{isYes ? 'Yes (✓)' : 'No  (✗)'}</span>
                      <span style={{ color: '#e2e8f0', fontSize: '13px', lineHeight: '1.6' }}>{val}</span>
                    </div>
                  )
                })}
                {/* decisions 레코드의 추가 필드 */}
                {Object.entries(step.matchedDecision)
                  .filter(([k]) => !['id','question','yes_outcome','no_outcome'].includes(k))
                  .map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                      <span style={{ color: '#64748b', minWidth: '80px', fontWeight: '600' }}>{k}</span>
                      <span style={{ color: '#e2e8f0' }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '14px 24px', background: '#0f172a',
          borderTop: '1px solid rgba(99,102,241,0.15)',
          display: 'flex', justifyContent: 'flex-end', flexShrink: 0,
        }}>
          <button
            style={{
              background: 'linear-gradient(135deg, #312e81, #1e1b4b)',
              color: '#e0e7ff', border: '1px solid #4f46e5',
              padding: '8px 20px', borderRadius: '8px',
              fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
              transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            }}
            onClick={onClose}
            onMouseEnter={e => { e.target.style.background = '#3730a3'; e.target.style.color = '#fff' }}
            onMouseLeave={e => { e.target.style.background = 'linear-gradient(135deg, #312e81, #1e1b4b)'; e.target.style.color = '#e0e7ff' }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Inner diagram (needs ReactFlowProvider context) ───────────────────────────
function SwimlaneDiagramInner({ swimData, raciData, decisionsData }) {
  const [selectedStep, setSelectedStep] = useState(null)

  const { nodes: initNodes, edges: initEdges, totalHeight } = useMemo(
    () => buildFlowGraph(swimData),
    [swimData]
  )

  const [nodes, , onNodesChange] = useNodesState(initNodes)
  const [edges, , onEdgesChange] = useEdgesState(initEdges)

  const onNodeClick = useCallback((_, node) => {
    if (!node.data?.action) return
    const step = node.data
    const stepAction = (step.action || '').trim()

    const matchedRaci = raciData?.find(r => {
      const t = (r.task || '').trim()
      return t && (t === stepAction || stepAction.includes(t) || t.includes(stepAction))
    })
    const matchedDecision = decisionsData?.find(d => {
      const q = (d.question || '').trim()
      return q && (q === stepAction || stepAction.includes(q) || q.includes(stepAction))
    })

    setSelectedStep({ ...step, matchedRaci, matchedDecision })
  }, [raciData, decisionsData])

  const flowHeight = Math.max(totalHeight + 60, 280)

  return (
    <div style={{ width: '100%' }}>
      {/* React Flow canvas */}
      <div style={{ width: '100%', height: `${flowHeight}px`, borderRadius: '14px', overflow: 'hidden' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.06, maxZoom: 1.1 }}
          panOnDrag
          zoomOnScroll
          minZoom={0.25}
          maxZoom={2.5}
          style={{ background: '#0a0f1e' }}
          deleteKeyCode={null}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={28}
            size={1.2}
            color="rgba(99,102,241,0.18)"
          />
          <Controls
            style={{
              background: 'rgba(30,41,59,0.95)',
              border: '1px solid rgba(99,102,241,0.35)',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          />
          <MiniMap
            position="bottom-left"
            style={{
              background: 'rgba(10,15,30,0.95)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '10px',
            }}
            nodeColor={n => {
              if (n.type === 'laneGroup') return 'rgba(30,41,59,0.9)'
              if (n.type === 'decisionNode') return '#d97706'
              return '#4f46e5'
            }}
            maskColor="rgba(10,15,30,0.5)"
          />
          <Panel position="top-left" style={{ margin: '10px' }}>
            <div style={{
              background: 'rgba(10,15,30,0.85)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '8px',
              padding: '5px 12px',
              fontSize: '11px',
              color: '#94a3b8',
              backdropFilter: 'blur(8px)',
              pointerEvents: 'none',
            }}>
              <span style={{ color: '#818cf8' }}>💡</span> 카드 클릭 → 상세 정보 &nbsp;·&nbsp; 스크롤 → 확대/축소 &nbsp;·&nbsp; 드래그 → 이동
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '10px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px',
        padding: '10px 18px',
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: '10px',
        fontSize: '12px', color: '#cbd5e1',
      }}>
        <span style={{ color: '#93c5fd', fontWeight: '700' }}>📌 범례</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{
            width: '34px', height: '16px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(79,70,229,0.48))',
            border: '2px solid #4f46e5', borderRadius: '4px',
          }} />
          <span>일반 프로세스</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{
            width: '34px', height: '16px',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.22), rgba(217,119,6,0.35))',
            border: '2px solid #d97706', borderRadius: '4px',
          }} />
          <span>의사결정 포인트</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{
            width: '30px', height: '2.5px', background: '#818cf8', position: 'relative',
            display: 'flex', alignItems: 'center',
          }}>
            <div style={{
              position: 'absolute', right: '-5px',
              borderLeft: '7px solid #818cf8',
              borderTop: '4px solid transparent', borderBottom: '4px solid transparent',
            }} />
          </div>
          <span>레인 간 연결 (애니메이션)</span>
        </div>
      </div>

      {/* Step detail modal */}
      {selectedStep && (
        <StepDetailModal step={selectedStep} onClose={() => setSelectedStep(null)} />
      )}
    </div>
  )
}

// ── Public component ──────────────────────────────────────────────────────────
export function SwimlaneDiagram({ data, analysis, raci, decisions }) {
  const swimData = useMemo(() => {
    const raw = data || analysis?.swim_lanes
    if (!raw) return null
    if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return null } }
    return raw
  }, [data, analysis?.swim_lanes])

  const raciData = useMemo(() => {
    const raw = raci || analysis?.raci
    if (!raw) return []
    if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return [] } }
    return raw
  }, [raci, analysis?.raci])

  const decisionsData = useMemo(() => {
    const raw = decisions || analysis?.decisions
    if (!raw) return []
    if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return [] } }
    return raw
  }, [decisions, analysis?.decisions])

  if (!swimData || !Array.isArray(swimData) || swimData.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#cbd5e1', fontSize: '14px' }}>
        Swim Lane 데이터가 없습니다
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <SwimlaneDiagramInner
        swimData={swimData}
        raciData={raciData}
        decisionsData={decisionsData}
      />
    </ReactFlowProvider>
  )
}

export default SwimlaneDiagram
