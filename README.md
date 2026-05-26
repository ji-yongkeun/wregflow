# WRegFlow

> Regulation Process Mapping Tool
> 규정 중심의 프로세스 맵 자동 생성 도구

## 📋 개요

규정서를 업로드하면 자동으로 프로세스 맵을 생성합니다.
- Swim Lane 다이어그램
- RACI 매트릭스
- 의사결정 플로우차트
- 단계별 상세 정보

## 🚀 빠른 시작

### Backend 실행
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
# 또는
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python main.py
```

### Frontend 실행
```bash
cd frontend
npm install
npm run dev
```

브라우저: http://localhost:8081

## 📁 프로젝트 구조

```
wregflow/
├── backend/
│   ├── app/
│   │   ├── models/      # SQLAlchemy ORM
│   │   ├── schemas/     # Pydantic 스키마
│   │   ├── routes/      # API 엔드포인트
│   │   ├── services/    # 비즈니스 로직
│   │   ├── db/          # 데이터베이스
│   │   └── utils/       # 유틸리티
│   ├── main.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/  # React 컴포넌트
│   │   ├── pages/       # 페이지
│   │   ├── hooks/       # Custom hooks
│   │   ├── store/       # Zustand 상태
│   │   ├── api/         # API 클라이언트
│   │   ├── styles/      # CSS 파일
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env
└── .gitignore
```

## 🛠️ 기술 스택

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: React 18, Vite, Zustand, Mermaid
- **API**: Anthropic Claude API
- **Deploy**: Naver Cloud, Nginx, Systemd

## 📝 라이선스

MIT License
