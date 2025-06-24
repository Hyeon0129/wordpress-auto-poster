# 워드프레스 전용 자동 블로그 포스팅 에이전트 시스템 설계서

**작성자:** Manus AI  
**작성일:** 2025년 6월 20일  
**프로젝트:** 프로덕션 수준의 워드프레스 자동 포스팅 대시보드

---

## 1. 시스템 개요

본 시스템은 워드프레스 전용 자동 블로그 포스팅 에이전트로, 프로덕션 환경에서 즉시 사용 가능한 수준의 품질을 목표로 합니다. 사용자는 다크 테마 기반의 직관적인 대시보드를 통해 키워드 입력부터 워드프레스 자동 포스팅까지 전체 과정을 관리할 수 있습니다.

### 1.1 핵심 기능
- **워드프레스 API 연동**: REST API 및 JWT 토큰 기반 인증
- **LLM 선택 기능**: Ollama 및 OpenAI API 중 선택 가능
- **실시간 콘텐츠 편집**: 마크다운을 실제 블로그 글 형태로 렌더링
- **SEO 최적화**: 사용자가 검토 및 수정 가능한 SEO 제안
- **키워드 분석**: 관련 키워드 및 검색량 분석
- **다크 테마 UI**: 전문적이고 현대적인 대시보드 인터페이스

### 1.2 타겟 사용자
- 워드프레스 블로그 운영자
- 콘텐츠 마케터
- SEO 전문가
- 디지털 마케팅 에이전시

---

## 2. 시스템 아키텍처

### 2.1 전체 아키텍처
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React)       │◄──►│   (Flask)       │◄──►│   Services      │
│                 │    │                 │    │                 │
│ - Dashboard UI  │    │ - API Gateway   │    │ - WordPress API │
│ - Content Edit  │    │ - Auth Manager  │    │ - OpenAI API    │
│ - SEO Tools     │    │ - LLM Router    │    │ - Ollama        │
│ - Settings      │    │ - WP Connector  │    │ - Search APIs   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database      │
                    │   (PostgreSQL)  │
                    │                 │
                    │ - User Settings │
                    │ - Post History  │
                    │ - API Keys      │
                    │ - Templates     │
                    └─────────────────┘
```

### 2.2 기술 스택

#### 프론트엔드
- **React 18**: 최신 React 기능 활용
- **TypeScript**: 타입 안정성 확보
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **shadcn/ui**: 고품질 컴포넌트 라이브러리
- **React Query**: 서버 상태 관리
- **React Hook Form**: 폼 상태 관리
- **Monaco Editor**: 코드 에디터 (콘텐츠 편집용)
- **React Markdown**: 마크다운 렌더링

#### 백엔드
- **Flask**: 경량 웹 프레임워크
- **SQLAlchemy**: ORM
- **Flask-JWT-Extended**: JWT 토큰 관리
- **Flask-CORS**: CORS 처리
- **Celery**: 비동기 작업 처리
- **Redis**: 캐시 및 세션 스토어

#### 데이터베이스
- **PostgreSQL**: 메인 데이터베이스
- **Redis**: 캐시 및 세션

#### 외부 서비스
- **WordPress REST API**: 포스팅 연동
- **OpenAI API**: GPT 모델 사용
- **Ollama**: 로컬 LLM 서비스
- **Google Search API**: 키워드 분석

---

## 3. 데이터베이스 스키마

### 3.1 사용자 관리
```sql
-- 사용자 테이블
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 사용자 설정 테이블
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, setting_key)
);
```

### 3.2 워드프레스 연동
```sql
-- 워드프레스 사이트 설정
CREATE TABLE wordpress_sites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    site_name VARCHAR(100) NOT NULL,
    site_url VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL, -- 암호화 저장
    jwt_token TEXT,
    token_expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 카테고리 및 태그 매핑
