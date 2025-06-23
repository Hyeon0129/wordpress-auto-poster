from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from src.utils.dependencies import get_current_user
from src.services.seo_service import SEOAnalyzer, KeywordResearcher

router = APIRouter()

# SEO 분석기 및 키워드 리서처 인스턴스
seo_analyzer = SEOAnalyzer()
keyword_researcher = KeywordResearcher()

class SEOAnalysisRequest(BaseModel):
    title: str
    content: str
    target_keyword: str

class KeywordResearchRequest(BaseModel):
    keyword: str
    count: Optional[int] = 20

class CompetitorAnalysisRequest(BaseModel):
    keyword: str
    count: Optional[int] = 5

class MetaTagsRequest(BaseModel):
    title: str
    content: str
    keyword: str

class ImageOptimizationRequest(BaseModel):
    content: str
    keyword: str

@router.post('/analyze')
def analyze_seo(payload: SEOAnalysisRequest, user = Depends(get_current_user)):
    """콘텐츠 SEO 분석"""
    try:
        analysis = seo_analyzer.analyze_content_seo(
            payload.title, 
            payload.content, 
            payload.target_keyword
        )
        return {
            "success": True,
            "data": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/keyword-research')
def research_keywords(payload: KeywordResearchRequest, user = Depends(get_current_user)):
    """키워드 리서치"""
    try:
        research_results = keyword_researcher.research_keywords(
            payload.keyword, 
            payload.count
        )
        return {
            "success": True,
            "data": research_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/keyword-competition')
def analyze_keyword_competition(payload: KeywordResearchRequest, user = Depends(get_current_user)):
    """키워드 경쟁 강도 분석"""
    try:
        competition_analysis = seo_analyzer.analyze_keyword_competition(payload.keyword)
        return {
            "success": True,
            "data": competition_analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/competitor-analysis')
def analyze_competitors(payload: CompetitorAnalysisRequest, user = Depends(get_current_user)):
    """경쟁사 분석"""
    try:
        competitors = seo_analyzer.analyze_top_competitors(
            payload.keyword, 
            payload.count
        )
        return {
            "success": True,
            "data": competitors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/generate-meta-tags')
def generate_meta_tags(payload: MetaTagsRequest, user = Depends(get_current_user)):
    """메타 태그 생성"""
    try:
        meta_tags = seo_analyzer.generate_meta_tags(
            payload.title,
            payload.content,
            payload.keyword
        )
        return {
            "success": True,
            "data": meta_tags
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/optimize-images')
def optimize_images(payload: ImageOptimizationRequest, user = Depends(get_current_user)):
    """이미지 alt 태그 최적화"""
    try:
        optimized_content = seo_analyzer.optimize_images_alt_text(
            payload.content,
            payload.keyword
        )
        return {
            "success": True,
            "data": {
                "original_content": payload.content,
                "optimized_content": optimized_content
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/related-keywords/{keyword}')
def get_related_keywords(keyword: str, count: int = 10, user = Depends(get_current_user)):
    """관련 키워드 조회"""
    try:
        related_keywords = seo_analyzer.get_related_keywords(keyword, count)
        return {
            "success": True,
            "data": {
                "keyword": keyword,
                "related_keywords": related_keywords
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/keywords/related')
def get_related_keywords_post(payload: KeywordResearchRequest, user = Depends(get_current_user)):
    """관련 키워드 조회 (POST)"""
    try:
        related_keywords = seo_analyzer.get_related_keywords(payload.keyword, payload.count or 10)
        return {
            "success": True,
            "data": {
                "keyword": payload.keyword,
                "related_keywords": related_keywords
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/suggestions')
def get_seo_suggestions(payload: KeywordResearchRequest, user = Depends(get_current_user)):
    """SEO 제안사항 조회"""
    try:
        suggestions = seo_analyzer.get_seo_suggestions(payload.keyword)
        return {
            "success": True,
            "data": {
                "keyword": payload.keyword,
                "suggestions": suggestions
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

