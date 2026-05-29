import { useState, useEffect } from 'react'
import { usePermission } from '../context/PermissionContext'

// 기본 사용자 목록 (API 실패 시 폴백)
const DEFAULT_USERS = [
  { id: 'user-admin-1', name: '관리자 (Admin)', email: 'admin@wregflow.com', role: 'admin' },
  { id: 'user-editor-1', name: '편집자 (Editor)', email: 'editor@wregflow.com', role: 'editor' },
  { id: 'user-viewer-1', name: '조회자 (Viewer)', email: 'viewer@wregflow.com', role: 'viewer' }
]

export function LoginPanel() {
  const [users, setUsers] = useState(DEFAULT_USERS)  // 기본값으로 초기화
  const { currentUser, login, logout } = usePermission()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'
      const response = await fetch(`${BASE}/api/permissions/roles`)
      if (!response.ok) throw new Error('API 응답 오류')
      const data = await response.json()
      // API에서 사용자 목록을 받은 경우 업데이트 (현재는 기본값 유지)
      // 실제 사용자 목록이 API에서 오면 setUsers(data.users) 형태로 교체 가능
    } catch (error) {
      // 실패해도 DEFAULT_USERS가 이미 설정되어 있어 UI에 표시됨
      console.warn('사용자 목록 API 호출 실패, 기본 목록 사용:', error.message)
    }
  }

  const handleLogin = (user) => {
    login(user, user.id)
  }

  if (currentUser) {
    return (
      <div className="login-panel">
        <div className="current-user">
          <span className="user-name">{currentUser.name}</span>
          <span className={`role-badge role-${currentUser.role}`}>
            {currentUser.role.toUpperCase()}
          </span>
          <button onClick={logout} className="btn-logout">
            로그아웃
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-panel">
      <h3>사용자 선택</h3>
      <div className="user-list">
        {users.map(user => (
          <button
            key={user.id}
            onClick={() => handleLogin(user)}
            className="user-button"
          >
            <div className="user-info">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
            <span className={`role-badge role-${user.role}`}>
              {user.role.toUpperCase()}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default LoginPanel
