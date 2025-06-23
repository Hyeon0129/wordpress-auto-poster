import os
import json
from typing import Dict, Optional
from fastapi import HTTPException
from pydantic import BaseModel

class UserSettings(BaseModel):
    theme: str = "system"  # light, dark, system
    language: str = "ko"   # ko, en
    notifications: bool = True
    auto_save: bool = True
    default_content_type: str = "blog"
    default_tone: str = "professional"
    default_word_count: int = 1000

class UserSettingsService:
    def __init__(self):
        self.settings_dir = "data/user_settings"
        os.makedirs(self.settings_dir, exist_ok=True)
    
    def get_settings_file_path(self, user_id: str) -> str:
        """사용자별 설정 파일 경로 반환"""
        return os.path.join(self.settings_dir, f"{user_id}_settings.json")
    
    def get_user_settings(self, user_id: str) -> UserSettings:
        """사용자 설정 조회"""
        try:
            settings_file = self.get_settings_file_path(user_id)
            
            if os.path.exists(settings_file):
                with open(settings_file, "r", encoding="utf-8") as f:
                    settings_data = json.load(f)
                return UserSettings(**settings_data)
            else:
                # 기본 설정 반환
                return UserSettings()
                
        except Exception as e:
            print(f"설정 조회 실패: {str(e)}")
            return UserSettings()
    
    def save_user_settings(self, user_id: str, settings: UserSettings) -> Dict:
        """사용자 설정 저장"""
        try:
            settings_file = self.get_settings_file_path(user_id)
            
            with open(settings_file, "w", encoding="utf-8") as f:
                json.dump(settings.dict(), f, ensure_ascii=False, indent=2)
            
            return {
                "success": True,
                "message": "설정이 성공적으로 저장되었습니다."
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"설정 저장 실패: {str(e)}")
    
    def update_user_settings(self, user_id: str, settings_update: Dict) -> Dict:
        """사용자 설정 부분 업데이트"""
        try:
            current_settings = self.get_user_settings(user_id)
            current_dict = current_settings.dict()
            
            # 업데이트할 필드만 변경
            for key, value in settings_update.items():
                if key in current_dict:
                    current_dict[key] = value
            
            updated_settings = UserSettings(**current_dict)
            return self.save_user_settings(user_id, updated_settings)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"설정 업데이트 실패: {str(e)}")
    
    def reset_user_settings(self, user_id: str) -> Dict:
        """사용자 설정 초기화"""
        try:
            default_settings = UserSettings()
            return self.save_user_settings(user_id, default_settings)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"설정 초기화 실패: {str(e)}")

# 전역 사용자 설정 서비스 인스턴스
user_settings_service = UserSettingsService()

