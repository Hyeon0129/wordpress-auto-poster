#!/bin/bash

# WordPress Auto Poster 자동 배포 스크립트
# 작성자: Manus AI
# 버전: 1.0.0

set -e  # 오류 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 설정 변수
PROJECT_NAME="wordpress-auto-poster"
BACKEND_DIR="${PROJECT_NAME}-backend"
FRONTEND_DIR="${PROJECT_NAME}-frontend"
INSTALL_DIR="/opt/${PROJECT_NAME}"
SERVICE_NAME="wordpress-auto-poster"
NGINX_SITE_NAME="wordpress-auto-poster"

# 사용자 입력 받기
get_user_input() {
    log_info "WordPress Auto Poster 배포 설정을 시작합니다."
    
    # 도메인 입력
    read -p "도메인명을 입력하세요 (예: myblog.com): " DOMAIN
    if [ -z "$DOMAIN" ]; then
        DOMAIN="localhost"
        log_warning "도메인이 입력되지 않아 localhost로 설정됩니다."
    fi
    
    # 설치 경로 확인
    read -p "설치 경로를 입력하세요 (기본값: ${INSTALL_DIR}): " CUSTOM_INSTALL_DIR
    if [ ! -z "$CUSTOM_INSTALL_DIR" ]; then
        INSTALL_DIR="$CUSTOM_INSTALL_DIR"
    fi
    
    # LLM 제공자 선택
    echo "LLM 제공자를 선택하세요:"
    echo "1) Ollama (권장 - 로컬 실행)"
    echo "2) OpenAI (API 키 필요)"
    read -p "선택 (1 또는 2): " LLM_CHOICE
    
    if [ "$LLM_CHOICE" = "2" ]; then
        read -p "OpenAI API 키를 입력하세요: " OPENAI_API_KEY
        if [ -z "$OPENAI_API_KEY" ]; then
            log_error "OpenAI API 키가 필요합니다."
            exit 1
        fi
    fi
    
    # HTTPS 설정 여부
    read -p "HTTPS를 설정하시겠습니까? (y/n): " SETUP_HTTPS
}

# 시스템 요구사항 확인
check_requirements() {
    log_info "시스템 요구사항을 확인합니다..."
    
    # 운영체제 확인
    if ! command -v apt &> /dev/null; then
        log_error "이 스크립트는 Ubuntu/Debian 시스템에서만 실행됩니다."
        exit 1
    fi
    
    # 메모리 확인
    TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [ "$TOTAL_MEM" -lt 4096 ]; then
        log_warning "시스템 메모리가 4GB 미만입니다. 성능에 영향을 줄 수 있습니다."
    fi
    
    # 디스크 공간 확인
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt 10485760 ]; then  # 10GB in KB
        log_error "디스크 여유 공간이 부족합니다. 최소 10GB가 필요합니다."
        exit 1
    fi
    
    log_success "시스템 요구사항 확인 완료"
}

# 필수 패키지 설치
install_dependencies() {
    log_info "필수 패키지를 설치합니다..."
    
    # 시스템 업데이트
    sudo apt update
    
    # 기본 패키지 설치
    sudo apt install -y curl wget git unzip software-properties-common
    
    # Node.js 설치
    if ! command -v node &> /dev/null; then
        log_info "Node.js를 설치합니다..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Python 3.11 설치
    if ! command -v python3.11 &> /dev/null; then
        log_info "Python 3.11을 설치합니다..."
        sudo add-apt-repository ppa:deadsnakes/ppa -y
        sudo apt update
        sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
    fi
    
    # pnpm 설치
    if ! command -v pnpm &> /dev/null; then
        log_info "pnpm을 설치합니다..."
        npm install -g pnpm
    fi
    
    # Nginx 설치
    if ! command -v nginx &> /dev/null; then
        log_info "Nginx를 설치합니다..."
        sudo apt install -y nginx
    fi
    
    log_success "필수 패키지 설치 완료"
}

