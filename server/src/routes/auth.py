from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import json

from src.db import get_db
from src.models.user import User
from src.services.auth_service import AdvancedAuthService, TwoFactorAuth
from src.utils.dependencies import get_current_user

router = APIRouter()

# 서비스 인스턴스
auth_service = AdvancedAuthService()
two_factor_auth = TwoFactorAuth()

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str
    two_factor_code: Optional[str] = None
    remember_me: bool = False

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirmRequest(BaseModel):
    token: str
    new_password: str

class EmailVerificationRequest(BaseModel):
    email: EmailStr

class EmailVerificationConfirmRequest(BaseModel):
    email: EmailStr
    verification_code: str

class TwoFactorSetupRequest(BaseModel):
    password: str

class TwoFactorConfirmRequest(BaseModel):
    secret: str
    token: str

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

@router.post('/register')
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    """사용자 등록"""
    try:
        # 레이트 리미팅 검사
        client_ip = request.client.host
        allowed, remaining = auth_service.check_rate_limit(f"register:{client_ip}", max_attempts=5, window_minutes=60)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="등록 시도가 너무 많습니다. 잠시 후 다시 시도해주세요."
            )
        
        # 입력 검증
        username_valid, username_msg = auth_service.validate_username(payload.username)
        if not username_valid:
            raise HTTPException(status_code=400, detail=username_msg)
        
        email_valid, email_msg = auth_service.validate_email(payload.email)
        if not email_valid:
            raise HTTPException(status_code=400, detail=email_msg)
        
        password_valid, password_msg = auth_service.validate_password(payload.password)
        if not password_valid:
            raise HTTPException(status_code=400, detail=password_msg)
        
        # 중복 검사
        existing_user = db.query(User).filter(
            (User.username == payload.username.strip()) | 
            (User.email == payload.email.strip())
        ).first()
        
        if existing_user:
            if existing_user.username == payload.username.strip():
                raise HTTPException(status_code=409, detail="이미 사용 중인 사용자명입니다.")
            else:
                raise HTTPException(status_code=409, detail="이미 사용 중인 이메일입니다.")
        
        # 사용자 생성
        password_hash = auth_service.hash_password(payload.password)
        verification_code = auth_service.generate_verification_code()
        
        user = User(
            username=payload.username.strip(),
            email=payload.email.strip(),
            password_hash=password_hash,
            full_name=payload.full_name.strip() if payload.full_name else None,
            email_verification_code=verification_code,
            email_verification_expires=datetime.utcnow() + timedelta(minutes=30),
            api_key=auth_service.generate_api_key(payload.username)
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # 이메일 인증 코드 발송
        email_sent = auth_service.send_verification_email(user.email, verification_code)
        
        # 토큰 생성
        access_token = auth_service.create_access_token(str(user.id))
        refresh_token = auth_service.create_refresh_token(str(user.id))
        
        return {
            'success': True,
            'message': '회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.',
            'data': {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': user.to_dict(),
                'email_verification_sent': email_sent
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/login')
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """사용자 로그인"""
    try:
        # 레이트 리미팅 검사
        client_ip = request.client.host
        allowed, remaining = auth_service.check_rate_limit(f"login:{client_ip}", max_attempts=10, window_minutes=15)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요."
            )
        
        # 사용자 조회
        user = db.query(User).filter(
            (User.username == payload.username) | (User.email == payload.username)
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="잘못된 사용자명 또는 비밀번호입니다."
            )
        
        # 계정 잠금 확인
        if user.is_account_locked():
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="계정이 일시적으로 잠겨있습니다. 잠시 후 다시 시도해주세요."
            )
        
        # 비밀번호 검증
        if not auth_service.verify_password(payload.password, user.password_hash):
            # 실패 횟수 증가
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.utcnow() + timedelta(minutes=30)
            db.commit()
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="잘못된 사용자명 또는 비밀번호입니다."
            )
        
        # 2단계 인증 확인
        if user.two_factor_enabled:
            if not payload.two_factor_code:
                return {
                    'success': False,
                    'requires_2fa': True,
                    'message': '2단계 인증 코드를 입력해주세요.'
                }
            
            if not two_factor_auth.verify_totp(user.two_factor_secret, payload.two_factor_code):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="잘못된 2단계 인증 코드입니다."
                )
        
        # 로그인 성공 처리
        user.last_login = datetime.utcnow()
        user.login_count += 1
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()
        
        # 토큰 생성
        token_expire_minutes = 60 * 24 * 30 if payload.remember_me else 60 * 24  # 30일 또는 1일
        access_token = auth_service.create_access_token(str(user.id))
        refresh_token = auth_service.create_refresh_token(str(user.id))
        
        return {
            'success': True,
            'message': '로그인 성공',
            'data': {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': user.to_dict(),
                'expires_in': token_expire_minutes * 60  # 초 단위
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/refresh')
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """토큰 갱신"""
    try:
        # 리프레시 토큰 검증
        payload = auth_service.decode_token(refresh_token)
        
        if payload.get('type') != 'refresh':
            raise HTTPException(status_code=401, detail="잘못된 토큰 타입입니다.")
        
        # 토큰 무효화 확인
        if auth_service.is_token_revoked(refresh_token):
            raise HTTPException(status_code=401, detail="무효화된 토큰입니다.")
        
        # 사용자 조회
        user = db.get(User, int(payload['sub']))
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다.")
        
        # 새 토큰 생성
        new_access_token = auth_service.create_access_token(str(user.id))
        new_refresh_token = auth_service.create_refresh_token(str(user.id))
        
        # 기존 리프레시 토큰 무효화
        auth_service.revoke_token(refresh_token)
        
        return {
            'success': True,
            'data': {
                'access_token': new_access_token,
                'refresh_token': new_refresh_token
            }
        }
    
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/logout')
def logout(access_token: str, refresh_token: Optional[str] = None):
    """로그아웃"""
    try:
        # 액세스 토큰 무효화
        auth_service.revoke_token(access_token)
        
        # 리프레시 토큰도 무효화
        if refresh_token:
            auth_service.revoke_token(refresh_token)
        
        return {
            'success': True,
            'message': '로그아웃되었습니다.'
        }
    except Exception as e:
        return {
            'success': True,
            'message': '로그아웃되었습니다.'
        }

@router.get('/me')
def get_current_user_info(user: User = Depends(get_current_user)):
    """현재 사용자 정보 조회"""
    return {
        'success': True,
        'data': {
            'user': user.to_dict(),
            'usage': user.check_monthly_usage(),
            'limits': user.get_monthly_limits()
        }
    }

@router.put('/profile')
def update_profile(payload: ProfileUpdateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """프로필 업데이트"""
    try:
        if payload.full_name is not None:
            user.full_name = payload.full_name.strip() if payload.full_name else None
        
        if payload.bio is not None:
            user.bio = payload.bio.strip() if payload.bio else None
        
        if payload.avatar_url is not None:
            user.avatar_url = payload.avatar_url.strip() if payload.avatar_url else None
        
        user.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            'success': True,
            'message': '프로필이 업데이트되었습니다.',
            'data': {'user': user.to_dict()}
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/change-password')
def change_password(payload: PasswordChangeRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """비밀번호 변경"""
    try:
        # 현재 비밀번호 확인
        if not auth_service.verify_password(payload.current_password, user.password_hash):
            raise HTTPException(status_code=401, detail="현재 비밀번호가 올바르지 않습니다.")
        
        # 새 비밀번호 검증
        password_valid, password_msg = auth_service.validate_password(payload.new_password)
        if not password_valid:
            raise HTTPException(status_code=400, detail=password_msg)
        
        # 비밀번호 업데이트
        user.password_hash = auth_service.hash_password(payload.new_password)
        user.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            'success': True,
            'message': '비밀번호가 성공적으로 변경되었습니다.'
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/request-password-reset')
def request_password_reset(payload: PasswordResetRequest, request: Request, db: Session = Depends(get_db)):
    """비밀번호 재설정 요청"""
    try:
        # 레이트 리미팅
        client_ip = request.client.host
        allowed, remaining = auth_service.check_rate_limit(f"reset:{client_ip}", max_attempts=3, window_minutes=60)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="비밀번호 재설정 요청이 너무 많습니다. 1시간 후 다시 시도해주세요."
            )
        
        # 사용자 조회
        user = db.query(User).filter(User.email == payload.email).first()
        
        # 보안상 사용자 존재 여부와 관계없이 동일한 응답
        if user:
            reset_token = auth_service.create_reset_token(str(user.id), user.email)
            user.password_reset_token = reset_token
            user.password_reset_expires = datetime.utcnow() + timedelta(minutes=30)
            db.commit()
            
            # 재설정 이메일 발송
            base_url = str(request.base_url).rstrip('/')
            auth_service.send_password_reset_email(user.email, reset_token, base_url)
        
        return {
            'success': True,
            'message': '비밀번호 재설정 링크가 이메일로 발송되었습니다.'
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/reset-password')
def reset_password(payload: PasswordResetConfirmRequest, db: Session = Depends(get_db)):
    """비밀번호 재설정 확인"""
    try:
        # 토큰 검증
        try:
            token_payload = auth_service.decode_token(payload.token)
        except ValueError:
            raise HTTPException(status_code=400, detail="유효하지 않거나 만료된 토큰입니다.")
        
        if token_payload.get('type') != 'reset':
            raise HTTPException(status_code=400, detail="잘못된 토큰 타입입니다.")
        
        # 사용자 조회
        user = db.get(User, int(token_payload['sub']))
        if not user or user.password_reset_token != payload.token:
            raise HTTPException(status_code=400, detail="유효하지 않은 토큰입니다.")
        
        # 토큰 만료 확인
        if user.password_reset_expires and datetime.utcnow() > user.password_reset_expires:
            raise HTTPException(status_code=400, detail="만료된 토큰입니다.")
        
        # 새 비밀번호 검증
        password_valid, password_msg = auth_service.validate_password(payload.new_password)
        if not password_valid:
            raise HTTPException(status_code=400, detail=password_msg)
        
        # 비밀번호 업데이트
        user.password_hash = auth_service.hash_password(payload.new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        user.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            'success': True,
            'message': '비밀번호가 성공적으로 재설정되었습니다.'
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/send-verification-email')
def send_verification_email(payload: EmailVerificationRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """이메일 인증 코드 발송"""
    try:
        if user.is_verified:
            raise HTTPException(status_code=400, detail="이미 인증된 이메일입니다.")
        
        verification_code = auth_service.generate_verification_code()
        user.email_verification_code = verification_code
        user.email_verification_expires = datetime.utcnow() + timedelta(minutes=30)
        db.commit()
        
        email_sent = auth_service.send_verification_email(user.email, verification_code)
        
        return {
            'success': True,
            'message': '인증 코드가 이메일로 발송되었습니다.',
            'data': {'email_sent': email_sent}
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/verify-email')
def verify_email(payload: EmailVerificationConfirmRequest, db: Session = Depends(get_db)):
    """이메일 인증 확인"""
    try:
        user = db.query(User).filter(User.email == payload.email).first()
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
        
        if user.is_verified:
            raise HTTPException(status_code=400, detail="이미 인증된 이메일입니다.")
        
        # 인증 코드 확인
        if (not user.email_verification_code or 
            user.email_verification_code != payload.verification_code):
            raise HTTPException(status_code=400, detail="잘못된 인증 코드입니다.")
        
        # 만료 시간 확인
        if (user.email_verification_expires and 
            datetime.utcnow() > user.email_verification_expires):
            raise HTTPException(status_code=400, detail="만료된 인증 코드입니다.")
        
        # 인증 완료
        user.is_verified = True
        user.email_verification_code = None
        user.email_verification_expires = None
        user.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            'success': True,
            'message': '이메일 인증이 완료되었습니다.'
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/setup-2fa')
def setup_two_factor_auth(payload: TwoFactorSetupRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """2단계 인증 설정"""
    try:
        # 비밀번호 확인
        if not auth_service.verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail="비밀번호가 올바르지 않습니다.")
        
        if user.two_factor_enabled:
            raise HTTPException(status_code=400, detail="이미 2단계 인증이 활성화되어 있습니다.")
        
        # TOTP 시크릿 생성
        secret = two_factor_auth.generate_secret()
        qr_url = two_factor_auth.get_qr_code_url(secret, user.email)
        backup_codes = two_factor_auth.generate_backup_codes()
        
        # 임시 저장 (확인 후 활성화)
        user.two_factor_secret = secret
        user.backup_codes = json.dumps(backup_codes)
        db.commit()
        
        return {
            'success': True,
            'message': '2단계 인증 설정을 위한 QR 코드가 생성되었습니다.',
            'data': {
                'secret': secret,
                'qr_url': qr_url,
                'backup_codes': backup_codes
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/confirm-2fa')
def confirm_two_factor_auth(payload: TwoFactorConfirmRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """2단계 인증 확인 및 활성화"""
    try:
        if user.two_factor_enabled:
            raise HTTPException(status_code=400, detail="이미 2단계 인증이 활성화되어 있습니다.")
        
        # TOTP 토큰 검증
        if not two_factor_auth.verify_totp(payload.secret, payload.token):
            raise HTTPException(status_code=400, detail="잘못된 인증 코드입니다.")
        
        # 2단계 인증 활성화
        user.two_factor_enabled = True
        user.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            'success': True,
            'message': '2단계 인증이 성공적으로 활성화되었습니다.'
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/disable-2fa')
def disable_two_factor_auth(password: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """2단계 인증 비활성화"""
    try:
        # 비밀번호 확인
        if not auth_service.verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="비밀번호가 올바르지 않습니다.")
        
        if not user.two_factor_enabled:
            raise HTTPException(status_code=400, detail="2단계 인증이 활성화되어 있지 않습니다.")
        
        # 2단계 인증 비활성화
        user.two_factor_enabled = False
        user.two_factor_secret = None
        user.backup_codes = None
        user.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            'success': True,
            'message': '2단계 인증이 비활성화되었습니다.'
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/regenerate-api-key')
def regenerate_api_key(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """API 키 재생성"""
    try:
        new_api_key = auth_service.generate_api_key(str(user.id))
        user.api_key = new_api_key
        user.api_key_created = datetime.utcnow()
        user.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            'success': True,
            'message': 'API 키가 재생성되었습니다.',
            'data': {'api_key': new_api_key}
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/usage-stats')
def get_usage_stats(user: User = Depends(get_current_user)):
    """사용량 통계 조회"""
    return {
        'success': True,
        'data': {
            'usage': user.check_monthly_usage(),
            'limits': user.get_monthly_limits(),
            'account_type': 'Premium' if user.is_premium else 'Free',
            'api_access': user.can_use_api()
        }
    }

