from fastapi import APIRouter, Depends
from pydantic import BaseModel
from src.utils.dependencies import get_current_user

router = APIRouter()

class SEORequest(BaseModel):
    title: str
    content: str
    target_keyword: str = ''

@router.post('/analyze')
def analyze_seo(payload: SEORequest, user = Depends(get_current_user)):
    score = 80 if payload.target_keyword.lower() in payload.title.lower() else 60
    return {'score': score, 'keyword': payload.target_keyword}
