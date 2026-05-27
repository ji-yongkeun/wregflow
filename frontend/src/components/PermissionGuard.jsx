import { usePermission } from '../context/PermissionContext'

export function PermissionGuard({ children, permission, fallback = null }) {
  const { permissions } = usePermission()

  if (!permissions[permission]) {
    return fallback || (
      <div className="permission-denied">
        <p>⚠️ 이 기능을 사용할 권한이 없습니다.</p>
      </div>
    )
  }

  return children
}

export default PermissionGuard
