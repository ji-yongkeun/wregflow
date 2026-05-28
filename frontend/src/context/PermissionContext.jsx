import { createContext, useContext, useState, useEffect } from 'react'

const PermissionContext = createContext()

export function PermissionProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [permissions, setPermissions] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 로드
    const storedUser = localStorage.getItem('currentUser')
    const storedUserId = localStorage.getItem('currentUserId')
    
    if (storedUser && storedUserId) {
      setCurrentUser(JSON.parse(storedUser))
      fetchPermissions(storedUserId)
    }
    
    setLoading(false)
  }, [])

  const fetchPermissions = async (userId) => {
    try {
      const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api'
      const response = await fetch(`${BASE}/permissions/my-permissions`, {
        headers: {
          'X-User-Id': userId
        }
      })
      const data = await response.json()
      
      if (data.status === 'success') {
        setPermissions(data.permissions)
      }
    } catch (error) {
      console.error('권한 조회 실패:', error)
    }
  }

  const login = (user, userId) => {
    setCurrentUser(user)
    localStorage.setItem('currentUser', JSON.stringify(user))
    localStorage.setItem('currentUserId', userId)
    fetchPermissions(userId)
  }

  const logout = () => {
    setCurrentUser(null)
    setPermissions({})
    localStorage.removeItem('currentUser')
    localStorage.removeItem('currentUserId')
  }

  return (
    <PermissionContext.Provider value={{
      currentUser,
      permissions,
      loading,
      login,
      logout
    }}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermission() {
  return useContext(PermissionContext)
}
