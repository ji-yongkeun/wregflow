// 권한 체크 완전 비활성화 - 모든 사용자 접근 허용
export function PermissionGuard({ children }) {
  return <>{children}</>
}

export default PermissionGuard
