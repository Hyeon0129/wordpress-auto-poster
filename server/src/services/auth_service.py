import os
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple, List
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
import re

class AdvancedAuthService:
    """고급 인증 서비스 클래스"""
    
    def __init__(self):
        self.secret_key = os.environ.get("JWT_SECRET_KEY", "jwt-secret-string-wordpress-auto-poster")
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 60 * 24  # 24시간
        self.refresh_token_expire_days = 30  # 30일
        self.reset_token_expire_minutes = 30  # 30분
        
        # 이메일 설정 (실제 환경에서는 환경변수로 설정)
        self.smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        self.smtp_username = os.environ.get("SMTP_USERNAME", "")
        self.smtp_password = os.environ.get("SMTP_PASSWORD", "")
    
    def create_access_token(self, user_id: str, additional_claims: Dict = None) -> str:
        """액세스 토큰 생성"""
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        payload = {
            "sub": user_id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        }
        
        if additional_claims:
            payload.update(additional_claims)
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def create_refresh_token(self, user_id: str) -> str:
        """리프레시 토큰 생성"""
        expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        payload = {
            "sub": user_id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh"
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def create_reset_token(self, user_id: str, email: str) -> str:
        """비밀번호 재설정 토큰 생성"""
        expire = datetime.utcnow() + timedelta(minutes=self.reset_token_expire_minutes)
        payload = {
            "sub": user_id,
            "email": email,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "reset"
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def decode_token(self, token: str) -> Dict:
        """토큰 디코딩"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")
    
    def validate_password(self, password: str) -> Tuple[bool, str]:
        """비밀번호 유효성 검사"""
        if len(password) < 8:
            return False, "비밀번호는 최소 8자 이상이어야 합니다."
        
        if len(password) > 128:
            return False, "비밀번호는 최대 128자까지 가능합니다."
        
        if not re.search(r'[A-Z]', password):
            return False, "비밀번호에 대문자가 포함되어야 합니다."
        
        if not re.search(r'[a-z]', password):
            return False, "비밀번호에 소문자가 포함되어야 합니다."
        
        if not re.search(r'\d', password):
            return False, "비밀번호에 숫자가 포함되어야 합니다."
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "비밀번호에 특수문자가 포함되어야 합니다."
        
        # 일반적인 패스워드 패턴 검사
        common_patterns = [
            r'(.)\1{2,}',  # 같은 문자 3번 이상 반복
            r'(012|123|234|345|456|567|678|789|890)',  # 연속된 숫자
            r'(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)',  # 연속된 알파벳
        ]
        
        for pattern in common_patterns:
            if re.search(pattern, password.lower()):
                return False, "비밀번호에 연속된 문자나 숫자는 사용할 수 없습니다."
        
        return True, "유효한 비밀번호입니다."
    
    def validate_email(self, email: str) -> Tuple[bool, str]:
        """이메일 유효성 검사"""
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        if not re.match(email_pattern, email):
            return False, "유효하지 않은 이메일 형식입니다."
        
        if len(email) > 254:
            return False, "이메일 주소가 너무 깁니다."
        
        return True, "유효한 이메일입니다."
    
    def validate_username(self, username: str) -> Tuple[bool, str]:
        """사용자명 유효성 검사"""
        if len(username) < 3:
            return False, "사용자명은 최소 3자 이상이어야 합니다."
        
        if len(username) > 30:
            return False, "사용자명은 최대 30자까지 가능합니다."
        
        if not re.match(r'^[a-zA-Z0-9_-]+$', username):
            return False, "사용자명은 영문, 숫자, 언더스코어, 하이픈만 사용 가능합니다."
        
        if username.lower() in ['admin', 'administrator', 'root', 'user', 'test', 'guest']:
            return False, "사용할 수 없는 사용자명입니다."
        
        return True, "유효한 사용자명입니다."
    
    def hash_password(self, password: str) -> str:
        """비밀번호 해시화"""
        return generate_password_hash(password, method='pbkdf2:sha256', salt_length=16)
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        """비밀번호 검증"""
        return check_password_hash(password_hash, password)
    
    def generate_verification_code(self) -> str:
        """이메일 인증 코드 생성"""
        return ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    
    def generate_api_key(self, user_id: str) -> str:
        """API 키 생성"""
        timestamp = str(int(datetime.utcnow().timestamp()))
        data = f"{user_id}:{timestamp}:{secrets.token_hex(16)}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    def send_verification_email(self, email: str, verification_code: str) -> bool:
        """이메일 인증 코드 발송"""
        try:
            # SMTP 설정이 있는 경우 실제 이메일 발송
            if self.smtp_username and self.smtp_password:
                import smtplib
                from email.mime.text import MimeText
                from email.mime.multipart import MimeMultipart
                
                msg = MimeMultipart()
                msg['From'] = self.smtp_username
                msg['To'] = email
                msg['Subject'] = "WordPress Auto Poster - 이메일 인증"
                
                body = f"""
                안녕하세요!
                
                WordPress Auto Poster 회원가입을 위한 이메일 인증 코드입니다.
                
                인증 코드: {verification_code}
                
                이 코드는 30분 후에 만료됩니다.
                
                감사합니다.
                WordPress Auto Poster 팀
                """
                
                msg.attach(MimeText(body, 'plain', 'utf-8'))
                
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                text = msg.as_string()
                server.sendmail(self.smtp_username, email, text)
                server.quit()
                
                print(f"이메일 인증 코드 발송 완료: {email} -> {verification_code}")
                return True
            else:
                # SMTP 설정이 없는 경우 콘솔에 출력 (개발 모드)
                print(f"[개발 모드] 이메일 인증 코드: {email} -> {verification_code}")
                return True
        except Exception as e:
            print(f"이메일 발송 실패: {e}")
            return False
    
    def send_password_reset_email(self, email: str, reset_token: str, base_url: str) -> bool:
        """비밀번호 재설정 이메일 발송"""
        try:
            reset_url = f"{base_url}/reset-password?token={reset_token}"
            
            # SMTP 설정이 있는 경우 실제 이메일 발송
            if self.smtp_username and self.smtp_password:
                import smtplib
                from email.mime.text import MimeText
                from email.mime.multipart import MimeMultipart
                
                msg = MimeMultipart()
                msg['From'] = self.smtp_username
                msg['To'] = email
                msg['Subject'] = "WordPress Auto Poster - 비밀번호 재설정"
                
                body = f"""
                안녕하세요!
                
                WordPress Auto Poster 비밀번호 재설정 요청을 받았습니다.
                
                아래 링크를 클릭하여 비밀번호를 재설정하세요:
                {reset_url}
                
                이 링크는 30분 후에 만료됩니다.
                
                만약 비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요.
                
                감사합니다.
                WordPress Auto Poster 팀
                """
                
                msg.attach(MimeText(body, 'plain', 'utf-8'))
                
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                text = msg.as_string()
                server.sendmail(self.smtp_username, email, text)
                server.quit()
                
                print(f"비밀번호 재설정 이메일 발송 완료: {email} -> {reset_url}")
                return True
            else:
                # SMTP 설정이 없는 경우 콘솔에 출력 (개발 모드)
                print(f"[개발 모드] 비밀번호 재설정 링크: {email} -> {reset_url}")
                return True
        except Exception as e:
            print(f"비밀번호 재설정 이메일 발송 실패: {e}")
            return False
    
    def check_rate_limit(self, identifier: str, max_attempts: int = 5, window_minutes: int = 15) -> Tuple[bool, int]:
        """레이트 리미팅 검사 (간단한 메모리 기반 구현)"""
        # 실제 환경에서는 Redis나 데이터베이스를 사용해야 함
        if not hasattr(self, '_rate_limit_store'):
            self._rate_limit_store = {}
        
        now = datetime.utcnow()
        window_start = now - timedelta(minutes=window_minutes)
        
        if identifier not in self._rate_limit_store:
            self._rate_limit_store[identifier] = []
        
        # 윈도우 밖의 기록 제거
        self._rate_limit_store[identifier] = [
            timestamp for timestamp in self._rate_limit_store[identifier]
            if timestamp > window_start
        ]
        
        current_attempts = len(self._rate_limit_store[identifier])
        
        if current_attempts >= max_attempts:
            return False, max_attempts - current_attempts
        
        # 새로운 시도 기록
        self._rate_limit_store[identifier].append(now)
        return True, max_attempts - current_attempts - 1
    
    def create_session_token(self, user_id: str, device_info: Dict = None) -> str:
        """세션 토큰 생성"""
        expire = datetime.utcnow() + timedelta(hours=24)
        payload = {
            "sub": user_id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "session",
            "device": device_info or {}
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def revoke_token(self, token: str) -> bool:
        """토큰 무효화 (블랙리스트에 추가)"""
        # 실제 환경에서는 Redis나 데이터베이스에 블랙리스트 저장
        if not hasattr(self, '_token_blacklist'):
            self._token_blacklist = set()
        
        try:
            payload = self.decode_token(token)
            token_id = f"{payload['sub']}:{payload['iat']}"
            self._token_blacklist.add(token_id)
            return True
        except:
            return False
    
    def is_token_revoked(self, token: str) -> bool:
        """토큰이 무효화되었는지 확인"""
        if not hasattr(self, '_token_blacklist'):
            return False
        
        try:
            payload = self.decode_token(token)
            token_id = f"{payload['sub']}:{payload['iat']}"
            return token_id in self._token_blacklist
        except:
            return True

class TwoFactorAuth:
    """2단계 인증 클래스"""
    
    def __init__(self):
        self.totp_window = 30  # 30초 윈도우
        self.backup_codes_count = 10
    
    def generate_secret(self) -> str:
        """TOTP 시크릿 생성"""
        return secrets.token_hex(16)
    
    def generate_backup_codes(self) -> List[str]:
        """백업 코드 생성"""
        codes = []
        for _ in range(self.backup_codes_count):
            code = ''.join([str(secrets.randbelow(10)) for _ in range(8)])
            codes.append(f"{code[:4]}-{code[4:]}")
        return codes
    
    def verify_totp(self, secret: str, token: str) -> bool:
        """TOTP 토큰 검증"""
        try:
            import pyotp
            totp = pyotp.TOTP(secret)
            return totp.verify(token, valid_window=1)
        except ImportError:
            # pyotp가 없는 경우 간단한 시뮬레이션
            return len(token) == 6 and token.isdigit()
    
    def get_qr_code_url(self, secret: str, user_email: str, issuer: str = "WordPress Auto Poster") -> str:
        """QR 코드 URL 생성"""
        try:
            import pyotp
            totp = pyotp.TOTP(secret)
            return totp.provisioning_uri(
                name=user_email,
                issuer_name=issuer
            )
        except ImportError:
            return f"otpauth://totp/{issuer}:{user_email}?secret={secret}&issuer={issuer}"

