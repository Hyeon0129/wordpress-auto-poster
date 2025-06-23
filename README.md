# WordPress Auto Poster v2.0.0

AI 기반 워드프레스 자동 포스팅 플랫폼 - 프로덕션 준비 완료

## 🚀 주요 개선사항 (v2.0.0)

### ✨ 새로운 기능
- **이메일 인증 시스템**: 회원가입 시 이메일 인증 필수 (60초 타임아웃)
- **SEO 최적화 탭**: 실제 SEO 분석 및 최적화 기능 구현
- **진행상황 표시**: 콘텐츠 생성 과정을 5단계로 시각화
- **Writesonic 스타일 UI**: 현대적이고 직관적인 사용자 인터페이스
- **다중 AI 모델 지원**: GPT-4, Claude, Gemini 등 선택 가능

### 🔧 개선사항
- **API 키 연동 시스템**: .env 파일 및 웹 인터페이스에서 API 키 설정 가능
- **WordPress 계정 연동**: 안정적인 REST API 기반 연동 시스템
- **보안 강화**: JWT 토큰 기반 인증, API 키 암호화 저장
- **반응형 디자인**: 모바일 및 태블릿 최적화
- **에러 처리**: 상세한 에러 메시지 및 해결 방안 제공

### 🐛 해결된 문제
- ✅ .env에 API 키 추가해도 데모 모드로 실행되는 문제 해결
- ✅ 설정에서 API 키 연결 시 에러 발생 문제 해결
- ✅ 워드프레스 계정 연동 실패 문제 해결
- ✅ SEO 최적화 탭 기능 없음 문제 해결
- ✅ 콘텐츠 생성 진행상황 표시 기능 추가

## 📦 빠른 시작

### 1. 프로젝트 다운로드
```bash
# 압축 파일 다운로드 후 압축 해제
tar -xzf wordpress-auto-poster-v2.0.0.tar.gz
cd wordpress-auto-poster
```

### 2. 백엔드 설정
```bash
cd server
pip install -r requirements.txt
```

### 3. 프론트엔드 설정
```bash
cd client
npm install --legacy-peer-deps
```

### 4. 환경 변수 설정
```bash
# .env 파일 생성 및 설정
cp .env.example .env
# OpenAI API 키 등 필수 정보 입력
```

### 5. 서버 실행
```bash
# 백엔드 (터미널 1)
cd server
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

# 프론트엔드 (터미널 2)
cd client
npm run dev
```

### 6. 접속
브라우저에서 `http://localhost:3000` 접속

## 📚 상세 문서

완전한 설치 가이드, 사용법, 문제 해결 방법은 **`wordpress-auto-poster-manual.pdf`** 파일을 참조하세요.

## 🔑 필수 요구사항

- **Python**: 3.8 이상
- **Node.js**: 16.0 이상
- **OpenAI API 키**: GPT 모델 사용을 위해 필요
- **SMTP 설정**: 이메일 인증을 위해 필요 (선택사항)

## 🌟 주요 기능

### AI 콘텐츠 생성
- 키워드 기반 자동 콘텐츠 생성
- SEO 최적화된 메타데이터 자동 생성
- 다양한 콘텐츠 유형 지원 (블로그, 기사, 튜토리얼 등)
- 실시간 진행상황 표시

### WordPress 연동
- 다중 WordPress 사이트 관리
- 원클릭 자동 포스팅
- REST API 기반 안정적인 연동
- 포스트 상태 관리 (초안/발행/비공개)

### 사용자 관리
- 이메일 인증 기반 회원가입
- JWT 토큰 기반 보안 인증
- 사용자별 설정 관리
- 세션 관리 및 자동 로그아웃

### SEO 최적화
- 실시간 SEO 분석
- 키워드 밀도 최적화
- 메타 태그 자동 생성
- 구조화된 데이터 지원

## 🎨 UI/UX 개선

Writesonic을 참고하여 완전히 새롭게 디자인된 사용자 인터페이스:

- **현대적인 디자인**: 그라데이션과 카드 기반 레이아웃
- **직관적인 네비게이션**: 명확한 정보 계층구조
- **반응형 디자인**: 모든 디바이스에서 최적화된 경험
- **시각적 피드백**: 호버 효과, 애니메이션, 진행 표시

## 🔧 기술 스택

### 백엔드
- **FastAPI**: 고성능 Python 웹 프레임워크
- **SQLAlchemy**: ORM 및 데이터베이스 관리
- **JWT**: 보안 토큰 기반 인증
- **OpenAI API**: AI 콘텐츠 생성

### 프론트엔드
- **React**: 모던 JavaScript 프레임워크
- **Vite**: 빠른 개발 서버 및 빌드 도구
- **Tailwind CSS**: 유틸리티 기반 CSS 프레임워크
- **Shadcn/UI**: 고품질 React 컴포넌트
- **Lucide Icons**: 아름다운 아이콘 세트

## 📈 성능 및 보안

### 성능 최적화
- 비동기 처리로 빠른 응답 시간
- 효율적인 데이터베이스 쿼리
- 정적 파일 캐싱
- 이미지 최적화

### 보안 기능
- API 키 암호화 저장
- CORS 설정으로 안전한 크로스 오리진 요청
- 입력 데이터 검증 및 살균
- 세션 타임아웃 관리

## 🚀 프로덕션 배포

### 지원 환경
- **Ubuntu 20.04+**
- **CentOS 8+**
- **Docker** (선택사항)
- **Nginx** (리버스 프록시)

### 배포 옵션
1. **전통적인 서버 배포**: systemd 서비스 등록
2. **Docker 컨테이너**: docker-compose 사용
3. **클라우드 배포**: AWS, GCP, Azure 지원

## 📞 지원 및 문의

### 문서
- **사용자 매뉴얼**: `wordpress-auto-poster-manual.pdf`
- **API 문서**: `/docs` 엔드포인트 (Swagger UI)

### 커뮤니티
- **GitHub Issues**: 버그 리포트 및 기능 요청
- **이메일 지원**: support@wordpress-auto-poster.com

## 📄 라이선스

MIT License - 자세한 내용은 `LICENSE` 파일 참조

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트들의 도움을 받았습니다:
- OpenAI API
- FastAPI
- React
- Tailwind CSS
- Shadcn/UI

---

**버전**: 2.0.0  
**릴리스 날짜**: 2024년 1월 20일  
**개발자**: WordPress Auto Poster 팀

🌟 **이제 프로덕션 환경에서 바로 사용할 수 있습니다!** 🌟

