import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app-container">
      <header>
        <h1>🗺️ WRegFlow</h1>
        <p>Regulation Process Mapping Tool</p>
      </header>
      
      <main>
        <section className="intro">
          <h2>규정을 흐름으로, 복잡함을 명확함으로</h2>
          <p>규정서를 업로드하면 자동으로 프로세스 맵이 생성됩니다.</p>
        </section>
        
        <section className="features">
          <div className="feature-card">
            <h3>📊 Swim Lane</h3>
            <p>부서/역할별 담당 시각화</p>
          </div>
          <div className="feature-card">
            <h3>👥 RACI 매트릭스</h3>
            <p>책임 관계 정의</p>
          </div>
          <div className="feature-card">
            <h3>🔀 의사결정 맵</h3>
            <p>의사결정 분기 자동 추출</p>
          </div>
        </section>
      </main>
      
      <footer>
        <p>© 2024 Withdinfo. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
