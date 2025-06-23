from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from pydantic import BaseModel
from ..services.llm_service import llm_service, LLMConfig
from ..auth import get_current_user

router = APIRouter(prefix="/api/llm", tags=["LLM"])

class LLMConfigRequest(BaseModel):
    name: str
    provider: str
    api_key: str
    model: str
    is_active: bool = True

class ContentGenerationRequest(BaseModel):
    prompt: str
    max_tokens: int = 2000
    temperature: float = 0.7

@router.post("/configs")
async def add_llm_config(
    config_request: LLMConfigRequest,
    current_user: dict = Depends(get_current_user)
):
    """새로운 LLM 설정 추가"""
    config = LLMConfig(**config_request.dict())
    return llm_service.add_llm_config(config)

@router.get("/configs")
async def get_llm_configs(current_user: dict = Depends(get_current_user)):
    """모든 LLM 설정 조회"""
    return {
        "success": True,
        "configs": llm_service.get_llm_configs()
    }

@router.put("/configs/{config_id}")
async def update_llm_config(
    config_id: str,
    config_request: LLMConfigRequest,
    current_user: dict = Depends(get_current_user)
):
    """LLM 설정 업데이트"""
    config = LLMConfig(**config_request.dict())
    return llm_service.update_llm_config(config_id, config)

@router.delete("/configs/{config_id}")
async def delete_llm_config(
    config_id: str,
    current_user: dict = Depends(get_current_user)
):
    """LLM 설정 삭제"""
    return llm_service.delete_llm_config(config_id)

@router.post("/test-connection")
async def test_llm_connection(
    config_request: LLMConfigRequest,
    current_user: dict = Depends(get_current_user)
):
    """LLM 연결 테스트"""
    try:
        is_valid = llm_service.validate_api_key(config_request.provider, config_request.api_key)
        if is_valid:
            return {
                "success": True,
                "message": "API 키가 유효합니다.",
                "provider": config_request.provider
            }
        else:
            return {
                "success": False,
                "message": "API 키가 유효하지 않습니다."
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"연결 테스트 실패: {str(e)}")

@router.post("/generate")
async def generate_content(
    request: ContentGenerationRequest,
    current_user: dict = Depends(get_current_user)
):
    """콘텐츠 생성"""
    return llm_service.generate_content(
        prompt=request.prompt,
        max_tokens=request.max_tokens,
        temperature=request.temperature
    )

@router.get("/status")
async def get_llm_status(current_user: dict = Depends(get_current_user)):
    """LLM 연결 상태 확인"""
    active_config = llm_service.get_active_config()
    if active_config:
        return {
            "success": True,
            "connected": True,
            "provider": active_config.provider,
            "model": active_config.model,
            "name": active_config.name
        }
    else:
        return {
            "success": True,
            "connected": False,
            "message": "활성화된 LLM 설정이 없습니다."
        }

