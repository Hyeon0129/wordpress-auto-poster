#!/bin/bash

# WordPress Auto Poster 배포 스크립트
# 이 스크립트는 프로덕션 환경에서 애플리케이션을 배포하는 데 사용됩니다.

set -e  # 오류 발생 시 스크립트 중단

echo "🚀 WordPress Auto Poster 배포 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 환경 변수 확인
check_environment() {
    print_status "환경 변수 확인 중..."
    
    if [ ! -f ".env" ]; then
        print_warning ".env 파일이 없습니다. .env.example을 복사하여 설정하세요."
        cp .env.example .env
        print_warning ".env 파일을 편집하여 필요한 설정을 입력하세요."
        exit 1
    fi
    
    print_success "환경 변수 확인 완료"
}

# 의존성 설치
install_dependencies() {
    print_status "백엔드 의존성 설치 중..."
    
    # Python 가상환경 확인
    if [ ! -d "venv" ]; then
        print_status "Python 가상환경 생성 중..."
        python3 -m venv venv
    fi
    
    # 가상환경 활성화
    source venv/bin/activate
    
    # Python 의존성 설치
    pip install --upgrade pip
    pip install -r requirements.txt
    
    print_success "백엔드 의존성 설치 완료"
    
    print_status "프론트엔드 의존성 설치 중..."
    cd client
    npm ci --production
    cd ..
    
    print_success "프론트엔드 의존성 설치 완료"
}

# 데이터베이스 초기화
setup_database() {
    print_status "데이터베이스 초기화 중..."
    
    source venv/bin/activate
    cd server
    
    python -c "
from src.db import engine, Base
from src.models import *
Base.metadata.create_all(bind=engine)
print('데이터베이스 테이블 생성 완료')
"
    
    cd ..
    print_success "데이터베이스 초기화 완료"
}

# 프론트엔드 빌드
build_frontend() {
    print_status "프론트엔드 빌드 중..."
    
    cd client
    npm run build
    cd ..
    
    print_success "프론트엔드 빌드 완료"
}

# 백엔드 테스트
test_backend() {
    print_status "백엔드 서버 테스트 중..."
    
    source venv/bin/activate
    cd server
    
    # 백엔드 서버를 백그라운드에서 시작
    python -c "
from src.main import app
import uvicorn
uvicorn.run(app, host='0.0.0.0', port=8000)
" &
    
    BACKEND_PID=$!
    cd ..
    
    # 서버 시작 대기
    sleep 5
    
    # 헬스 체크
    if curl -f http://localhost:8000/docs > /dev/null 2>&1; then
        print_success "백엔드 서버 테스트 통과"
    else
        print_error "백엔드 서버 테스트 실패"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    
    # 테스트 서버 종료
    kill $BACKEND_PID 2>/dev/null || true
}

# 프로덕션 서버 시작
start_production() {
    print_status "프로덕션 서버 시작 중..."
    
    source venv/bin/activate
    
    # Gunicorn 설치 확인
    if ! command -v gunicorn &> /dev/null; then
        print_status "Gunicorn 설치 중..."
        pip install gunicorn
    fi
    
    cd server
    
    # 기존 프로세스 종료
    pkill -f "gunicorn.*src.main:app" || true
    
    # Gunicorn으로 프로덕션 서버 시작
    gunicorn src.main:app \
        -w 4 \
        -k uvicorn.workers.UvicornWorker \
        --bind 0.0.0.0:8000 \
        --daemon \
        --pid gunicorn.pid \
        --access-logfile access.log \
        --error-logfile error.log \
        --log-level info
    
    cd ..
    
    print_success "프로덕션 서버 시작 완료 (PID: $(cat server/gunicorn.pid))"
}

