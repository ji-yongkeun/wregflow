import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'
import { generateSwimlaneDiagram } from '../utils/swimlaneGenerator'

export function SwimlaneDiagram({ analysis, onCodeGenerated }) {
  const containerRef = useRef(null)
  
  useEffect(() => {
    if (!analysis || !containerRef.current) return
    
    const renderDiagram = async () => {
      try {
        // Mermaid 초기화
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          fontFamily: 'Arial',
        })
        
        // 다이어그램 코드 생성
        const diagram = generateSwimlaneDiagram(analysis)
        
        // Mermaid 코드를 상위 컴포넌트로 전달
        if (onCodeGenerated) {
          onCodeGenerated(diagram)
        }
        
        // 컨테이너 초기화
        containerRef.current.innerHTML = ''
        
        // unique id 생성
        const uniqueId = `mermaid-${Date.now()}`
        
        // 렌더링
        const { svg } = await mermaid.render(
          uniqueId,
          diagram
        )
        
        // SVG 추가
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
        }
        
      } catch (error) {
        console.error('Mermaid 렌더링 에러:', error)
        if (containerRef.current) {
          containerRef.current.innerHTML = '<p>다이어그램 렌더링에 실패했습니다</p>'
        }
      }
    }
    
    renderDiagram()
  }, [analysis])
  
  return (
    <div className="swimlane-wrapper" ref={containerRef}>
      <p>다이어그램 생성 중...</p>
    </div>
  )
}

export default SwimlaneDiagram
