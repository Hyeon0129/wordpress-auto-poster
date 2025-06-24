# WordPress Auto Poster 배포 및 설치 가이드

## 개요

WordPress Auto Poster는 AI 기반 블로그 자동 포스팅 시스템으로, 키워드를 입력하면 고품질 콘텐츠를 자동으로 생성하고 WordPress 사이트에 직접 포스팅할 수 있는 프로덕션 수준의 웹 애플리케이션입니다.

## 시스템 요구사항

### 최소 요구사항
- **운영체제**: Ubuntu 20.04 LTS 이상, CentOS 8 이상, 또는 macOS 10.15 이상
- **메모리**: 8GB RAM (Ollama 사용 시 16GB 권장)
- **저장공간**: 20GB 이상의 여유 공간
- **네트워크**: 인터넷 연결 (LLM API 호출 및 WordPress 연동용)

### 권장 요구사항
- **운영체제**: Ubuntu 22.04 LTS
- **메모리**: 32GB RAM (대용량 LLM 모델 사용 시)
- **저장공간**: 100GB 이상 SSD
- **CPU**: 8코어 이상
- **네트워크**: 안정적인 고속 인터넷 연결

## 사전 준비사항

### 1. Node.js 설치
```bash
# Node.js 20.x 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 설치 확인
node --version
npm --version
```

### 2. Python 설치
```bash
# Python 3.11 설치
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# 설치 확인
python3.11 --version
```

### 3. pnpm 설치
```bash
# pnpm 설치
npm install -g pnpm

# 설치 확인
pnpm --version
```

## 설치 과정

### 1. 프로젝트 파일 압축 해제
```bash
# 다운로드한 압축 파일 압축 해제
tar -xzf wordpress-auto-poster.tar.gz
cd wordpress-auto-poster
```

### 2. 백엔드 설정 및 설치

#### 2.1 가상환경 생성 및 활성화
```bash
cd wordpress-auto-poster-backend
python3.11 -m venv venv
source venv/bin/activate
```

#### 2.2 Python 패키지 설치
```bash
pip install -r requirements.txt
```

#### 2.3 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집
nano .env
```

`.env` 파일 내용:
```env
# Flask 설정
FLASK_ENV=production
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///app.db

# LLM 설정 (기본값: Ollama)
DEFAULT_LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=qwen2.5:32b

# OpenAI 설정 (선택사항)
OPENAI_API_KEY=your-openai-api-key-here

# WordPress 설정
WP_DEFAULT_TIMEOUT=30

# 보안 설정
JWT_SECRET_KEY=your-jwt-secret-key-here
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

#### 2.4 데이터베이스 초기화
```bash
# 데이터베이스 마이그레이션 실행
python src/init_db.py
```

### 3. 프론트엔드 설정 및 설치

#### 3.1 의존성 설치
```bash
cd ../wordpress-auto-poster-frontend
pnpm install
```

#### 3.2 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env.local

# .env.local 파일 편집
nano .env.local
```

`.env.local` 파일 내용:
```env
# API 서버 URL
VITE_API_BASE_URL=http://localhost:5000

# 애플리케이션 설정
VITE_APP_NAME=WordPress Auto Poster
VITE_APP_VERSION=1.0.0
```

#### 3.3 프로덕션 빌드
```bash
pnpm run build
```

### 4. LLM 설정

#### 4.1 Ollama 설치 및 설정 (권장)
```bash
# Ollama 설치
curl -fsSL https://ollama.ai/install.sh | sh

# 모델 다운로드
ollama pull qwen2.5:32b

# Ollama 서비스 시작
ollama serve
```

#### 4.2 OpenAI API 설정 (대안)
OpenAI API를 사용하려면 `.env` 파일에 API 키를 설정하고 웹 인터페이스에서 LLM 제공자를 OpenAI로 변경하세요.

## 실행 방법

### 개발 환경에서 실행

#### 1. 백엔드 서버 시작
```bash
cd wordpress-auto-poster-backend
source venv/bin/activate
python src/main.py
```

#### 2. 프론트엔드 개발 서버 시작
```bash
cd wordpress-auto-poster-frontend
pnpm run dev
```

#### 3. 브라우저에서 접속
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:5000

### 프로덕션 환경에서 실행

#### 1. Nginx 설정
```bash
# Nginx 설치
sudo apt install -y nginx

# 설정 파일 생성
sudo nano /etc/nginx/sites-available/wordpress-auto-poster
```

Nginx 설정 파일 내용:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 프론트엔드 정적 파일 서빙
    location / {
        root /path/to/wordpress-auto-poster-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 백엔드 API 프록시
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 2. Nginx 활성화
```bash
# 설정 파일 활성화
sudo ln -s /etc/nginx/sites-available/wordpress-auto-poster /etc/nginx/sites-enabled/