# Ollama 설치
install_ollama() {
    if [ "$LLM_CHOICE" = "1" ]; then
        log_info "Ollama를 설치합니다..."
        
        if ! command -v ollama &> /dev/null; then
            curl -fsSL https://ollama.ai/install.sh | sh
        fi
        
        # Ollama 서비스 시작
        sudo systemctl enable ollama
        sudo systemctl start ollama
        
        # 모델 다운로드
        log_info "Qwen2.5:32B 모델을 다운로드합니다... (시간이 오래 걸릴 수 있습니다)"
        ollama pull qwen2.5:32b
        
        log_success "Ollama 설치 및 모델 다운로드 완료"
    fi
}

# 애플리케이션 설치
install_application() {
    log_info "애플리케이션을 설치합니다..."
    
    # 설치 디렉토리 생성
    sudo mkdir -p "$INSTALL_DIR"
    sudo chown $USER:$USER "$INSTALL_DIR"
    
    # 현재 디렉토리의 파일들을 설치 디렉토리로 복사
    cp -r "$BACKEND_DIR" "$INSTALL_DIR/"
    cp -r "$FRONTEND_DIR" "$INSTALL_DIR/"
    
    # 백엔드 설정
    log_info "백엔드를 설정합니다..."
    cd "$INSTALL_DIR/$BACKEND_DIR"
    
    # 가상환경 생성
    python3.11 -m venv venv
    source venv/bin/activate
    
    # Python 패키지 설치
    pip install -r requirements.txt
    
    # 환경 변수 파일 생성
    cat > .env << EOF
# Flask 설정
FLASK_ENV=production
SECRET_KEY=$(openssl rand -hex 32)
DATABASE_URL=sqlite:///app.db

# LLM 설정
EOF
    
    if [ "$LLM_CHOICE" = "1" ]; then
        cat >> .env << EOF
DEFAULT_LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=qwen2.5:32b
EOF
    else
        cat >> .env << EOF
DEFAULT_LLM_PROVIDER=openai
OPENAI_API_KEY=$OPENAI_API_KEY
EOF
    fi
    
    cat >> .env << EOF

# WordPress 설정
WP_DEFAULT_TIMEOUT=30

# 보안 설정
JWT_SECRET_KEY=$(openssl rand -hex 32)
CORS_ORIGINS=http://$DOMAIN,https://$DOMAIN

# 로그 설정
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
EOF
    
    # 로그 디렉토리 생성
    mkdir -p logs
    
    # 데이터베이스 초기화
    python src/init_db.py
    
    deactivate
    
    # 프론트엔드 설정
    log_info "프론트엔드를 설정합니다..."
    cd "$INSTALL_DIR/$FRONTEND_DIR"
    
    # 의존성 설치
    pnpm install
    
    # 환경 변수 파일 생성
    cat > .env.local << EOF
# API 서버 URL
VITE_API_BASE_URL=http://$DOMAIN:5000

# 애플리케이션 설정
VITE_APP_NAME=WordPress Auto Poster
VITE_APP_VERSION=1.0.0
EOF
    
    # 프로덕션 빌드
    pnpm run build
    
    log_success "애플리케이션 설치 완료"
}

# 시스템 서비스 설정
setup_systemd_service() {
    log_info "시스템 서비스를 설정합니다..."
    
    # 서비스 파일 생성
    sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null << EOF
[Unit]
Description=WordPress Auto Poster Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR/$BACKEND_DIR
Environment=PATH=$INSTALL_DIR/$BACKEND_DIR/venv/bin
ExecStart=$INSTALL_DIR/$BACKEND_DIR/venv/bin/python src/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # 서비스 활성화
    sudo systemctl daemon-reload
    sudo systemctl enable $SERVICE_NAME
    sudo systemctl start $SERVICE_NAME
    
    log_success "시스템 서비스 설정 완료"
}

