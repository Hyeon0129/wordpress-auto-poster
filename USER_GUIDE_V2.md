# WordPress Auto Poster - 완전한 사용자 가이드 (v2.0)

## 🎯 개요

WordPress Auto Poster는 AI 기반의 고급 콘텐츠 자동 생성 및 포스팅 플랫폼입니다. Writesonic과 같은 전문 도구에서 영감을 받아 개발된 이 플랫폼은 SEO 최적화, 키워드 분석, 자동 포스팅 기능을 통합하여 제공합니다.

### 🌟 주요 특징

- **AI 기반 콘텐츠 생성**: OpenAI GPT를 활용한 고품질 콘텐츠 자동 생성
- **실시간 진행 상황 표시**: 5단계 콘텐츠 생성 과정 시각화
- **SEO 최적화**: 키워드 분석, 메타 태그 생성, 콘텐츠 최적화
- **키워드 분석**: 경쟁 강도 분석 및 관련 키워드 추천
- **워드프레스 연동**: 완전한 WordPress API 연동 및 자동 포스팅
- **현대적인 UI/UX**: React 기반의 반응형 웹 인터페이스
- **JWT 인증**: 안전한 사용자 인증 및 관리 시스템
- **다크모드 지원**: 사용자 편의성을 위한 테마 전환

## 🚀 빠른 시작

### 1. 시스템 요구사항

- **백엔드**: Python 3.11+, FastAPI, SQLite
- **프론트엔드**: Node.js 20+, React 18+, Vite
- **운영체제**: Linux, macOS, Windows
- **메모리**: 최소 4GB RAM 권장

### 2. 설치 및 실행

#### 자동 설치 (권장)
```bash
# 프로젝트 압축 해제
tar -xzf wordpress-auto-poster-v2.tar.gz
cd wordpress-auto-poster

# 자동 배포 스크립트 실행
chmod +x deploy.sh
./deploy.sh
```

#### 수동 설치
```bash
# 백엔드 설정
cd server
pip install -r requirements.txt

# 프론트엔드 설정
cd ../client
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일을 편집하여 필요한 설정 입력

# 백엔드 실행
cd ../server
uvicorn src.main:app --host 0.0.0.0 --port 8000

# 프론트엔드 실행 (새 터미널)
cd client
npm run dev
```

### 3. 초기 설정

1. **웹 브라우저에서 접속**: `http://localhost:3000`
2. **계정 생성**: 회원가입 버튼을 클릭하여 새 계정 생성
3. **로그인**: 생성한 계정으로 로그인

## 📱 사용자 인터페이스 가이드

### 메인 레이아웃

#### 사이드바 (왼쪽)
- **대시보드**: 전체 현황 및 통계
- **콘텐츠 생성**: AI 기반 콘텐츠 생성
- **키워드 분석**: 키워드 연구 및 분석
- **SEO 최적화**: SEO 도구 및 분석
- **포스트 기록**: 생성된 콘텐츠 이력
- **설정**: 시스템 및 연동 설정

#### 헤더 (상단)
- **API 상태 표시**: 실시간 API 연결 상태 (녹색 점멸)
- **다크모드 토글**: 라이트/다크 테마 전환
- **알림**: 시스템 알림 및 업데이트
- **사용자 프로필**: 계정 설정 및 로그아웃

#### 사이드바 하단
- **이번 달 사용량**: 포스트 생성 현황 및 제한
- **사용자 프로필**: 계정 정보 및 설정 접근

## 🎨 주요 기능 사용법

### 1. 콘텐츠 생성

#### 기본 설정
1. **메인 키워드 입력**: 타겟 키워드 설정
2. **콘텐츠 타입 선택**: 
   - 블로그 포스트
   - 제품 리뷰
   - 하우투 가이드
   - 리스트 형태 글
   - 뉴스 기사
3. **글의 톤 설정**:
   - 전문적
   - 캐주얼
   - 친근한
   - 권위적
4. **타겟 독자 선택**:
   - 일반
   - 초보자
   - 전문가
   - 전문직

#### 고급 설정
- **추가 키워드**: 쉼표로 구분하여 입력
- **추가 지시사항**: 특별한 요구사항 명시

#### 진행 상황 모니터링
콘텐츠 생성 시 5단계 진행 과정이 실시간으로 표시됩니다:
1. **키워드 분석**: SEO 키워드 분석 중
2. **AI 설정**: AI 모델 설정 중
3. **콘텐츠 생성**: AI가 콘텐츠를 생성 중
4. **SEO 최적화**: SEO 최적화 적용 중
5. **완료 처리**: 최종 검토 및 완료

#### 결과 활용
- **복사**: 클립보드로 콘텐츠 복사
- **다운로드**: 텍스트 파일로 저장
- **WordPress 포스팅**: 연동된 사이트에 직접 포스팅

### 2. 키워드 분석

#### 단일 키워드 분석
1. **키워드 입력**: 분석할 키워드 입력
2. **분석 결과 확인**:
   - 검색량
   - 경쟁 강도
   - 난이도 점수
   - CPC (클릭당 비용)
   - 트렌드 정보

#### 관련 키워드 추천
- 자동 생성된 관련 키워드 목록
- 각 키워드별 검색량 및 경쟁도 정보
- 관련성 점수 제공

#### 경쟁 분석
- 상위 경쟁사 분석
- 도메인 권위도 정보
- 콘텐츠 길이 분석
- 백링크 정보

### 3. 설정 관리

#### WordPress 연동
1. **설정 > WordPress 탭** 이동
2. **새 WordPress 사이트 추가** 클릭
3. **연동 정보 입력**:
   - 사이트 이름
   - 사이트 URL
   - 사용자명
   - 비밀번호 (Application Password 권장)