# Nginx 재시작
sudo systemctl restart nginx
```

#### 3. 시스템 서비스 설정

백엔드 서비스 파일 생성:
```bash
sudo nano /etc/systemd/system/wordpress-auto-poster.service
```

서비스 파일 내용:
```ini
[Unit]
Description=WordPress Auto Poster Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/path/to/wordpress-auto-poster-backend
Environment=PATH=/path/to/wordpress-auto-poster-backend/venv/bin
ExecStart=/path/to/wordpress-auto-poster-backend/venv/bin/python src/main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

서비스 활성화:
```bash
sudo systemctl daemon-reload
sudo systemctl enable wordpress-auto-poster
sudo systemctl start wordpress-auto-poster
```

## 사용 방법

### 1. 초기 설정

#### 1.1 계정 생성
1. 웹 브라우저에서 애플리케이션에 접속
2. "회원가입" 탭을 클릭
3. 사용자명, 이메일, 비밀번호를 입력하여 계정 생성

#### 1.2 WordPress 사이트 연결
1. 로그인 후 "설정" 메뉴로 이동
2. "WordPress" 탭에서 "새 사이트 추가" 클릭
3. 다음 정보를 입력:
   - 사이트 이름: 구분하기 쉬운 이름
   - 사이트 URL: WordPress 사이트 주소
   - 사용자명: WordPress 관리자 계정
   - 비밀번호: WordPress 관리자 비밀번호

#### 1.3 LLM 제공자 설정
1. "설정" > "LLM 설정" 탭으로 이동
2. 사용할 LLM 제공자 선택:
   - **Ollama** (권장): 로컬에서 실행되는 오픈소스 LLM
   - **OpenAI**: GPT 모델 사용 (API 키 필요)

### 2. 콘텐츠 생성 및 포스팅

#### 2.1 기본 콘텐츠 생성
1. "콘텐츠 생성" 메뉴로 이동
2. 메인 키워드 입력 (예: "인공지능", "워드프레스 SEO")
3. 콘텐츠 타입 선택:
   - 일반 블로그 포스트
   - 제품 리뷰
   - How-to 가이드
4. 추가 정보 입력 (선택사항)
5. "콘텐츠 생성" 버튼 클릭

#### 2.2 콘텐츠 편집 및 검토
1. 생성된 콘텐츠를 "마크다운" 탭에서 편집
2. "미리보기" 탭에서 최종 결과 확인
3. 제목, 메타 디스크립션 등 SEO 정보 입력

#### 2.3 WordPress에 포스팅
1. 포스트 설정에서 발행 상태 선택 (초안/즉시 발행)
2. "워드프레스에 포스팅" 버튼 클릭
3. 포스팅 완료 확인

### 3. SEO 최적화

#### 3.1 SEO 분석
1. "SEO 최적화" 메뉴로 이동
2. 분석할 콘텐츠와 메타데이터 입력
3. "SEO 분석 시작" 버튼 클릭
4. 분석 결과 및 개선 제안 확인

#### 3.2 키워드 분석
1. "키워드 분석" 메뉴로 이동
2. 분석할 키워드 입력
3. 관련 키워드 및 콘텐츠 제안 확인
4. 제목 및 메타 디스크립션 제안 활용

### 4. 포스팅 기록 관리

#### 4.1 포스트 목록 확인
1. "포스팅 기록" 메뉴로 이동
2. 필터 및 검색 기능을 사용하여 원하는 포스트 찾기
3. 포스트 상태, 조회수, 발행일 등 정보 확인

#### 4.2 포스트 관리
1. 각 포스트의 편집, 삭제 버튼 활용
2. 외부 링크 버튼으로 실제 WordPress 포스트 확인
3. 포스팅 통계 정보 모니터링

## 문제 해결

### 일반적인 문제

#### 1. 백엔드 서버 연결 실패
**증상**: 프론트엔드에서 "서버에 연결할 수 없습니다" 오류
**해결방법**:
```bash
# 백엔드 서버 상태 확인
ps aux | grep python

# 포트 사용 확인
netstat -tlnp | grep 5000

# 서버 재시작
cd wordpress-auto-poster-backend
source venv/bin/activate
python src/main.py
```

#### 2. Ollama 연결 실패
**증상**: LLM 콘텐츠 생성 시 "Ollama 서버에 연결할 수 없습니다" 오류
**해결방법**:
```bash
# Ollama 서비스 상태 확인
systemctl status ollama

# Ollama 서비스 시작
ollama serve

# 모델 다운로드 확인
ollama list
```

#### 3. WordPress 연결 실패
**증상**: "WordPress 사이트에 연결할 수 없습니다" 오류
**해결방법**:
1. WordPress 사이트 URL이 정확한지 확인
2. WordPress 관리자 계정 정보가 올바른지 확인
3. WordPress 사이트에서 REST API가 활성화되어 있는지 확인
4. 방화벽이나 보안 플러그인이 API 접근을 차단하지 않는지 확인