CREATE TABLE wp_categories (
    id SERIAL PRIMARY KEY,
    site_id INTEGER REFERENCES wordpress_sites(id) ON DELETE CASCADE,
    wp_category_id INTEGER NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    category_slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wp_tags (
    id SERIAL PRIMARY KEY,
    site_id INTEGER REFERENCES wordpress_sites(id) ON DELETE CASCADE,
    wp_tag_id INTEGER NOT NULL,
    tag_name VARCHAR(100) NOT NULL,
    tag_slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 콘텐츠 관리
```sql
-- 포스트 히스토리
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    site_id INTEGER REFERENCES wordpress_sites(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    keyword VARCHAR(100),
    wp_post_id INTEGER,
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, failed
    seo_title VARCHAR(255),
    seo_description TEXT,
    featured_image_url VARCHAR(500),
    categories INTEGER[],
    tags INTEGER[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

-- SEO 분석 결과
CREATE TABLE seo_analysis (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    keyword_density DECIMAL(5,2),
    readability_score INTEGER,
    meta_title_length INTEGER,
    meta_description_length INTEGER,
    suggestions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.4 LLM 설정
```sql
-- LLM 제공자 설정
CREATE TABLE llm_providers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider_name VARCHAR(50) NOT NULL, -- 'openai', 'ollama'
    api_key VARCHAR(255), -- OpenAI용
    base_url VARCHAR(255), -- Ollama용
    model_name VARCHAR(100),
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 콘텐츠 템플릿
CREATE TABLE content_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    template_name VARCHAR(100) NOT NULL,
    template_content TEXT NOT NULL,
    template_type VARCHAR(50), -- 'blog_post', 'product_review', 'how_to'
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. API 설계

### 4.1 인증 API
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/register
```

### 4.2 워드프레스 연동 API
```
GET    /api/wordpress/sites
POST   /api/wordpress/sites
PUT    /api/wordpress/sites/{id}
DELETE /api/wordpress/sites/{id}
POST   /api/wordpress/sites/{id}/test-connection
GET    /api/wordpress/sites/{id}/categories
GET    /api/wordpress/sites/{id}/tags
POST   /api/wordpress/sites/{id}/posts
```

### 4.3 콘텐츠 생성 API
```
POST /api/content/generate
POST /api/content/analyze-keyword
POST /api/content/seo-optimize
POST /api/content/preview
```

### 4.4 LLM 설정 API
```
GET    /api/llm/providers
POST   /api/llm/providers
PUT    /api/llm/providers/{id}
DELETE /api/llm/providers/{id}
POST   /api/llm/providers/{id}/test
```

---

## 5. UI/UX 설계

### 5.1 다크 테마 디자인 시스템

#### 색상 팔레트
```css
:root {
  /* Primary Colors */
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #2a2a2a;
  
  /* Text Colors */
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --text-muted: #666666;
  
  /* Accent Colors */
  --accent-primary: #3b82f6;
  --accent-secondary: #10b981;
  --accent-warning: #f59e0b;
  --accent-danger: #ef4444;
  
  /* Border Colors */
  --border-primary: #333333;
  --border-secondary: #444444;
}
```

#### 타이포그래피
```css
/* Headings */
.heading-xl { font-size: 2.5rem; font-weight: 700; }
.heading-lg { font-size: 2rem; font-weight: 600; }
.heading-md { font-size: 1.5rem; font-weight: 600; }
.heading-sm { font-size: 1.25rem; font-weight: 500; }

/* Body Text */
.text-lg { font-size: 1.125rem; line-height: 1.75; }
.text-base { font-size: 1rem; line-height: 1.5; }
.text-sm { font-size: 0.875rem; line-height: 1.25; }
```

### 5.2 레이아웃 구조

#### 메인 대시보드
```
┌─────────────────────────────────────────────────────────────┐
│ Header (Logo, User Menu, Settings)                         │
├─────────────────────────────────────────────────────────────┤
│ Sidebar │ Main Content Area                                │
│         │                                                  │
│ - 대시보드 │ ┌─────────────────────────────────────────────┐ │
│ - 포스팅   │ │ Content Generation Panel                    │ │
│ - SEO     │ │                                             │ │
│ - 키워드   │ │ ┌─────────────┐ ┌─────────────────────────┐ │ │
│ - 설정     │ │ │ Keyword     │ │ Generated Content       │ │ │
│ - 히스토리 │ │ │ Input       │ │ Preview                 │ │ │
│         │ │ └─────────────┘ └─────────────────────────┘ │ │
│         │ │                                             │ │
│         │ │ ┌─────────────────────────────────────────────┐ │ │
│         │ │ │ SEO Optimization Panel                      │ │ │
│         │ │ └─────────────────────────────────────────────┘ │ │
│         │ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 주요 컴포넌트

#### 콘텐츠 에디터
- **Monaco Editor**: 마크다운 편집
- **Live Preview**: 실시간 HTML 렌더링
- **Split View**: 편집/미리보기 분할 화면
- **Toolbar**: 포맷팅 도구

#### SEO 최적화 패널
- **키워드 밀도 분석**: 실시간 계산
- **메타 태그 편집**: 제목, 설명 수정 가능
- **가독성 점수**: Flesch-Kincaid 기반
- **제안 사항**: AI 기반 개선 제안

#### 설정 대시보드
- **워드프레스 연결**: 사이트 추가/관리
- **LLM 설정**: 제공자 선택 및 API 키 관리
- **템플릿 관리**: 콘텐츠 템플릿 생성/편집
- **사용자 프로필**: 계정 정보 관리

---

## 6. 보안 고려사항

### 6.1 데이터 보호
- **API 키 암호화**: AES-256 암호화로 저장
- **패스워드 해싱**: bcrypt 사용
- **JWT 토큰**: 짧은 만료 시간 설정
- **HTTPS 강제**: 모든 통신 암호화

### 6.2 접근 제어
- **역할 기반 접근**: 사용자별 권한 관리
- **API 레이트 리미팅**: 남용 방지
- **CORS 정책**: 허용된 도메인만 접근
- **입력 검증**: SQL 인젝션 방지

### 6.3 감사 로그
- **사용자 활동 로그**: 로그인, 포스팅 기록
- **API 호출 로그**: 외부 서비스 사용 추적
- **오류 로그**: 시스템 오류 모니터링

---

## 7. 성능 최적화

### 7.1 프론트엔드 최적화
- **코드 스플리팅**: 라우트별 번들 분할
- **이미지 최적화**: WebP 포맷 사용
- **캐싱 전략**: 브라우저 캐시 활용
- **번들 최적화**: Tree shaking 적용

### 7.2 백엔드 최적화
- **데이터베이스 인덱싱**: 쿼리 성능 향상
- **Redis 캐싱**: 자주 사용되는 데이터 캐시
- **비동기 처리**: Celery를 통한 백그라운드 작업
- **커넥션 풀링**: 데이터베이스 연결 최적화

### 7.3 LLM 최적화
- **응답 캐싱**: 동일 키워드 요청 캐시
- **배치 처리**: 여러 요청 묶어서 처리
- **토큰 최적화**: 프롬프트 길이 최적화
- **폴백 메커니즘**: API 실패 시 대체 방안

---

## 8. 배포 및 운영

### 8.1 배포 환경
- **Docker 컨테이너**: 일관된 배포 환경
- **Docker Compose**: 로컬 개발 환경
- **Nginx**: 리버스 프록시 및 정적 파일 서빙
- **SSL 인증서**: Let's Encrypt 자동 갱신

### 8.2 모니터링
- **애플리케이션 모니터링**: 성능 지표 추적
- **로그 집계**: 중앙화된 로그 관리
- **알림 시스템**: 오류 발생 시 즉시 알림
- **백업 전략**: 정기적인 데이터베이스 백업

### 8.3 확장성
- **수평 확장**: 로드 밸런서를 통한 인스턴스 확장
- **데이터베이스 샤딩**: 대용량 데이터 처리
- **CDN 활용**: 글로벌 콘텐츠 배포
- **마이크로서비스**: 기능별 서비스 분리

---

이 설계서를 바탕으로 프로덕션 수준의 워드프레스 자동 포스팅 에이전트를 개발하여, 사용자가 직관적이고 효율적으로 블로그 콘텐츠를 생성하고 관리할 수 있는 플랫폼을 구축하겠습니다.

