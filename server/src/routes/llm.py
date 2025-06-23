from fastapi import APIRouter, Depends
from src.utils.dependencies import get_current_user

router = APIRouter()

@router.get('/providers')
def get_llm_providers(user = Depends(get_current_user)):
    providers = [
        {
            'id': 1,
            'name': 'Ollama',
            'provider_type': 'ollama',
            'status': 'connected'
        }
    ]
    return {'providers': providers}