4. **연결 테스트** 실행
5. **사이트 추가** 완료

#### LLM 설정
1. **설정 > LLM 설정 탭** 이동
2. **제공자 선택**: OpenAI
3. **모델 선택**: gpt-3.5-turbo 또는 gpt-4
4. **API 키 입력**: OpenAI API 키
5. **설정 저장**

#### 프로필 설정
1. **사이드바 하단 프로필** 클릭
2. **프로필 설정** 선택
3. **개인정보 수정**:
   - 사용자명
   - 이메일
   - 비밀번호 변경

## 🔧 고급 설정

### 환경변수 설정

#### 백엔드 (.env)
```env
# 데이터베이스
DATABASE_URL=sqlite:///./wordpress_auto_poster.db

# JWT 설정
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI API
OPENAI_API_KEY=your-openai-api-key

# CORS 설정
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

#### 프론트엔드 (.env)
```env
# API 기본 URL
VITE_API_BASE_URL=http://localhost:8000

# 애플리케이션 설정
VITE_APP_NAME=WordPress Auto Poster
VITE_APP_VERSION=2.0.0
```

### 데이터베이스 관리

#### 백업
```bash
# SQLite 데이터베이스 백업
cp server/src/database/wordpress_auto_poster.db backup/
```

#### 복원
```bash
# 백업에서 복원
cp backup/wordpress_auto_poster.db server/src/database/
```

## 🚀 프로덕션 배포

### 1. 도커를 이용한 배포

#### Dockerfile (백엔드)
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Dockerfile (프론트엔드)
```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. 클라우드 배포

#### AWS EC2
1. **인스턴스 생성**: Ubuntu 22.04 LTS
2. **보안 그룹 설정**: 포트 80, 443, 8000 개방
3. **배포 스크립트 실행**: `./deploy.sh`

#### Vercel (프론트엔드)
```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 배포
cd client
vercel --prod
```

#### Railway (백엔드)
1. **GitHub 연동**: 저장소 연결
2. **환경변수 설정**: Railway 대시보드에서 설정
3. **자동 배포**: Git push 시 자동 배포

## 🔍 문제 해결

### 일반적인 문제

#### 1. 백엔드 서버가 시작되지 않음
```bash
# 의존성 재설치
pip install -r requirements.txt

# 포트 충돌 확인
lsof -i :8000

# 로그 확인
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --log-level debug
```

#### 2. 프론트엔드 빌드 오류
```bash
# 노드 모듈 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 정리
npm run build -- --force
```

#### 3. WordPress 연동 실패
- **URL 확인**: https:// 포함 여부
- **인증 정보**: Application Password 사용 권장
- **REST API**: WordPress REST API 활성화 확인
- **방화벽**: 서버 방화벽 설정 확인

#### 4. OpenAI API 오류
- **API 키**: 유효한 OpenAI API 키 확인
- **크레딧**: OpenAI 계정 크레딧 잔액 확인
- **요청 제한**: API 요청 제한 확인

### 로그 확인

#### 백엔드 로그
```bash
# 실시간 로그 확인
tail -f server/logs/app.log

# 오류 로그만 확인
grep ERROR server/logs/app.log
```

#### 프론트엔드 로그
- **브라우저 개발자 도구**: F12 > Console 탭
- **네트워크 탭**: API 요청/응답 확인

## 📊 성능 최적화

### 백엔드 최적화
- **데이터베이스 인덱싱**: 자주 조회되는 컬럼에 인덱스 추가
- **캐싱**: Redis를 이용한 API 응답 캐싱
- **비동기 처리**: 긴 작업에 대한 백그라운드 처리

### 프론트엔드 최적화
- **코드 분할**: React.lazy를 이용한 컴포넌트 지연 로딩
- **이미지 최적화**: WebP 형식 사용
- **번들 크기 최적화**: 불필요한 라이브러리 제거

## 🔐 보안 고려사항

### 인증 및 권한
- **JWT 토큰**: 안전한 토큰 관리
- **비밀번호 해싱**: bcrypt를 이용한 안전한 해싱
- **CORS 설정**: 허용된 도메인만 접근 가능

### 데이터 보호
- **API 키 보안**: 환경변수를 통한 안전한 관리
- **HTTPS**: 프로덕션 환경에서 HTTPS 사용 필수
- **입력 검증**: 모든 사용자 입력에 대한 검증

## 📈 모니터링 및 분석

### 시스템 모니터링
- **서버 상태**: CPU, 메모리, 디스크 사용량
- **API 응답 시간**: 평균 응답 시간 모니터링
- **오류율**: 4xx, 5xx 오류 발생률

### 사용자 분석
- **콘텐츠 생성 통계**: 일일/월간 생성량
- **키워드 분석 사용량**: 인기 키워드 트렌드
- **사용자 활동**: 로그인 빈도, 기능 사용률

## 🆘 지원 및 커뮤니티

### 기술 지원
- **이슈 리포팅**: GitHub Issues를 통한 버그 신고
- **기능 요청**: Feature Request 템플릿 사용
- **문서 개선**: 문서 오류 및 개선사항 제안

### 커뮤니티
- **사용자 포럼**: 사용자 간 정보 공유
- **개발자 가이드**: 커스터마이징 및 확장 가이드
- **업데이트 알림**: 새 버전 및 기능 업데이트

## 📝 라이선스 및 저작권

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 LICENSE 파일을 참조하세요.

---

**WordPress Auto Poster v2.0** - AI 기반 콘텐츠 자동화의 새로운 표준

마지막 업데이트: 2024년 6월 23일

