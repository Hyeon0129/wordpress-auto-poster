# WordPress Auto Poster - 완전한 사용자 가이드

## 개요

WordPress Auto Poster는 AI 기반의 워드프레스 자동화 웹 플랫폼으로, SEO 최적화된 고품질 콘텐츠를 자동으로 생성하고 워드프레스 사이트에 포스팅하여 수익화를 도와주는 완전한 솔루션입니다.

### 주요 기능

- **AI 기반 콘텐츠 생성**: OpenAI GPT를 활용한 고품질 콘텐츠 자동 생성
- **SEO 최적화**: 키워드 분석, 메타 태그 생성, 콘텐츠 최적화
- **키워드 분석**: 경쟁 강도 분석 및 관련 키워드 추천
- **자동 포스팅**: 워드프레스 사이트에 자동으로 포스트 발행
- **대량 생성**: 여러 키워드로 한 번에 콘텐츠 생성
- **사용자 관리**: JWT 기반 인증 시스템
- **현대적인 UI/UX**: React 기반의 반응형 웹 인터페이스

### 기술 스택

**백엔드:**
- FastAPI (Python)
- SQLAlchemy (ORM)
- JWT 인증
- OpenAI API
- WordPress REST API

**프론트엔드:**
- React 18
- Vite
- Tailwind CSS
- Shadcn/ui 컴포넌트
- Recharts (차트)

**데이터베이스:**
- SQLite (개발용)
- PostgreSQL (프로덕션 권장)

## 시스템 요구사항

- Python 3.11+
- Node.js 20+
- npm 또는 yarn
- 최소 2GB RAM
- 1GB 디스크 공간

## 설치 및 설정

### 1. 프로젝트 다운로드

```bash
# GitHub에서 클론
git clone https://github.com/Hyeon0129/wordpress-auto-poster
cd wordpress-auto-poster
```

### 2. 백엔드 설정

```bash
# 가상환경 생성 (권장)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 또는
venv\Scripts\activate  # Windows

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
```

#### 환경변수 설정 (.env 파일)

```env
# 데이터베이스
DATABASE_URL=sqlite:///./wordpress_auto_poster.db

# JWT 설정
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI API (선택사항 - 없으면 데모 모드)
OPENAI_API_KEY=your-openai-api-key-here

# CORS 설정
CORS_ORIGINS=["http://localhost:3000", "https://your-domain.com"]

# 기타 설정
DEBUG=True
LOG_LEVEL=INFO
```

### 3. 프론트엔드 설정

```bash
cd client

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
```

#### 프론트엔드 환경변수 (.env.local)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=WordPress Auto Poster
VITE_APP_VERSION=1.0.0
```

### 4. 데이터베이스 초기화

```bash
cd server
python -c "
from src.db import engine, Base
from src.models import *
Base.metadata.create_all(bind=engine)
print('데이터베이스 초기화 완료')
"
```

## 실행 방법

### 개발 환경

#### 백엔드 서버 실행

```bash
cd server
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

서버가 시작되면 다음 URL에서 확인할 수 있습니다:
- API 문서: http://localhost:8000/docs
- 대체 API 문서: http://localhost:8000/redoc

#### 프론트엔드 서버 실행

```bash
cd client
npm run dev
```

프론트엔드는 http://localhost:3000에서 실행됩니다.

### 프로덕션 환경

#### 백엔드 배포

```bash
cd server

# Gunicorn 설치 (프로덕션 서버)
pip install gunicorn

# 프로덕션 서버 실행
gunicorn src.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### 프론트엔드 배포

```bash
cd client

# 프로덕션 빌드
npm run build

