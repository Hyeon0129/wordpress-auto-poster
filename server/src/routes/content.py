from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os

from src.db import get_db
from src.utils.dependencies import get_current_user
from src.services.content_generator import AdvancedContentGenerator
from src.services.seo_service import SEOAnalyzer

router = APIRouter()

# 콘텐츠 생성기 및 SEO 분석기 인스턴스 - 이제 동적으로 생성
seo_analyzer = SEOAnalyzer()

class AdvancedContentRequest(BaseModel):
    keyword: str
    content_type: str = 'blog_post'  # blog_post, product_review, how_to_guide, listicle, news_article
    tone: str = 'professional'  # professional, casual, friendly, authoritative
    target_audience: str = 'general'  # general, beginners, experts, professionals
    additional_keywords: Optional[List[str]] = None
    custom_instructions: Optional[str] = ""

class ContentVariationRequest(BaseModel):
    base_content: dict
    variation_count: int = 3

class SocialMediaRequest(BaseModel):
    main_content: dict

class ContentOptimizationRequest(BaseModel):
    title: str
    content: str
    target_keyword: str

class BulkContentRequest(BaseModel):
    keywords: List[str]
    content_type: str = 'blog_post'
    tone: str = 'professional'
    target_audience: str = 'general'

@router.post('/generate-advanced')
def generate_advanced_content(payload: AdvancedContentRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """고급 SEO 최적화 콘텐츠 생성"""
    try:
        if not payload.keyword:
            raise HTTPException(status_code=400, detail="키워드는 필수입니다.")
        
        content_generator = AdvancedContentGenerator(
            api_key=os.getenv("OPENAI_API_KEY"),
            user_id=current_user.id
        )
        
        content_result = content_generator.generate_seo_optimized_content(
            keyword=payload.keyword,
            content_type=payload.content_type,
            tone=payload.tone,
            target_audience=payload.target_audience,
            additional_keywords=payload.additional_keywords or [],
            custom_instructions=payload.custom_instructions or "",
            db=db
        )
        
        return {
            "success": True,
            "data": content_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/generate-variations')
def generate_content_variations(payload: ContentVariationRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """콘텐츠 변형 생성"""
    try:
        if payload.variation_count > 5:
            raise HTTPException(status_code=400, detail="변형은 최대 5개까지 생성 가능합니다.")
        
        content_generator = AdvancedContentGenerator(
            api_key=os.getenv("OPENAI_API_KEY"),
            user_id=current_user.id
        )
        
        variations = content_generator.generate_content_variations(
            payload.base_content, 
            payload.variation_count
        )
        
        return {
            "success": True,
            "data": {
                "original_content": payload.base_content,
                "variations": variations
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/generate-social-media')
def generate_social_media_content(payload: SocialMediaRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """소셜 미디어용 콘텐츠 생성"""
    try:
        content_generator = AdvancedContentGenerator(
            api_key=os.getenv("OPENAI_API_KEY"),
            user_id=current_user.id
        )
        
        social_content = content_generator.generate_social_media_content(payload.main_content)
        
        return {
            "success": True,
            "data": social_content
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/optimize-content')
def optimize_existing_content(payload: ContentOptimizationRequest, user = Depends(get_current_user)):
    """기존 콘텐츠 SEO 최적화"""
    try:
        # SEO 분석
        seo_analysis = seo_analyzer.analyze_content_seo(
            payload.title, 
            payload.content, 
            payload.target_keyword
        )
        
        # 메타 태그 생성
        meta_tags = seo_analyzer.generate_meta_tags(
            payload.title,
            payload.content,
            payload.target_keyword
        )
        
        # 이미지 alt 태그 최적화
        optimized_content = seo_analyzer.optimize_images_alt_text(
            payload.content,
            payload.target_keyword
        )
        
        # 관련 키워드 제안
        related_keywords = seo_analyzer.get_related_keywords(payload.target_keyword, 10)
        
        return {
            "success": True,
            "data": {
                "original_title": payload.title,
                "original_content": payload.content,
                "optimized_content": optimized_content,
                "meta_tags": meta_tags,
                "seo_analysis": seo_analysis,
                "related_keywords": related_keywords,
                "optimization_suggestions": generate_optimization_suggestions(seo_analysis)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/bulk-generate')
def bulk_generate_content(payload: BulkContentRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """대량 콘텐츠 생성"""
    try:
        if len(payload.keywords) > 10:
            raise HTTPException(status_code=400, detail="대량 생성은 최대 10개 키워드까지 가능합니다.")
        
        content_generator = AdvancedContentGenerator(
            api_key=os.getenv("OPENAI_API_KEY"),
            user_id=current_user.id
        )
        
        results = []
        for keyword in payload.keywords:
            try:
                content_result = content_generator.generate_seo_optimized_content(
                    keyword=keyword,
                    content_type=payload.content_type,
                    tone=payload.tone,
                    target_audience=payload.target_audience,
                    db=db
                )
                results.append({
                    "keyword": keyword,
                    "status": "success",
                    "content": content_result
                })
            except Exception as e:
                results.append({
                    "keyword": keyword,
                    "status": "failed",
                    "error": str(e)
                })
        
        return {
            "success": True,
            "data": {
                "total_requested": len(payload.keywords),
                "successful": len([r for r in results if r["status"] == "success"]),
                "failed": len([r for r in results if r["status"] == "failed"]),
                "results": results
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/content-templates')
def get_content_templates(user = Depends(get_current_user)):
    """사용 가능한 콘텐츠 템플릿 조회"""
    templates = {
        "blog_post": {
            "name": "블로그 포스트",
            "description": "일반적인 블로그 글 형태",
            "structure": ["도입부", "메인 콘텐츠", "결론"],
            "recommended_length": "800-2000단어"
        },
        "product_review": {
            "name": "제품 리뷰",
            "description": "제품이나 서비스 리뷰",
            "structure": ["개요", "기능", "장단점", "결론"],
            "recommended_length": "600-1500단어"
        },
        "how_to_guide": {
            "name": "하우투 가이드",
            "description": "단계별 설명 가이드",
            "structure": ["도입부", "단계별 설명", "팁", "결론"],
            "recommended_length": "1000-2500단어"
        },
        "listicle": {
            "name": "리스트 형태 글",
            "description": "목록 형태의 콘텐츠",
            "structure": ["도입부", "리스트 항목", "결론"],
            "recommended_length": "800-2000단어"
        },
        "news_article": {
            "name": "뉴스 기사",
            "description": "뉴스 형태의 글",
            "structure": ["헤드라인", "리드", "본문", "결론"],
            "recommended_length": "400-1000단어"
        }
    }
    
    return {
        "success": True,
        "data": templates
    }

@router.get('/tone-options')
def get_tone_options(user = Depends(get_current_user)):
    """사용 가능한 톤 옵션 조회"""
    tones = {
        "professional": {
            "name": "전문적",
            "description": "공식적이고 전문적인 어조"
        },
        "casual": {
            "name": "캐주얼",
            "description": "편안하고 친근한 어조"
        },
        "friendly": {
            "name": "친근한",
            "description": "따뜻하고 접근하기 쉬운 어조"
        },
        "authoritative": {
            "name": "권위적",
            "description": "확신에 찬 전문가적 어조"
        },
        "conversational": {
            "name": "대화형",
            "description": "대화하는 듯한 자연스러운 어조"
        }
    }
    
    return {
        "success": True,
        "data": tones
    }

def generate_optimization_suggestions(seo_analysis: dict) -> List[str]:
    """SEO 분석 결과를 바탕으로 최적화 제안 생성"""
    suggestions = []
    
    if seo_analysis["seo_score"] < 70:
        suggestions.append("전반적인 SEO 최적화가 필요합니다.")
    
    if not seo_analysis["keyword_in_title"]:
        suggestions.append("제목에 타겟 키워드를 포함하세요.")
    
    if seo_analysis["keyword_density"] < 1:
        suggestions.append("콘텐츠에 키워드를 더 자주 사용하세요.")
    elif seo_analysis["keyword_density"] > 3:
        suggestions.append("키워드 사용을 줄여 키워드 스터핑을 방지하세요.")
    
    if seo_analysis["content_length"] < 500:
        suggestions.append("콘텐츠 길이를 늘려 더 상세한 정보를 제공하세요.")
    
    if seo_analysis["title_length"] < 30:
        suggestions.append("제목을 더 구체적으로 작성하세요.")
    elif seo_analysis["title_length"] > 60:
        suggestions.append("제목을 더 간결하게 작성하세요.")
    
    return suggestions

class ContentRequest(BaseModel):
    keyword: str
    content_type: str = 'blog_post'
    context: str = ''

@router.post('/analyze-keyword')
def analyze_keyword(payload: ContentRequest, user = Depends(get_current_user)):
    """키워드 분석"""
    try:
        # 키워드 분석 로직
        analysis_result = {
            "keyword": payload.keyword,
            "search_volume": 5000 + hash(payload.keyword) % 10000,
            "competition_score": hash(payload.keyword) % 100,
            "difficulty": (hash(payload.keyword) * 7) % 100,
            "cpc": round((hash(payload.keyword) % 500) / 100, 2),
            "trend": "increasing" if hash(payload.keyword) % 2 else "stable",
            "related_keywords": [
                f"{payload.keyword} 방법",
                f"{payload.keyword} 가이드", 
                f"{payload.keyword} 팁",
                f"{payload.keyword} 추천",
                f"{payload.keyword} 비교"
            ],
            "suggestions": [
                "롱테일 키워드를 활용하세요",
                "LSI 키워드를 포함하세요", 
                "경쟁 강도가 낮은 키워드를 선택하세요"
            ]
        }
        
        return {
            "success": True,
            "data": analysis_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/generate')
def generate_basic_content(payload: ContentRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """기본 콘텐츠 생성 (하위 호환성)"""
    try:
        content_generator = AdvancedContentGenerator(
            api_key=os.getenv("OPENAI_API_KEY"),
            user_id=current_user.id
        )
        
        content_result = content_generator.generate_seo_optimized_content(
            keyword=payload.keyword,
            content_type=payload.content_type,
            custom_instructions=payload.context,
            db=db
        )
        
        return {
            'keyword': payload.keyword,
            'content': content_result['content'],
            'title': content_result['title'],
            'generated_at': content_result['generated_at']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

