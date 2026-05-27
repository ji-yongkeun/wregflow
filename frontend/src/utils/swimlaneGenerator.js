export function generateSwimlaneDiagram(analysis) {
  // 검증
  if (!analysis || !analysis.swim_lanes) {
    return 'graph TD\n  A["데이터 없음"]'
  }

  let diagram = 'graph TD\n'
  let nodeConnections = []
  let nodeCounter = {}
  
  // 각 swim lane 처리
  analysis.swim_lanes.forEach((lane, laneIndex) => {
    // 특수문자와 공백을 모두 _로 치환하여 Mermaid ID가 안전하게 사용될 수 있도록 처리
    const laneName = lane.role.replace(/[^a-zA-Z0-9가-힣_]/g, '_')
    diagram += `  subgraph ${laneName}["${lane.role}"]\n`
    
    if (lane.steps && lane.steps.length > 0) {
      lane.steps.forEach((step, stepIndex) => {
        const nodeId = `${laneName}_${stepIndex}`
        nodeCounter[nodeId] = true
        
        // 의사결정점은 {{}} 마름모/육각형, 일반 작업은 [] 박스
        if (step.decision) {
          diagram += `    ${nodeId}{{"${step.action}"}}\n`
        } else {
          diagram += `    ${nodeId}["${step.action}"]\n`
        }
        
        // 같은 lane 내에서 순차 연결
        if (stepIndex > 0) {
          const prevNodeId = `${laneName}_${stepIndex - 1}`
          nodeConnections.push(`${prevNodeId} --> ${nodeId}`)
        }
        
        // 마지막 단계 저장 (다음 lane으로 연결하기 위해)
        if (stepIndex === lane.steps.length - 1) {
          nodeCounter[`${laneName}_last`] = nodeId
        }
      })
    }
    
    diagram += '  end\n'
  })
  
  // Lane 간 연결 (순차적으로)
  const lanes = analysis.swim_lanes
  for (let i = 0; i < lanes.length - 1; i++) {
    const currentLane = lanes[i]
    const nextLane = lanes[i + 1]
    
    if (currentLane.steps && currentLane.steps.length > 0 && nextLane.steps && nextLane.steps.length > 0) {
      const currentLaneName = currentLane.role.replace(/[^a-zA-Z0-9가-힣_]/g, '_')
      const nextLaneName = nextLane.role.replace(/[^a-zA-Z0-9가-힣_]/g, '_')
      
      const lastNodeOfCurrent = `${currentLaneName}_${currentLane.steps.length - 1}`
      const firstNodeOfNext = `${nextLaneName}_0`
      
      nodeConnections.push(`${lastNodeOfCurrent} --> ${firstNodeOfNext}`)
    }
  }
  
  // 연결 추가
  diagram += '\n'
  nodeConnections.forEach(connection => {
    diagram += `  ${connection}\n`
  })
  
  return diagram
}
