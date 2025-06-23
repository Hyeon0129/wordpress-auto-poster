from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from src.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(30), unique=True, index=True, nullable=False)
    email = Column(String(254), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    # 프로필 정보
    full_name = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    
    # 계정 상태
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_premium = Column(Boolean, default=False)
    
    # 인증 관련
    email_verification_code = Column(String(10), nullable=True)
    email_verification_expires = Column(DateTime, nullable=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)
    
    # 2단계 인증
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(32), nullable=True)
    backup_codes = Column(Text, nullable=True)  # JSON 형태로 저장
    
    # API 관련
    api_key = Column(String(64), nullable=True, unique=True)
    api_key_created = Column(DateTime, nullable=True)
    
    # 사용량 추적
    monthly_posts_count = Column(Integer, default=0)
    monthly_keywords_count = Column(Integer, default=0)
    last_reset_date = Column(DateTime, default=func.now())
    
    # 로그인 추적
    last_login = Column(DateTime, nullable=True)
    login_count = Column(Integer, default=0)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    
    # 타임스탬프
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'avatar_url': self.avatar_url,
            'bio': self.bio,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'is_premium': self.is_premium,
            'two_factor_enabled': self.two_factor_enabled,
            'monthly_posts_count': self.monthly_posts_count,
            'monthly_keywords_count': self.monthly_keywords_count,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'login_count': self.login_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def to_public_dict(self):
        """공개 정보만 포함한 딕셔너리"""
        return {
            'id': self.id,
            'username': self.username,
            'full_name': self.full_name,
            'avatar_url': self.avatar_url,
            'bio': self.bio,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def is_account_locked(self):
        """계정 잠금 상태 확인"""
        if self.locked_until:
            from datetime import datetime
            return datetime.utcnow() < self.locked_until
        return False
    
    def can_use_api(self):
        """API 사용 가능 여부 확인"""
        return self.is_active and self.is_verified and self.api_key is not None
    
    def get_monthly_limits(self):
        """월간 사용 한도 조회"""
        if self.is_premium:
            return {
                'posts': 1000,
                'keywords': 5000,
                'sites': 10
            }
        else:
            return {
                'posts': 50,
                'keywords': 200,
                'sites': 2
            }
    
    def check_monthly_usage(self):
        """월간 사용량 확인"""
        limits = self.get_monthly_limits()
        return {
            'posts': {
                'used': self.monthly_posts_count,
                'limit': limits['posts'],
                'remaining': max(0, limits['posts'] - self.monthly_posts_count)
            },
            'keywords': {
                'used': self.monthly_keywords_count,
                'limit': limits['keywords'],
                'remaining': max(0, limits['keywords'] - self.monthly_keywords_count)
            }
        }