# Nginx 설정
setup_nginx() {
    log_info "Nginx를 설정합니다..."
    
    # Nginx 설정 파일 생성
    sudo tee /etc/nginx/sites-available/$NGINX_SITE_NAME > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # 프론트엔드 정적 파일 서빙
    location / {
        root $INSTALL_DIR/$FRONTEND_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        
        # 캐싱 설정
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 백엔드 API 프록시
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF
    
    # 사이트 활성화
    sudo ln -sf /etc/nginx/sites-available/$NGINX_SITE_NAME /etc/nginx/sites-enabled/
    
    # 기본 사이트 비활성화
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Nginx 설정 테스트
    sudo nginx -t
    
    # Nginx 재시작
    sudo systemctl restart nginx
    
    log_success "Nginx 설정 완료"
}

# HTTPS 설정
setup_https() {
    if [ "$SETUP_HTTPS" = "y" ] || [ "$SETUP_HTTPS" = "Y" ]; then
        log_info "HTTPS를 설정합니다..."
        
        # Certbot 설치
        sudo apt install -y certbot python3-certbot-nginx
        
        # SSL 인증서 발급
        sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        
        log_success "HTTPS 설정 완료"
    fi
}

# 방화벽 설정
setup_firewall() {
    log_info "방화벽을 설정합니다..."
    
    # UFW 설치 및 설정
    sudo apt install -y ufw
    
    # 기본 정책 설정
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # 필요한 포트 허용
    sudo ufw allow ssh
    sudo ufw allow 'Nginx Full'
    
    # 방화벽 활성화
    sudo ufw --force enable
    
    log_success "방화벽 설정 완료"
}

# 백업 스크립트 생성
create_backup_script() {
    log_info "백업 스크립트를 생성합니다..."
    
    # 백업 디렉토리 생성
    sudo mkdir -p /opt/backups/$PROJECT_NAME
    sudo chown $USER:$USER /opt/backups/$PROJECT_NAME
    
    # 백업 스크립트 생성
    cat > /opt/backups/$PROJECT_NAME/backup.sh << 'EOF'
#!/bin/bash

# WordPress Auto Poster 백업 스크립트

BACKUP_DIR="/opt/backups/wordpress-auto-poster"
INSTALL_DIR="/opt/wordpress-auto-poster"
DATE=$(date +%Y%m%d_%H%M%S)

# 백업 디렉토리 생성
mkdir -p $BACKUP_DIR

# 데이터베이스 백업
cp $INSTALL_DIR/wordpress-auto-poster-backend/app.db $BACKUP_DIR/app_$DATE.db

# 설정 파일 백업
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
  $INSTALL_DIR/wordpress-auto-poster-backend/.env \
  $INSTALL_DIR/wordpress-auto-poster-frontend/.env.local \
  /etc/nginx/sites-available/wordpress-auto-poster \
  /etc/systemd/system/wordpress-auto-poster.service

# 로그 파일 백업
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz \
  $INSTALL_DIR/wordpress-auto-poster-backend/logs/

# 7일 이상 된 백업 파일 삭제
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "백업 완료: $DATE"
EOF
    
    chmod +x /opt/backups/$PROJECT_NAME/backup.sh
    
    # 크론탭에 백업 작업 추가
    (crontab -l 2>/dev/null; echo "0 2 * * * /opt/backups/$PROJECT_NAME/backup.sh") | crontab -
    
    log_success "백업 스크립트 생성 완료"
}

# 서비스 상태 확인
check_services() {
    log_info "서비스 상태를 확인합니다..."
    
    # 백엔드 서비스 확인
    if systemctl is-active --quiet $SERVICE_NAME; then
        log_success "백엔드 서비스가 정상 실행 중입니다."
    else
        log_error "백엔드 서비스가 실행되지 않습니다."
        sudo systemctl status $SERVICE_NAME
    fi
    
    # Nginx 서비스 확인
    if systemctl is-active --quiet nginx; then
        log_success "Nginx 서비스가 정상 실행 중입니다."
    else
        log_error "Nginx 서비스가 실행되지 않습니다."
        sudo systemctl status nginx
    fi
    
    # Ollama 서비스 확인 (설치된 경우)
    if [ "$LLM_CHOICE" = "1" ]; then
        if systemctl is-active --quiet ollama; then
            log_success "Ollama 서비스가 정상 실행 중입니다."
        else
            log_warning "Ollama 서비스가 실행되지 않습니다."
        fi
    fi
    
    # 포트 확인
    if netstat -tlnp | grep -q ":80 "; then
        log_success "웹 서버가 포트 80에서 실행 중입니다."
    else
        log_error "웹 서버가 포트 80에서 실행되지 않습니다."
    fi
    
    if netstat -tlnp | grep -q ":5000 "; then
        log_success "백엔드 API가 포트 5000에서 실행 중입니다."
    else
        log_error "백엔드 API가 포트 5000에서 실행되지 않습니다."
    fi
}

# 배포 완료 메시지
show_completion_message() {
    log_success "WordPress Auto Poster 배포가 완료되었습니다!"
    
    echo ""
    echo "==================================="
    echo "배포 정보"
    echo "==================================="
    echo "도메인: $DOMAIN"
    echo "설치 경로: $INSTALL_DIR"
    echo "웹 인터페이스: http://$DOMAIN"
    if [ "$SETUP_HTTPS" = "y" ] || [ "$SETUP_HTTPS" = "Y" ]; then
        echo "HTTPS: https://$DOMAIN"
    fi
    echo ""
    echo "서비스 관리 명령어:"
    echo "- 백엔드 서비스 상태: sudo systemctl status $SERVICE_NAME"
    echo "- 백엔드 서비스 재시작: sudo systemctl restart $SERVICE_NAME"
    echo "- Nginx 재시작: sudo systemctl restart nginx"
    echo ""
    echo "로그 확인:"
    echo "- 백엔드 로그: tail -f $INSTALL_DIR/$BACKEND_DIR/logs/app.log"
    echo "- 시스템 로그: sudo journalctl -u $SERVICE_NAME -f"
    echo "- Nginx 로그: sudo tail -f /var/log/nginx/error.log"
    echo ""
    echo "백업:"
    echo "- 수동 백업: /opt/backups/$PROJECT_NAME/backup.sh"
    echo "- 자동 백업: 매일 새벽 2시 실행"
    echo ""
    echo "==================================="
    
    if [ "$LLM_CHOICE" = "1" ]; then
        echo ""
        log_info "Ollama 모델 관리:"
        echo "- 모델 목록: ollama list"
        echo "- 모델 다운로드: ollama pull <model_name>"
        echo "- Ollama 서비스 상태: sudo systemctl status ollama"
    fi
    
    echo ""
    log_info "웹 브라우저에서 http://$DOMAIN 에 접속하여 애플리케이션을 사용하세요."
    log_info "초기 설정을 위해 회원가입을 진행하고 WordPress 사이트를 연결하세요."
}

# 메인 실행 함수
main() {
    echo "WordPress Auto Poster 자동 배포 스크립트"
    echo "=========================================="
    
    # 루트 권한 확인
    if [ "$EUID" -eq 0 ]; then
        log_error "이 스크립트는 루트 권한으로 실행하지 마세요."
        exit 1
    fi
    
    # sudo 권한 확인
    if ! sudo -n true 2>/dev/null; then
        log_error "이 스크립트는 sudo 권한이 필요합니다."
        exit 1
    fi
    
    # 단계별 실행
    get_user_input
    check_requirements
    install_dependencies
    install_ollama
    install_application
    setup_systemd_service
    setup_nginx
    setup_https
    setup_firewall
    create_backup_script
    check_services
    show_completion_message
}

# 스크립트 실행
main "$@"