# 웹 서버 설정 (Nginx 예시)
setup_nginx() {
    print_status "Nginx 설정 생성 중..."
    
    cat > nginx.conf << EOF
server {
    listen 80;
    server_name your-domain.com;
    
    # 프론트엔드 정적 파일
    location / {
        root $(pwd)/client/dist;
        try_files \$uri \$uri/ /index.html;
        
        # 캐싱 설정
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API 프록시
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # API 문서
    location /docs {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    print_success "Nginx 설정 파일 생성 완료 (nginx.conf)"
    print_warning "Nginx 설정을 적용하려면 다음 명령을 실행하세요:"
    print_warning "sudo cp nginx.conf /etc/nginx/sites-available/wordpress-auto-poster"
    print_warning "sudo ln -s /etc/nginx/sites-available/wordpress-auto-poster /etc/nginx/sites-enabled/"
    print_warning "sudo nginx -t && sudo systemctl reload nginx"
}

# 시스템 서비스 설정
setup_systemd() {
    print_status "Systemd 서비스 설정 생성 중..."
    
    cat > wordpress-auto-poster.service << EOF
[Unit]
Description=WordPress Auto Poster Backend
After=network.target

[Service]
Type=forking
User=$(whoami)
Group=$(whoami)
WorkingDirectory=$(pwd)/server
Environment=PATH=$(pwd)/venv/bin
ExecStart=$(pwd)/venv/bin/gunicorn src.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --daemon --pid gunicorn.pid
ExecReload=/bin/kill -s HUP \$MAINPID
PIDFile=$(pwd)/server/gunicorn.pid
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    print_success "Systemd 서비스 파일 생성 완료 (wordpress-auto-poster.service)"
    print_warning "시스템 서비스로 등록하려면 다음 명령을 실행하세요:"
    print_warning "sudo cp wordpress-auto-poster.service /etc/systemd/system/"
    print_warning "sudo systemctl daemon-reload"
    print_warning "sudo systemctl enable wordpress-auto-poster"
    print_warning "sudo systemctl start wordpress-auto-poster"
}

# SSL 인증서 설정 (Let's Encrypt)
setup_ssl() {
    print_status "SSL 설정 가이드..."
    
    cat > ssl-setup.md << EOF
# SSL 인증서 설정 (Let's Encrypt)

## Certbot 설치
\`\`\`bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
\`\`\`

## SSL 인증서 발급
\`\`\`bash
sudo certbot --nginx -d your-domain.com
\`\`\`

## 자동 갱신 설정
\`\`\`bash
sudo crontab -e
# 다음 라인 추가:
0 12 * * * /usr/bin/certbot renew --quiet
\`\`\`

## Nginx 설정 업데이트
SSL 인증서 발급 후 Nginx 설정이 자동으로 업데이트됩니다.
EOF
    
    print_success "SSL 설정 가이드 생성 완료 (ssl-setup.md)"
}

# 백업 스크립트 생성
create_backup_script() {
    print_status "백업 스크립트 생성 중..."
    
    cat > backup.sh << 'EOF'
#!/bin/bash

# WordPress Auto Poster 백업 스크립트

BACKUP_DIR="backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="wordpress-auto-poster-backup-$DATE"

mkdir -p $BACKUP_DIR

echo "백업 시작: $BACKUP_NAME"

# 데이터베이스 백업
if [ -f "server/wordpress_auto_poster.db" ]; then
    cp server/wordpress_auto_poster.db $BACKUP_DIR/$BACKUP_NAME.db
    echo "데이터베이스 백업 완료"
fi

# 설정 파일 백업
tar -czf $BACKUP_DIR/$BACKUP_NAME.tar.gz \
    .env \
    server/src/ \
    client/src/ \
    requirements.txt \
    client/package.json \
    --exclude="*.pyc" \
    --exclude="node_modules" \
    --exclude="venv" \
    --exclude="dist" \
    --exclude="*.log"

echo "백업 완료: $BACKUP_DIR/$BACKUP_NAME.tar.gz"

# 오래된 백업 파일 정리 (30일 이상)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.db" -mtime +30 -delete

echo "오래된 백업 파일 정리 완료"
EOF
    
    chmod +x backup.sh
    print_success "백업 스크립트 생성 완료 (backup.sh)"
}

# 모니터링 스크립트 생성
create_monitoring_script() {
    print_status "모니터링 스크립트 생성 중..."
    
    cat > monitor.sh << 'EOF'
#!/bin/bash

# WordPress Auto Poster 모니터링 스크립트

check_backend() {
    if curl -f http://localhost:8000/docs > /dev/null 2>&1; then
        echo "✅ 백엔드 서버 정상"
        return 0
    else
        echo "❌ 백엔드 서버 오류"
        return 1
    fi
}

check_database() {
    if [ -f "server/wordpress_auto_poster.db" ]; then
        echo "✅ 데이터베이스 파일 존재"
        return 0
    else
        echo "❌ 데이터베이스 파일 없음"
        return 1
    fi
}

check_disk_space() {
    USAGE=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $USAGE -lt 90 ]; then
        echo "✅ 디스크 사용량 정상 ($USAGE%)"
        return 0
    else
        echo "⚠️ 디스크 사용량 높음 ($USAGE%)"
        return 1
    fi
}

check_logs() {
    if [ -f "server/error.log" ]; then
        ERROR_COUNT=$(tail -100 server/error.log | grep -c "ERROR" || true)
        if [ $ERROR_COUNT -eq 0 ]; then
            echo "✅ 최근 오류 없음"
            return 0
        else
            echo "⚠️ 최근 오류 $ERROR_COUNT 건"
            return 1
        fi
    else
        echo "ℹ️ 로그 파일 없음"
        return 0
    fi
}

echo "🔍 WordPress Auto Poster 상태 확인"
echo "=================================="

check_backend
check_database
check_disk_space
check_logs

echo "=================================="
echo "모니터링 완료: $(date)"
EOF
    
    chmod +x monitor.sh
    print_success "모니터링 스크립트 생성 완료 (monitor.sh)"
}

# 메인 배포 함수
main() {
    echo "🚀 WordPress Auto Poster 자동 배포 스크립트"
    echo "============================================"
    
    # 배포 모드 선택
    echo "배포 모드를 선택하세요:"
    echo "1) 개발 환경 설정"
    echo "2) 프로덕션 배포"
    echo "3) 설정 파일만 생성"
    
    read -p "선택 (1-3): " choice
    
    case $choice in
        1)
            print_status "개발 환경 설정 시작..."
            check_environment
            install_dependencies
            setup_database
            build_frontend
            test_backend
            print_success "개발 환경 설정 완료!"
            print_warning "개발 서버를 시작하려면:"
            print_warning "백엔드: cd server && source ../venv/bin/activate && uvicorn src.main:app --reload"
            print_warning "프론트엔드: cd client && npm run dev"
            ;;
        2)
            print_status "프로덕션 배포 시작..."
            check_environment
            install_dependencies
            setup_database
            build_frontend
            test_backend
            start_production
            setup_nginx
            setup_systemd
            setup_ssl
            create_backup_script
            create_monitoring_script
            print_success "프로덕션 배포 완료!"
            print_warning "추가 설정이 필요합니다. 생성된 파일들을 확인하세요."
            ;;
        3)
            print_status "설정 파일 생성 시작..."
            setup_nginx
            setup_systemd
            setup_ssl
            create_backup_script
            create_monitoring_script
            print_success "설정 파일 생성 완료!"
            ;;
        *)
            print_error "잘못된 선택입니다."
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@"

