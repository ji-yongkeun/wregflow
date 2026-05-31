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

import { 
  UserOutlined, BankOutlined, SolutionOutlined, SafetyCertificateOutlined, 
  LineChartOutlined, FileTextOutlined, DesktopOutlined, CheckCircleOutlined, SettingOutlined 
} from '@ant-design/icons'

const LANE_WIDTH = 190
const HEADER_HEIGHT = 100
const NODE_WIDTH = 150
const NODE_HEIGHT = 64
const Y_SPACING = 90

// ── Role to Icon Mapper ───────────────────────────────────────────────────────
const getRoleIcon = (roleName) => {
  if (!roleName) return <BankOutlined />
  const n = roleName.toLowerCase()
  if (n.includes('고객')) return <UserOutlined />
  if (n.includes('주택') || n.includes('공사') || n.includes('lh')) return <BankOutlined />
  if (n.includes('담당자')) return <SolutionOutlined />
  if (n.includes('책임자')) return <SafetyCertificateOutlined />
  if (n.includes('소관부장') || n.includes('부장')) return <LineChartOutlined />
  return <BankOutlined />
}

// ── Lane background node ──────────────────────────────────────────────────────
function LaneGroupNode({ data }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: data.isEven ? '#f8fafc' : '#ffffff',
      borderRight: '1px dashed #cbd5e1',
      position: 'relative',
      pointerEvents: 'none',
      boxSizing: 'border-box'
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: `${HEADER_HEIGHT}px`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        borderBottom: '2px solid #e2e8f0',
        background: 'linear-gradient(to bottom, #ffffff, #f1f5f9)'
      }}>
        <div style={{
          fontSize: '22px', color: '#3b82f6', marginBottom: '8px',
          background: '#e0f2fe', borderRadius: '50%',
          width: '44px', height: '44px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
        }}>
          {getRoleIcon(data.role)}
        </div>
        <div style={{
          color: '#1e293b', fontSize: '12px', fontWeight: '700',
          textAlign: 'center', padding: '0 8px', lineHeight: '1.2'
        }}>
          {data.role}
        </div>
      </div>
    </div>
  )
}

// ── Task Type Text Mapper ─────────────────────────────────────────────────────
const getTaskTypeText = (type) => {
  switch (type) {
    case 'system': return '시스템'
    case 'approval': return '승인/결재'
    case 'general': return '일반작업'
    case 'document':
    default: return '문서작업'
  }
}

