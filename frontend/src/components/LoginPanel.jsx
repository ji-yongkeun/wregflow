import { useState, useEffect } from 'react'
import { usePermission } from '../context/PermissionContext'

export function LoginPanel() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const { currentUser, login, logout } = usePermission()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8001/api/permissions/roles')
      const data = await response.json()
      
      // 테스트용 사용자 목록
      setUsers([
        { id: 'user-admin-1', name: '관리자 (Admin)', email: 'admin@wregflow.com', role: 'admin' },
        { id: 'user-editor-1', name: '편집자 (Editor)', email: 'editor@wregflow.com', role: 'editor' },
        { id: 'user-viewer-1', name: '조회자 (Viewer)', email: 'viewer@wregflow.com', role: 'viewer' }
      ])
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error)
    } finally {
      setLoading(false)
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