# 빌드된 파일은 dist/ 폴더에 생성됩니다
# 웹 서버(Nginx, Apache 등)에서 dist/ 폴더를 서빙하세요
```

## 파일 구조 설명

### 백엔드 구조 (server/)

```
server/
├── src/
│   ├── main.py              # FastAPI 애플리케이션 진입점
│   ├── db.py                # 데이터베이스 설정
│   ├── models/              # 데이터베이스 모델
│   │   ├── __init__.py
│   │   ├── user.py          # 사용자 모델
│   │   ├── content.py       # 콘텐츠 모델
│   │   └── wordpress.py     # 워드프레스 연동 모델
│   ├── routes/              # API 라우터
│   │   ├── __init__.py
│   │   ├── auth.py          # 인증 관련 API
│   │   ├── content.py       # 콘텐츠 생성 API
│   │   ├── seo.py           # SEO 분석 API
│   │   ├── keyword_analysis.py  # 키워드 분석 API
│   │   └── wordpress.py     # 워드프레스 연동 API
│   ├── services/            # 비즈니스 로직
│   │   ├── auth_service.py  # 인증 서비스
│   │   ├── content_generator.py  # 콘텐츠 생성 서비스
│   │   ├── seo_service.py   # SEO 분석 서비스
│   │   ├── keyword_analysis.py  # 키워드 분석 서비스
│   │   └── wordpress_service.py  # 워드프레스 서비스
│   └── utils/               # 유틸리티
│       ├── jwt_utils.py     # JWT 관련 유틸리티
│       └── dependencies.py  # FastAPI 의존성
├── requirements.txt         # Python 의존성
└── .env.example            # 환경변수 예시
```

### 프론트엔드 구조 (client/)

```
client/
├── src/
│   ├── App.jsx             # 메인 애플리케이션 컴포넌트
│   ├── main.jsx            # React 진입점
│   ├── components/         # React 컴포넌트
│   │   ├── ui/             # 기본 UI 컴포넌트 (shadcn/ui)
│   │   ├── Dashboard.jsx   # 대시보드 컴포넌트
│   │   ├── Login.jsx       # 로그인 컴포넌트
│   │   ├── Sidebar.jsx     # 사이드바 컴포넌트
│   │   ├── Header.jsx      # 헤더 컴포넌트
│   │   └── ContentGenerator.jsx  # 콘텐츠 생성 컴포넌트
│   ├── contexts/           # React 컨텍스트
│   │   ├── AuthContext.jsx # 인증 컨텍스트
│   │   └── ThemeContext.jsx # 테마 컨텍스트
│   ├── hooks/              # 커스텀 훅
│   ├── utils/              # 유틸리티 함수
│   └── styles/             # 스타일 파일
├── public/                 # 정적 파일
├── package.json            # Node.js 의존성
├── vite.config.js          # Vite 설정
├── tailwind.config.js      # Tailwind CSS 설정
└── .env.example           # 환경변수 예시
```

## 주요 기능 사용법

### 1. 회원가입 및 로그인

1. 웹사이트에 접속하면 로그인 화면이 표시됩니다
2. "회원가입" 탭을 클릭하여 새 계정을 생성하세요
3. 필요한 정보를 입력하고 회원가입을 완료하세요
4. 로그인하여 대시보드에 접근하세요

### 2. 콘텐츠 생성

#### 단일 콘텐츠 생성

1. 사이드바에서 "콘텐츠 생성" 메뉴를 클릭
2. "단일 생성" 탭에서 다음 정보를 입력:
   - **메인 키워드**: 콘텐츠의 주요 키워드
   - **콘텐츠 유형**: 블로그 포스트, 뉴스 기사 등
   - **글의 톤**: 전문적, 친근한, 공식적 등
   - **타겟 독자**: 일반, 초보자, 전문가 등
   - **추가 키워드**: 관련 키워드 (선택사항)
   - **추가 지시사항**: 특별한 요구사항 (선택사항)
3. "콘텐츠 생성" 버튼을 클릭
4. 생성된 콘텐츠를 확인하고 복사 또는 다운로드

#### 대량 콘텐츠 생성

1. "대량 생성" 탭을 선택
2. 키워드 목록을 한 줄에 하나씩 입력 (최대 10개)
3. 공통 설정을 선택 (콘텐츠 유형, 톤)
4. "대량 생성 시작" 버튼을 클릭
5. 생성 결과를 확인하고 개별적으로 다운로드

### 3. SEO 분석

1. "SEO 최적화" 메뉴에서 키워드를 입력
2. SEO 점수, 키워드 밀도, 경쟁 강도 등을 확인
3. 개선 제안사항을 참고하여 콘텐츠를 최적화

### 4. 키워드 분석

1. "키워드 분석" 메뉴에서 분석할 키워드를 입력
2. 검색량, 경쟁 강도, 관련 키워드 등을 확인
3. 최적의 키워드를 선택하여 콘텐츠 생성에 활용

### 5. 워드프레스 연동

1. "워드프레스 연동" 메뉴에서 사이트 정보를 입력:
   - **사이트 URL**: 워드프레스 사이트 주소
   - **사용자명**: 워드프레스 관리자 계정
   - **애플리케이션 비밀번호**: 워드프레스에서 생성한 앱 비밀번호
2. "연결 테스트" 버튼으로 연결을 확인
3. 생성된 콘텐츠를 선택하여 자동 포스팅

## API 사용법

### 인증

모든 API 요청에는 JWT 토큰이 필요합니다.

```bash
# 로그인
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'

# 응답에서 access_token을 받아 헤더에 포함
curl -X GET "http://localhost:8000/api/content/templates" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 주요 API 엔드포인트

#### 인증 관련
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보
- `POST /api/auth/refresh` - 토큰 갱신

#### 콘텐츠 생성
- `POST /api/content/generate-advanced` - 고급 콘텐츠 생성
- `POST /api/content/bulk-generate` - 대량 콘텐츠 생성
- `GET /api/content/content-templates` - 콘텐츠 템플릿 조회
- `GET /api/content/tone-options` - 톤 옵션 조회