// ── Process step node ─────────────────────────────────────────────────────────
function ProcessNode({ data, selected }) {
  return (
    <div style={{
      width: 'fit-content',
      minWidth: '120px',
      maxWidth: '170px',
      minHeight: `${NODE_HEIGHT}px`,
      background: '#ffffff',
      border: `2px solid ${selected ? '#3b82f6' : '#cbd5e1'}`,
      borderRadius: '8px',
      display: 'flex', flexDirection: 'row', alignItems: 'stretch',
      boxShadow: selected ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 5px rgba(0,0,0,0.05)',
      cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
    }}>
      {data.system_used && (
        <div style={{
          position: 'absolute', top: '-10px', right: '5px',
          background: '#10b981', color: 'white', fontSize: '9px', fontWeight: 'bold',
          padding: '2px 6px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {data.system_used}
        </div>
      )}
      <Handle type="target" position={Position.Top} style={{ background: '#3b82f6', border: 'none' }} />
      <div style={{
        width: '32px', background: '#3b82f6', color: '#ffffff',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '8px',
        fontWeight: 'bold', fontSize: '14px', borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px'
      }}>
        {data.order}
      </div>
      <div style={{ flex: 1, padding: '8px 8px 6px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <div style={{
          color: '#1e293b', fontSize: '11px', fontWeight: '600', lineHeight: '1.3',
          wordBreak: 'keep-all', overflowWrap: 'break-word', marginBottom: '8px'
        }}>
          {data.action}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
          {data.regulation_ref && data.regulation_ref !== '알 수 없음' ? (
            <span style={{ fontSize: '9px', color: '#3b82f6', fontWeight: 'bold', maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={data.regulation_ref}>
              {data.regulation_ref}
            </span>
          ) : (data.related_editions && data.related_editions.length > 0) ? (
            <span style={{ fontSize: '9px', color: '#3b82f6', fontWeight: 'bold', maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={data.related_editions.map(e => `${e}편`).join(', ')}>
              {data.related_editions.map(e => `${e}편`).join(', ')}
            </span>
          ) : <span />}
          <span style={{ 
            background: '#f1f5f9', color: '#64748b', fontSize: '10px', 
            padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' 
          }}>
            {getTaskTypeText(data.task_type)}
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#3b82f6', border: 'none' }} />
    </div>
  )
}

// ── Decision node ─────────────────────────────────────────────────────────────
function DecisionNode({ data, selected }) {
  return (
    <div style={{ 
      width: 'fit-content', 
      minWidth: '120px', 
      maxWidth: '170px', 
      minHeight: `${NODE_HEIGHT}px`, 
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#f59e0b', border: 'none' }} />
      <div style={{
        flex: 1,
        background: '#fffbeb',
        border: `2px solid ${selected ? '#f59e0b' : '#fcd34d'}`,
        borderRadius: '8px', padding: '6px 8px',
        display: 'flex', flexDirection: 'row', alignItems: 'flex-start',
        boxShadow: selected ? '0 4px 12px rgba(245, 158, 11, 0.3)' : '0 2px 5px rgba(0,0,0,0.05)',
        cursor: 'pointer', boxSizing: 'border-box'
      }}>
        <div style={{
          width: '20px', height: '20px', background: '#f59e0b',
          transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: '8px', marginLeft: '2px', marginTop: '2px', flexShrink: 0
        }}>
          <span style={{ color: '#fff', transform: 'rotate(-45deg)', fontSize: '10px', fontWeight: 'bold' }}>?</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', color: '#92400e', fontSize: '11px', fontWeight: '600', lineHeight: '1.3', wordBreak: 'keep-all', overflowWrap: 'break-word', marginTop: '4px' }}>
          <span>{data.action}</span>
          {data.regulation_ref && data.regulation_ref !== '알 수 없음' ? (
            <span style={{ fontSize: '9px', color: '#b45309', marginTop: '4px' }}>
              {data.regulation_ref}
            </span>
          ) : (data.related_editions && data.related_editions.length > 0) && (
            <span style={{ fontSize: '9px', color: '#b45309', marginTop: '4px' }}>
              {data.related_editions.map(e => `${e}편`).join(', ')}
            </span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="yes" style={{ background: '#10b981', border: 'none', left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="no" style={{ background: '#ef4444', border: 'none', left: '70%' }} />
    </div>
  )
}

const nodeTypes = {
  laneGroup: LaneGroupNode,
  processNode: ProcessNode,
  decisionNode: DecisionNode,
}

// ── Graph builder ─────────────────────────────────────────────────────────────
function buildFlowGraph(swimData) {
  const allSteps = []
  swimData.forEach((lane, li) => {
    (lane.steps || []).forEach((step, si) => {
      let o = parseInt(step.order)
      if (isNaN(o) || o <= 0) o = si + 1
      allSteps.push({ ...step, laneIdx: li, role: lane.role, order: o, originalIndex: si })
    })
  })

  // 모든 스텝을 order 순으로 전역 정렬 (중복 시 레인 순서로)
  allSteps.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return a.laneIdx - b.laneIdx
  })

  const totalWidth = swimData.length * LANE_WIDTH
  const nodes = []
  const edges = []

  // 각 레인별 Y 좌표 오프셋 관리
  const laneYOffsets = swimData.map(() => HEADER_HEIGHT + 20)

  allSteps.forEach(step => {
    // Left-align within the lane with a 10px margin, since width is now dynamic
    const x = step.laneIdx * LANE_WIDTH + 10
    
    // 현재 레인의 Y 좌표에만 의존하여 가장 위쪽으로 빈 공간 없이 촘촘하게 배치
    let y = laneYOffsets[step.laneIdx]
    
    nodes.push({
      id: `step-${step.laneIdx}-${step.originalIndex}`,
      type: step.decision ? 'decisionNode' : 'processNode',
      position: { x, y },
      data: step, // order 값이 명시적으로 들어있음
      draggable: false, zIndex: 10,
    })

    // 글자 길이를 기반으로 예상 높이를 계산하여 다이나믹한 세로 간격 확보 (박스 겹침 방지)
    const textLen = (step.action || '').length
    const charsPerLine = 15
    const estimatedLines = Math.ceil(textLen / charsPerLine)
    const estimatedHeight = Math.max(NODE_HEIGHT, 16 + estimatedLines * 15)
    const dynamicSpacing = estimatedHeight + 35 // 화살표가 보일 수 있도록 적당한 마진(35px) 부여

    // 다음 스텝을 위해 해당 레인의 Y 오프셋만 증가
    laneYOffsets[step.laneIdx] = y + dynamicSpacing
  })

  const totalHeight = Math.max(...laneYOffsets) + 60

  // ── Lane 배경 노드 ────────────────────────────────────────────────────────
  swimData.forEach((lane, li) => {
    nodes.push({
      id: `lane-${li}`,
      type: 'laneGroup',
      position: { x: li * LANE_WIDTH, y: 0 },
      style: { width: LANE_WIDTH, height: totalHeight },
      data: { role: lane.role, isEven: li % 2 === 0 },
      selectable: false, draggable: false, focusable: false, zIndex: 0,
    })
  })

  // ── 전체 엣지 연결 로직 (next_steps 기반 + Fallback 지원) ─────────────────
  let hasAnyNextSteps = false
  const orderToNodeId = {}

  allSteps.forEach(s => {
    orderToNodeId[s.order] = `step-${s.laneIdx}-${s.originalIndex}`
    if (s.next_steps && s.next_steps.length > 0) {
      hasAnyNextSteps = true
    }
  })

  if (hasAnyNextSteps) {
    // 새로운 JSON 형식: next_steps 배열을 기반으로 분기 생성
    allSteps.forEach(curr => {
      const sourceId = `step-${curr.laneIdx}-${curr.originalIndex}`
      const nextOrders = curr.next_steps || []
      
      nextOrders.forEach((nextOrder, index) => {
        const targetId = orderToNodeId[nextOrder]
        if (targetId) {
          const targetLaneIdx = parseInt(targetId.split('-')[1])
          const cross = curr.laneIdx !== targetLaneIdx
          
          let sourceHandle = undefined
          let label = undefined
          if (curr.decision) {
            // 의사결정 노드일 경우 첫 번째 연결은 'yes', 두 번째 연결은 'no'
            if (index === 0) { sourceHandle = 'yes'; label = '예' }
            else { sourceHandle = 'no'; label = '아니오' }
          }

          edges.push({
            id: `edge-${sourceId}-${targetId}`,
            source: sourceId,
            target: targetId,
            sourceHandle,
            type: 'smoothstep',
            animated: cross,
            label,
            labelStyle: { fill: '#3b82f6', fontWeight: 700, fontSize: 10 },
            labelBgStyle: { fill: 'rgba(255,255,255,0.9)', padding: 3 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6', width: 14, height: 14 },
            style: { stroke: '#94a3b8', strokeWidth: 1.5 },
          })
        }
      })
    })
  } else {
    // 기존 JSON 형식: 단순 순차적 연결 (Fallback)
    for (let i = 0; i < allSteps.length - 1; i++) {
      const curr = allSteps[i]
      const next = allSteps[i + 1]
      const cross = curr.laneIdx !== next.laneIdx

      let sourceHandle = curr.decision ? 'yes' : undefined
      let label = curr.decision ? '예' : undefined

      edges.push({
        id: `edge-${i}`,
        source: `step-${curr.laneIdx}-${curr.originalIndex}`,
        target: `step-${next.laneIdx}-${next.originalIndex}`,
        sourceHandle,
        type: 'smoothstep',
        animated: cross,
        label,
        labelStyle: { fill: '#3b82f6', fontWeight: 700, fontSize: 10 },
        labelBgStyle: { fill: 'rgba(255,255,255,0.9)', padding: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6', width: 14, height: 14 },
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      })
    }
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
  if (value === null || value === undefined || value === 'null' || value === 'None' || value === '') return '시스템/수기'
  if (typeof value === 'string' && value.trim().toLowerCase() === 'null') return '시스템/수기'
  if (value === '시스템/수기') return '시스템/수기'

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

// ── Recursively replace null strings ───────────────────────────────────────────
const replaceNullsDeep = (obj) => {
  if (obj === 'null' || obj === null) {
    return '시스템/수기'
  }
  if (Array.isArray(obj)) {
    return obj.map(replaceNullsDeep)
  }
  if (obj !== null && typeof obj === 'object') {
    const newObj = {}
    for (const key in obj) {
      newObj[key] = replaceNullsDeep(obj[key])
    }
    return newObj
  }
  return obj
}

// ── Inner diagram (needs ReactFlowProvider context) ───────────────────────────
function SwimlaneDiagramInner({ swimData: rawSwimData, raciData: rawRaciData, decisionsData: rawDecisionsData }) {
  const swimData = useMemo(() => replaceNullsDeep(rawSwimData) || [], [rawSwimData])
  const raciData = useMemo(() => replaceNullsDeep(rawRaciData) || [], [rawRaciData])
  const decisionsData = useMemo(() => replaceNullsDeep(rawDecisionsData) || [], [rawDecisionsData])

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
          fitViewOptions={{ padding: 0.05, maxZoom: 1.5 }}
          panOnDrag
          zoomOnScroll
          minZoom={0.25}
          maxZoom={2.5}
          style={{ background: '#f8fafc' }}
          deleteKeyCode={null}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={28}
            size={1.2}
            color="#cbd5e1"
          />
          <Controls
            style={{
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          />
          <MiniMap
            position="bottom-left"
            style={{
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
            }}
            nodeColor={n => {
              if (n.type === 'laneGroup') return '#f1f5f9'
              if (n.type === 'decisionNode') return '#f59e0b'
              return '#3b82f6'
            }}
            maskColor="rgba(248,250,252,0.6)"
          />
          <Panel position="top-left" style={{ margin: '10px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.85)',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '5px 12px',
              fontSize: '11px',
              color: '#475569',
              backdropFilter: 'blur(8px)',
              pointerEvents: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <span style={{ color: '#3b82f6' }}>💡</span> 카드 클릭 → 상세 정보 &nbsp;·&nbsp; 스크롤 → 확대/축소 &nbsp;·&nbsp; 드래그 → 이동
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '10px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px',
        padding: '10px 18px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        fontSize: '12px', color: '#475569',
        boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
      }}>
        <span style={{ color: '#3b82f6', fontWeight: '700' }}>📌 범례</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{
            width: '34px', height: '16px',
            background: '#ffffff',
            border: '2px solid #cbd5e1', borderRadius: '4px',
          }} />
          <span>일반 프로세스</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{
            width: '34px', height: '16px',
            background: '#fffbeb',
            border: '2px solid #fcd34d', borderRadius: '4px',
          }} />
          <span>의사결정 포인트</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{
            width: '30px', height: '2.5px', background: '#94a3b8', position: 'relative',
            display: 'flex', alignItems: 'center',
          }}>
            <div style={{
              position: 'absolute', right: '-5px',
              borderLeft: '7px solid #3b82f6',
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
