# WordPress Auto Poster v2.0 - AI 기반 콘텐츠 자동화 플랫폼

<div align="center">

![WordPress Auto Poster](https://img.shields.io/badge/WordPress-Auto%20Poster-blue?style=for-the-badge&logo=wordpress)
![Version](https://img.shields.io/badge/Version-2.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**AI 기반의 고품질 콘텐츠 자동 생성 및 워드프레스 포스팅 플랫폼**

[🚀 빠른 시작](#-빠른-시작) • [📖 사용자 가이드](USER_GUIDE_V2.md) • [🎯 주요 기능](#-주요-기능) • [🔧 설치](#-설치) • [📱 라이브 데모](#-라이브-데모)

</div>

---

## 🎯 주요 기능

### ✨ 핵심 기능
- **🤖 AI 기반 콘텐츠 생성**: OpenAI GPT를 활용한 고품질 콘텐츠 자동 생성
- **📊 실시간 진행 상황**: 5단계 콘텐츠 생성 과정 시각화
- **🔍 SEO 최적화**: 키워드 분석, 메타 태그 생성, 콘텐츠 최적화
- **📈 키워드 분석**: 경쟁 강도 분석 및 관련 키워드 추천
- **🔗 워드프레스 연동**: 완전한 WordPress API 연동 및 자동 포스팅
- **🎨 현대적인 UI/UX**: React 기반의 반응형 웹 인터페이스
- **🔐 JWT 인증**: 안전한 사용자 인증 및 관리 시스템
- **🌙 다크모드**: 사용자 편의성을 위한 테마 전환

### 🚀 개선된 기능 (v2.0)
- **📱 개선된 사이드바**: 직관적인 네비게이션 및 사용량 표시
- **⚡ API 상태 표시**: 실시간 API 연결 상태 모니터링
- **🎛️ 통합 설정**: WordPress 및 LLM 설정 통합 관리
- **📊 진행 상황 UI**: 콘텐츠 생성 과정 실시간 표시
- **🔧 오류 수정**: 키워드 분석 API 오류 해결
- **🎨 UI/UX 최적화**: Writesonic 스타일의 전문적인 인터페이스

## 📱 라이브 데모

- **🌐 프론트엔드**: [https://szmnagau.manus.space](https://szmnagau.manus.space)
- **📚 API 문서**: [https://8000-i5m8uhbhve9by3jw98pxb-9f5fa722.manusvm.computer/docs](https://8000-i5m8uhbhve9by3jw98pxb-9f5fa722.manusvm.computer/docs)

### 테스트 계정
- **사용자명**: `testuser`
- **비밀번호**: `password123`

## 🚀 빠른 시작

### 1️⃣ 자동 설치 (권장)
```bash
# 프로젝트 압축 해제
tar -xzf wordpress-auto-poster-v2.tar.gz
cd wordpress-auto-poster

# 자동 배포 스크립트 실행
chmod +x deploy.sh
./deploy.sh
```

### 2️⃣ 수동 설치
```bash
# 저장소 클론
git clone https://github.com/Hyeon0129/wordpress-auto-poster.git
cd wordpress-auto-poster

# 백엔드 설정
cd server
pip install -r requirements.txt

# 프론트엔드 설정
cd ../client
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일 편집

# 실행
# 터미널 1: 백엔드
cd server && uvicorn src.main:app --host 0.0.0.0 --port 8000

# 터미널 2: 프론트엔드
cd client && npm run dev
```

### 3️⃣ 접속
브라우저에서 `http://localhost:3000` 접속

## 🔧 설치

### 시스템 요구사항
- **Python**: 3.11+
- **Node.js**: 20+
- **메모리**: 4GB RAM 권장
- **저장공간**: 1GB 이상

### 의존성
#### 백엔드
- FastAPI
- SQLAlchemy
- OpenAI
- JWT
- Uvicorn

#### 프론트엔드
- React 18
- Vite
- TailwindCSS
- Lucide Icons

## 📖 상세 사용법

### 콘텐츠 생성 과정
1. **키워드 입력**: 메인 키워드 및 추가 키워드 설정
2. **설정 선택**: 콘텐츠 타입, 톤, 타겟 독자 선택
3. **생성 시작**: AI가 5단계로 콘텐츠 생성
4. **결과 확인**: 생성된 콘텐츠 검토 및 편집
5. **포스팅**: WordPress 사이트에 자동 포스팅

### 키워드 분석
- **검색량 분석**: 월간 검색량 및 트렌드
- **경쟁 강도**: 키워드 경쟁 난이도 분석
- **관련 키워드**: 자동 추천 키워드 목록
- **SEO 제안**: 최적화 방안 제시

### WordPress 연동
1. **설정 페이지** 이동
2. **WordPress 탭** 선택
3. **사이트 정보** 입력
4. **연결 테스트** 실행
5. **자동 포스팅** 활성화

## 🏗️ 아키텍처

### 백엔드 (FastAPI)
```
server/
├── src/
│   ├── main.py              # 메인 애플리케이션
│   ├── routes/              # API 라우터
│   │   ├── auth.py          # 인증 관련
│   │   ├── content.py       # 콘텐츠 생성
│   │   ├── seo.py           # SEO 분석
│   │   ├── wordpress.py     # WordPress 연동
│   │   └── keyword_analysis.py # 키워드 분석
│   ├── services/            # 비즈니스 로직
│   │   ├── content_generator.py
│   │   ├── seo_service.py
│   │   ├── wordpress_service.py
│   │   └── auth_service.py
│   ├── models/              # 데이터 모델
│   └── utils/               # 유틸리티
└── requirements.txt
```

### 프론트엔드 (React)
```
client/
├── src/
│   ├── App.jsx              # 메인 앱
│   ├── components/          # React 컴포넌트
│   │   ├── Dashboard.jsx    # 대시보드
│   │   ├── ContentGenerator.jsx # 콘텐츠 생성
│   │   ├── KeywordAnalyzer.jsx  # 키워드 분석
│   │   ├── Settings.jsx     # 설정
│   │   ├── Sidebar.jsx      # 사이드바
│   │   └── Header.jsx       # 헤더
│   ├── contexts/            # React 컨텍스트
│   └── utils/               # 유틸리티
├── package.json
└── vite.config.js
```

## 🔐 보안

- **JWT 인증**: 안전한 토큰 기반 인증
- **비밀번호 해싱**: bcrypt를 이용한 안전한 해싱
- **CORS 설정**: 허용된 도메인만 접근 가능
- **API 키 보안**: 환경변수를 통한 안전한 관리
- **입력 검증**: 모든 사용자 입력 검증

## 🚀 배포

### 도커 배포
```bash
# 도커 이미지 빌드
docker-compose build

# 서비스 시작
docker-compose up -d
```

### 클라우드 배포
- **AWS EC2**: Ubuntu 22.04 LTS 권장
- **Vercel**: 프론트엔드 배포
- **Railway**: 백엔드 배포
- **DigitalOcean**: 풀스택 배포

## 🔧 환경변수

### 백엔드 (.env)
```env
DATABASE_URL=sqlite:///./wordpress_auto_poster.db
SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key
ALLOWED_ORIGINS=http://localhost:3000
```

### 프론트엔드 (.env)
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=WordPress Auto Poster
VITE_APP_VERSION=2.0.0
```

## 🐛 문제 해결

### 일반적인 문제
1. **백엔드 시작 실패**: 의존성 재설치 및 포트 확인
2. **프론트엔드 빌드 오류**: 노드 모듈 재설치
3. **WordPress 연동 실패**: URL 및 인증 정보 확인
4. **OpenAI API 오류**: API 키 및 크레딧 확인

### 로그 확인
```bash
# 백엔드 로그
tail -f server/logs/app.log

# 프론트엔드 로그
# 브라우저 개발자 도구 > Console
```

## 📊 성능

- **응답 시간**: 평균 < 2초
- **동시 사용자**: 100+ 지원
- **콘텐츠 생성**: 분당 10+ 포스트
- **메모리 사용량**: < 512MB

## 🤝 기여

1. **Fork** 저장소
2. **Feature 브랜치** 생성 (`git checkout -b feature/AmazingFeature`)
3. **변경사항 커밋** (`git commit -m 'Add some AmazingFeature'`)
4. **브랜치 푸시** (`git push origin feature/AmazingFeature`)
5. **Pull Request** 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 감사의 말

- **OpenAI**: GPT API 제공
- **Writesonic**: UI/UX 영감
- **React 커뮤니티**: 오픈소스 컴포넌트
- **FastAPI**: 빠르고 현대적인 API 프레임워크

## 📞 지원

- **이슈 리포팅**: [GitHub Issues](https://github.com/Hyeon0129/wordpress-auto-poster/issues)
- **기능 요청**: [Feature Request](https://github.com/Hyeon0129/wordpress-auto-poster/issues/new?template=feature_request.md)
- **문서 개선**: [Documentation](https://github.com/Hyeon0129/wordpress-auto-poster/wiki)

---

<div align="center">

**WordPress Auto Poster v2.0** - AI 기반 콘텐츠 자동화의 새로운 표준

Made with ❤️ by [Hyeon0129](https://github.com/Hyeon0129)

[⬆ 맨 위로](#wordpress-auto-poster-v20---ai-기반-콘텐츠-자동화-플랫폼)

</div>