#### SEO 분석
- `POST /api/seo/analyze-keyword` - 키워드 SEO 분석
- `POST /api/seo/analyze-content` - 콘텐츠 SEO 분석
- `GET /api/seo/trending-keywords` - 트렌딩 키워드 조회

#### 키워드 분석
- `POST /api/keyword-analysis/analyze` - 키워드 분석
- `POST /api/keyword-analysis/competition` - 경쟁 강도 분석
- `GET /api/keyword-analysis/suggestions` - 키워드 제안

#### 워드프레스 연동
- `POST /api/wordpress/connect` - 워드프레스 사이트 연결
- `POST /api/wordpress/test-connection` - 연결 테스트
- `POST /api/wordpress/publish` - 포스트 발행
- `GET /api/wordpress/sites` - 연결된 사이트 목록

## 환경 설정

### OpenAI API 설정

1. OpenAI 웹사이트에서 API 키를 발급받으세요
2. `.env` 파일에 `OPENAI_API_KEY`를 설정하세요
3. API 키가 없으면 데모 모드로 동작합니다

### 워드프레스 설정

1. 워드프레스 관리자 페이지에서 "사용자 > 프로필"로 이동
2. "애플리케이션 비밀번호" 섹션에서 새 비밀번호를 생성
3. 생성된 비밀번호를 플랫폼에서 사용

### 데이터베이스 설정

#### SQLite (기본)
- 별도 설정 불필요
- 파일 기반 데이터베이스

#### PostgreSQL (프로덕션 권장)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/wordpress_auto_poster
```

#### MySQL
```env
DATABASE_URL=mysql://username:password@localhost:3306/wordpress_auto_poster
```

## 보안 설정

### JWT 보안
- `JWT_SECRET_KEY`를 강력한 랜덤 문자열로 설정
- 토큰 만료 시간을 적절히 설정
- HTTPS 사용 권장

### CORS 설정
- 프로덕션에서는 특정 도메인만 허용
- 개발 환경에서만 와일드카드 사용

### 환경변수 보안
- `.env` 파일을 버전 관리에 포함하지 마세요
- 프로덕션에서는 환경변수를 안전하게 관리하세요

## 문제 해결

### 일반적인 문제

#### 1. 백엔드 서버가 시작되지 않는 경우
```bash
# 의존성 재설치
pip install -r requirements.txt

# 포트 충돌 확인
lsof -i :8000

# 다른 포트 사용
uvicorn src.main:app --port 8001
```

#### 2. 프론트엔드 빌드 오류
```bash
# 노드 모듈 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 클리어
npm run build -- --force
```

#### 3. 데이터베이스 연결 오류
```bash
# 데이터베이스 재초기화
rm wordpress_auto_poster.db
python -c "from src.db import engine, Base; from src.models import *; Base.metadata.create_all(bind=engine)"
```

#### 4. OpenAI API 오류
- API 키가 올바른지 확인
- API 사용량 한도 확인
- 네트워크 연결 확인

### 로그 확인

#### 백엔드 로그
```bash
# 개발 환경
uvicorn src.main:app --log-level debug

# 프로덕션 환경
gunicorn src.main:app --log-level info --access-logfile access.log --error-logfile error.log
```

#### 프론트엔드 로그
- 브라우저 개발자 도구의 콘솔 탭 확인
- 네트워크 탭에서 API 요청 상태 확인

## 성능 최적화

### 백엔드 최적화
- 데이터베이스 인덱스 추가
- 캐싱 시스템 도입 (Redis)
- 비동기 처리 활용
- API 응답 압축

### 프론트엔드 최적화
- 코드 스플리팅
- 이미지 최적화
- CDN 사용
- 브라우저 캐싱 활용

### 데이터베이스 최적화
- 정기적인 백업
- 인덱스 최적화
- 쿼리 성능 모니터링

## 확장 가능성

### 추가 기능 개발
- 소셜 미디어 연동
- 이메일 마케팅 통합
- 고급 분석 대시보드
- 다국어 지원

### 스케일링
- 마이크로서비스 아키텍처
- 컨테이너화 (Docker)
- 클라우드 배포 (AWS, GCP, Azure)
- 로드 밸런싱

## 라이선스 및 지원

### 라이선스
이 프로젝트는 MIT 라이선스 하에 배포됩니다.

### 지원
- GitHub Issues를 통한 버그 리포트
- 기능 요청 및 개선 제안
- 커뮤니티 기여 환영

## 결론

WordPress Auto Poster는 현대적인 기술 스택을 기반으로 구축된 완전한 워드프레스 자동화 솔루션입니다. AI 기반 콘텐츠 생성부터 SEO 최적화, 자동 포스팅까지 모든 과정을 자동화하여 효율적인 콘텐츠 마케팅을 가능하게 합니다.

지속적인 업데이트와 개선을 통해 더욱 강력하고 사용하기 쉬운 플랫폼으로 발전시켜 나가겠습니다.

