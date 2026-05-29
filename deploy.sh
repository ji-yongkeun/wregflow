#!/bin/bash

# WRegFlow Production Deploy Script
# Usage: bash deploy.sh

set -e  # 오류 발생 시 즉시 중단

echo "================================"
echo "🚀 WRegFlow Production Deploy"
echo "================================"
echo ""

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# STEP 1: Backend 포트 정리
echo "Step 1: Cleaning backend port (8001)..."
sudo fuser -k -9 8001/tcp 2>/dev/null || true
sleep 2

# STEP 2: Backend 시작
echo "Step 2: Starting Backend..."
cd /var/www/wregflow/backend

# 로그 파일 초기화
> backend.log

# 가상환경 활성화 및 실행
source venv/bin/activate
nohup python main.py > backend.log 2>&1 &
BACKEND_PID=$!

sleep 3

# Backend 확인
if netstat -tuln | grep 8001 > /dev/null; then
    echo -e "${GREEN}✅ Backend running (port 8001, PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    echo ""
    echo "Last 30 lines of backend.log:"
    tail -30 backend.log
    exit 1
fi

# STEP 3: Frontend 포트 정리
echo ""
echo "Step 3: Cleaning frontend ports (8090, 8091, 8092)..."
sudo fuser -k -9 8090/tcp 8091/tcp 8092/tcp 2>/dev/null || true
pkill -9 -f "npm\|node" 2>/dev/null || true
sleep 2

# STEP 4: Frontend 시작
echo "Step 4: Starting Frontend..."
cd /var/www/wregflow/frontend

# 캐시 정리
rm -rf node_modules/.vite

# 로그 파일 초기화
> frontend.log

# Frontend 실행
nohup npm run dev -- --host 0.0.0.0 --port 8090 > frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 5

# Frontend 확인
if netstat -tuln | grep 8090 > /dev/null; then
    echo -e "${GREEN}✅ Frontend running (port 8090, PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
    echo ""
    echo "Last 30 lines of frontend.log:"
    tail -30 frontend.log
    exit 1
fi

# STEP 5: 완료
echo ""
echo "================================"
echo -e "${GREEN}✅ Deploy Complete!${NC}"
echo "================================"
echo ""
echo "📊 Services:"
echo -e "  Frontend:  ${GREEN}http://49.50.132.167:8090${NC}"
echo -e "  Backend:   ${GREEN}http://49.50.132.167:8001${NC}"
echo ""
echo "📝 Logs:"
echo "  Backend:   tail -f /var/www/wregflow/backend/backend.log"
echo "  Frontend:  tail -f /var/www/wregflow/frontend/frontend.log"
echo ""
echo "🔌 Port Status:"
netstat -tuln | grep -E '8001|8090' | sed 's/^/  /'
echo ""
echo "⚙️ Process Status:"
ps aux | grep -E 'python main.py|npm run dev' | grep -v grep | sed 's/^/  /'