#### 4. 메모리 부족 오류
**증상**: 대용량 LLM 모델 사용 시 메모리 부족 오류
**해결방법**:
1. 더 작은 모델 사용 (예: qwen2.5:7b)
2. 시스템 메모리 증설
3. 스왑 파일 설정:
```bash
# 8GB 스왑 파일 생성
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 로그 확인

#### 백엔드 로그
```bash
# 실시간 로그 확인
tail -f wordpress-auto-poster-backend/logs/app.log

# 시스템 서비스 로그 확인
sudo journalctl -u wordpress-auto-poster -f
```

#### 프론트엔드 로그
브라우저 개발자 도구 (F12) > Console 탭에서 JavaScript 오류 확인

#### Nginx 로그
```bash
# 접근 로그
sudo tail -f /var/log/nginx/access.log

# 오류 로그
sudo tail -f /var/log/nginx/error.log
```

## 보안 고려사항

### 1. 환경 변수 보안
- `.env` 파일에 민감한 정보 저장
- 프로덕션 환경에서는 환경 변수로 설정
- API 키 등은 절대 소스 코드에 하드코딩하지 않음

### 2. HTTPS 설정
프로덕션 환경에서는 반드시 HTTPS 사용:
```bash
# Let's Encrypt 인증서 설치
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 3. 방화벽 설정
```bash
# UFW 방화벽 설정
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 4. 정기 업데이트
```bash
# 시스템 패키지 업데이트
sudo apt update && sudo apt upgrade

# Python 패키지 업데이트
pip install --upgrade -r requirements.txt

# Node.js 패키지 업데이트
pnpm update
```

## 성능 최적화

### 1. 데이터베이스 최적화
- 정기적인 데이터베이스 백업
- 인덱스 최적화
- 오래된 로그 데이터 정리

### 2. 캐싱 설정
- Nginx에서 정적 파일 캐싱 설정
- Redis를 사용한 세션 캐싱 (선택사항)

### 3. 모니터링 설정
```bash
# htop 설치 (시스템 모니터링)
sudo apt install htop

# 시스템 리소스 모니터링
htop
```

## 백업 및 복구

### 1. 데이터베이스 백업
```bash
# SQLite 데이터베이스 백업
cp wordpress-auto-poster-backend/app.db backup/app_$(date +%Y%m%d_%H%M%S).db
```

### 2. 설정 파일 백업
```bash
# 환경 설정 파일 백업
tar -czf backup/config_$(date +%Y%m%d_%H%M%S).tar.gz \
  wordpress-auto-poster-backend/.env \
  wordpress-auto-poster-frontend/.env.local \
  /etc/nginx/sites-available/wordpress-auto-poster
```

### 3. 자동 백업 스크립트
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/path/to/backup"
DATE=$(date +%Y%m%d_%H%M%S)

# 데이터베이스 백업
cp /path/to/wordpress-auto-poster-backend/app.db $BACKUP_DIR/app_$DATE.db

# 설정 파일 백업
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
  /path/to/wordpress-auto-poster-backend/.env \
  /path/to/wordpress-auto-poster-frontend/.env.local

# 7일 이상 된 백업 파일 삭제
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

crontab에 등록:
```bash
# 매일 새벽 2시에 백업 실행
0 2 * * * /path/to/backup.sh
```

## 업데이트 가이드

### 1. 애플리케이션 업데이트
```bash
# 서비스 중지
sudo systemctl stop wordpress-auto-poster

# 백업 생성
./backup.sh

# 새 버전 파일로 교체
tar -xzf wordpress-auto-poster-v2.0.0.tar.gz

# 의존성 업데이트
cd wordpress-auto-poster-backend
source venv/bin/activate
pip install -r requirements.txt

cd ../wordpress-auto-poster-frontend
pnpm install
pnpm run build

# 데이터베이스 마이그레이션 (필요시)
python src/migrate.py

# 서비스 재시작
sudo systemctl start wordpress-auto-poster
```

### 2. 설정 파일 마이그레이션
새 버전에서 추가된 환경 변수가 있는 경우 `.env` 파일을 업데이트하세요.

## 라이선스 및 지원

### 라이선스
이 소프트웨어는 MIT 라이선스 하에 배포됩니다.

### 기술 지원
- 문서: 이 가이드 및 소스 코드 내 주석 참조
- 이슈 리포팅: GitHub Issues 또는 이메일을 통해 문의

### 커뮤니티
- 사용자 커뮤니티 포럼 참여
- 기능 개선 제안 및 피드백 환영

---

이 가이드를 따라 WordPress Auto Poster를 성공적으로 설치하고 운영할 수 있습니다. 추가 질문이나 문제가 발생하면 기술 지원 채널을 통해 문의해 주세요.

