from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from src.db import get_db
from src.models.user import User
from src.models.llm_provider import LLMProvider
from src.services.auth_service import get_current_user
from src.services.llm_service import LLMService

router = APIRouter()

class LLMProviderCreate(BaseModel):
    name: str
    provider_type: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model_name: str

class LLMProviderResponse(BaseModel):
    id: int
    name: str
    provider_type: str
    model_name: str
    is_active: bool
    status: str

@router.get("/providers")
async def get_llm_providers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자의 LLM 제공자 목록 조회"""
    providers = db.query(LLMProvider).filter(
        LLMProvider.user_id == current_user.id
    ).all()
    
    return {
        "providers": [
            {
                "id": p.id,
                "name": p.name,
                "provider_type": p.provider_type,
                "model_name": p.model_name,
                "is_active": p.is_active,
                "status": "connected" if p.api_key else "disconnected"
            }
            for p in providers
        ]
    }

@router.post("/providers")
async def create_llm_provider(
    provider_data: LLMProviderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """새 LLM 제공자 추가"""
    # 기존 활성 제공자 비활성화
    db.query(LLMProvider).filter(
        LLMProvider.user_id == current_user.id,
        LLMProvider.is_active == True
    ).update({"is_active": False})
    
    # 새 제공자 생성
    new_provider = LLMProvider(
        user_id=current_user.id,
        name=provider_data.name,
        provider_type=provider_data.provider_type,
        api_key=provider_data.api_key,
        base_url=provider_data.base_url,
        model_name=provider_data.model_name,
        is_active=True
    )
    
    db.add(new_provider)
    db.commit()
    db.refresh(new_provider)
    
    return {"message": "LLM 제공자가 성공적으로 추가되었습니다.", "provider_id": new_provider.id}

@router.delete("/providers/{provider_id}")
async def delete_llm_provider(
    provider_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """LLM 제공자 삭제"""
    provider = db.query(LLMProvider).filter(
        LLMProvider.id == provider_id,
        LLMProvider.user_id == current_user.id
    ).first()
    
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LLM 제공자를 찾을 수 없습니다."
        )
    
    db.delete(provider)
    db.commit()
    
    return {"message": "LLM 제공자가 성공적으로 삭제되었습니다."}

@router.get("/models")
async def get_available_models(
    current_user: User = Depends(get_current_user)
):
    """사용 가능한 모델 목록 조회"""
    return {
        "openai": ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"],
        "ollama": ["qwen2.5:32b", "llama3.1:8b", "mistral:7b"]
    }

@router.post("/test")
async def test_llm_connection(
    provider_data: LLMProviderCreate,
    current_user: User = Depends(get_current_user)
):
    """LLM 연결 테스트"""
    try:
        llm_service = LLMService()
        result = await llm_service.test_connection(
            provider_type=provider_data.provider_type,
            api_key=provider_data.api_key,
            base_url=provider_data.base_url,
            model_name=provider_data.model_name
        )
        return result
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.post("/generate")
async def generate_content(
    prompt: str,
    model: str = "gpt-3.5-turbo",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """LLM을 사용하여 콘텐츠 생성"""
    try:
        llm_service = LLMService()
        content = await llm_service.generate_content(prompt, model)
        
        return {
            "content": content,
            "model": model,
            "prompt": prompt
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze")
async def analyze_content(
    content: str,
    analysis_type: str = "seo",
    current_user: User = Depends(get_current_user)
):
    """콘텐츠 분석"""
    try:
        llm_service = LLMService()
        analysis = await llm_service.analyze_content(content, analysis_type)
        
        return {
            "analysis": analysis,
            "type": analysis_type,
            "content_length": len(content)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

