import { createContext, useContext, useState } from 'react'

const PermissionContext = createContext()

// 모든 권한 허용 (권한 체크 비활성화)
const ALL_PERMISSIONS = {
  upload: true, analyze: true, share: true, download: true,
  view_all: true, manage_users: true, manage_permissions: true,
}

export function PermissionProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('currentUser')
    return stored ? JSON.parse(stored) : null
  })

  const login = (user) => {
    setCurrentUser(user)
    localStorage.setItem('currentUser', JSON.stringify(user))
    localStorage.setItem('currentUserId', user.id || 'user-admin-1')
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem('currentUser')
    localStorage.removeItem('currentUserId')
  }

  return (
    <PermissionContext.Provider value={{
      currentUser,
      permissions: ALL_PERMISSIONS,
      loading: false,
      login,
      logout,
    }}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermission() {
  return useContext(PermissionContext)
}
