from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from src.utils.dependencies import get_current_user
from src.models.user import User
from src.services.llm_service import LLMService
import os

router = APIRouter()

# LLM 서비스 인스턴스
llm_service = LLMService()

class LLMProviderRequest(BaseModel):
    name: str
    provider_type: str  # 'openai', 'ollama', 'anthropic', etc.
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model_name: str
    is_active: bool = False

class LLMTestRequest(BaseModel):
    provider_type: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model_name: str

@router.get('/providers')
def get_llm_providers(user: User = Depends(get_current_user)):
    """등록된 LLM 제공자 목록 조회"""
    try:
        providers = llm_service.get_user_providers(user.id)
        return {
            'success': True,
            'providers': providers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/providers')
def add_llm_provider(payload: LLMProviderRequest, user: User = Depends(get_current_user)):
    """새 LLM 제공자 추가"""
    try:
        provider = llm_service.add_provider(
            user_id=user.id,
            name=payload.name,
            provider_type=payload.provider_type,
            api_key=payload.api_key,
            base_url=payload.base_url,
            model_name=payload.model_name,
            is_active=payload.is_active
        )
        return {
            'success': True,
            'message': 'LLM 제공자가 성공적으로 추가되었습니다.',
            'provider': provider
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put('/providers/{provider_id}')
def update_llm_provider(provider_id: int, payload: LLMProviderRequest, user: User = Depends(get_current_user)):
    """LLM 제공자 정보 수정"""
    try:
        provider = llm_service.update_provider(
            provider_id=provider_id,
            user_id=user.id,
            name=payload.name,
            provider_type=payload.provider_type,
            api_key=payload.api_key,
            base_url=payload.base_url,
            model_name=payload.model_name,
            is_active=payload.is_active
        )
        return {
            'success': True,
            'message': 'LLM 제공자가 성공적으로 수정되었습니다.',
            'provider': provider
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/providers/{provider_id}')
def delete_llm_provider(provider_id: int, user: User = Depends(get_current_user)):
    """LLM 제공자 삭제"""
    try:
        llm_service.delete_provider(provider_id, user.id)
        return {
            'success': True,
            'message': 'LLM 제공자가 성공적으로 삭제되었습니다.'
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/providers/{provider_id}/activate')
def activate_llm_provider(provider_id: int, user: User = Depends(get_current_user)):
    """LLM 제공자 활성화"""
    try:
        llm_service.activate_provider(provider_id, user.id)
        return {
            'success': True,
            'message': 'LLM 제공자가 활성화되었습니다.'
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/test-connection')
def test_llm_connection(payload: LLMTestRequest, user: User = Depends(get_current_user)):
    """LLM 연결 테스트"""
    try:
        result = llm_service.test_connection(
            provider_type=payload.provider_type,
            api_key=payload.api_key,
            base_url=payload.base_url,
            model_name=payload.model_name
        )
        return {
            'success': True,
            'result': result
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@router.get('/active-provider')
def get_active_provider(user: User = Depends(get_current_user)):
    """현재 활성화된 LLM 제공자 조회"""
    try:
        provider = llm_service.get_active_provider(user.id)
        if not provider:
            # 환경변수에서 OpenAI API 키 확인
            openai_api_key = os.getenv('OPENAI_API_KEY')
            if openai_api_key:
                return {
                    'success': True,
                    'provider': {
                        'id': 0,
                        'name': 'Default OpenAI',
                        'provider_type': 'openai',
                        'model_name': 'gpt-3.5-turbo',
                        'is_active': True,
                        'status': 'connected'
                    }
                }
            else:
                return {
                    'success': False,
                    'message': '활성화된 LLM 제공자가 없습니다. 설정에서 LLM을 추가하거나 환경변수에 OPENAI_API_KEY를 설정하세요.'
                }
        
        return {
            'success': True,
            'provider': provider
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/models/{provider_type}')
def get_available_models(provider_type: str):
    """제공자별 사용 가능한 모델 목록"""
    models = {
        'openai': [
            {'id': 'gpt-3.5-turbo', 'name': 'GPT-3.5 Turbo'},
            {'id': 'gpt-4', 'name': 'GPT-4'},
            {'id': 'gpt-4-turbo', 'name': 'GPT-4 Turbo'},
            {'id': 'gpt-4o', 'name': 'GPT-4o'},
        ],
        'ollama': [
            {'id': 'qwen2.5:32b', 'name': 'Qwen2.5 32B'},
            {'id': 'llama3.1:8b', 'name': 'Llama 3.1 8B'},
            {'id': 'mistral:7b', 'name': 'Mistral 7B'},
            {'id': 'codellama:13b', 'name': 'Code Llama 13B'},
        ],
        'anthropic': [
            {'id': 'claude-3-haiku', 'name': 'Claude 3 Haiku'},
            {'id': 'claude-3-sonnet', 'name': 'Claude 3 Sonnet'},
            {'id': 'claude-3-opus', 'name': 'Claude 3 Opus'},
        ]
    }
    
    return {
        'success': True,
        'models': models.get(provider_type, [])
    }

