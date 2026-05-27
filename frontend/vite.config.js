import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,              // 👈 [추가] 외부 IP(네이버 클라우드 공인 IP) 접속을 허용합니다!
    port: 8090,             // 로컬 개발 환경 포트 8090으로 설정
    strictPort: false,       // 포트 고정
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
