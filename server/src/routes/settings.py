from fastapi import APIRouter, HTTPException, Depends
from typing import Dict
from pydantic import BaseModel
from ..services.user_settings_service import user_settings_service, UserSettings
from ..auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class SettingsUpdateRequest(BaseModel):
    theme: str = None
    language: str = None
    notifications: bool = None
    auto_save: bool = None
    default_content_type: str = None
    default_tone: str = None
    default_word_count: int = None

@router.get("/")
async def get_user_settings(current_user: dict = Depends(get_current_user)):
    """사용자 설정 조회"""
    try:
        user_id = str(current_user.get("id"))
        settings = user_settings_service.get_user_settings(user_id)
        
        return {
            "success": True,
            "settings": settings.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"설정 조회 실패: {str(e)}")

@router.post("/")
async def save_user_settings(
    settings: UserSettings,
    current_user: dict = Depends(get_current_user)
):
    """사용자 설정 저장"""
    try:
        user_id = str(current_user.get("id"))
        result = user_settings_service.save_user_settings(user_id, settings)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"설정 저장 실패: {str(e)}")

@router.patch("/")
async def update_user_settings(
    settings_update: SettingsUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """사용자 설정 부분 업데이트"""
    try:
        user_id = str(current_user.get("id"))
        
        # None이 아닌 값들만 업데이트
        update_data = {}
        for key, value in settings_update.dict().items():
            if value is not None:
                update_data[key] = value
        
        if not update_data:
            return {
                "success": True,
                "message": "업데이트할 설정이 없습니다."
            }
        
        result = user_settings_service.update_user_settings(user_id, update_data)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"설정 업데이트 실패: {str(e)}")

@router.post("/reset")
async def reset_user_settings(current_user: dict = Depends(get_current_user)):
    """사용자 설정 초기화"""
    try:
        user_id = str(current_user.get("id"))
        result = user_settings_service.reset_user_settings(user_id)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"설정 초기화 실패: {str(e)}")

