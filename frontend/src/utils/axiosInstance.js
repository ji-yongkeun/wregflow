import axios from 'axios'

const BASE = (() => {
  let url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
  if (url.endsWith('/api')) url = url.slice(0, -4);
  if (url.endsWith('/api/')) url = url.slice(0, -5);
  return url;
})();

const axiosInstance = axios.create({
  baseURL: BASE
})

// 요청 인터셉터: X-User-Id 헤더 추가
axiosInstance.interceptors.request.use(request => {
  const userId = localStorage.getItem('currentUserId')
  if (userId) {
    request.headers['X-User-Id'] = userId
  }
  return request
})

// 응답 인터셉터: 권한 오류 처리
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      alert('권한이 없습니다')
    } else if (error.response?.status === 401) {
      alert('사용자 인증이 필요합니다')
      localStorage.removeItem('currentUserId')
      localStorage.removeItem('currentUser')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
