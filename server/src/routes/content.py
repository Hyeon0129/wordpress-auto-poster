from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from openai import OpenAI
from pydantic import BaseModel
from datetime import datetime
import re

from src.db import get_db
from src.utils.dependencies import get_current_user

router = APIRouter()

class ContentRequest(BaseModel):
    keyword: str
    content_type: str = 'blog_post'
    context: str = ''

class KeywordRequest(BaseModel):
    keyword: str

class LLMManager:
    def __init__(self, model_name='gpt-3.5-turbo', api_key=None, base_url=None):
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.model_name = model_name

    def generate_content(self, keyword, context):
        prompt = f"Write a blog post about {keyword}. {context}"
        res = self.client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
        )
        return res.choices[0].message.content

@router.post('/generate')
def generate(payload: ContentRequest, user = Depends(get_current_user)):
    llm = LLMManager()
    content = llm.generate_content(payload.keyword, payload.context)
    return {
        'keyword': payload.keyword,
        'content': content,
        'generated_at': datetime.now().isoformat()
    }

@router.post('/analyze-keyword')
def analyze(payload: KeywordRequest, user = Depends(get_current_user)):
    # dummy analysis
    suggestions = [f"Use {payload.keyword} in the title", f"Mention {payload.keyword} 3 times"]
    return {'keyword': payload.keyword, 'suggestions': suggestions}
