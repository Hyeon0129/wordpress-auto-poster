from fastapi import APIRouter, HTTPException, Depends
from typing import Dict
from datetime import datetime
from ..services.seo_service import seo_service, SEOAnalysisRequest, KeywordResearchRequest
from ..auth import get_current_user

router = APIRouter(prefix="/api/seo", tags=["SEO"])

@router.post("/analyze")
async def analyze_seo(
    request: SEOAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """SEO 분석 수행"""
    try:
        if request.url:
            # URL 기반 분석
            result = seo_service.analyze_url_seo(request.url, request.keyword)
        else:
            # 콘텐츠 기반 분석
            result = seo_service.analyze_content_seo(request.keyword, request.content)
        
        # 분석 기록 저장
        user_id = str(current_user.get("id"))
        seo_service.save_analysis_history(user_id, {
            "type": "seo_analysis",
            "keyword": request.keyword,
            "result": result
        })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SEO 분석 실패: {str(e)}")

@router.post("/keywords/research")
async def research_keywords(
    request: KeywordResearchRequest,
    current_user: dict = Depends(get_current_user)
):
    """키워드 리서치 수행"""
    try:
        result = seo_service.research_keywords(request.keyword, request.language)
        
        # 리서치 기록 저장
        user_id = str(current_user.get("id"))
        seo_service.save_analysis_history(user_id, {
            "type": "keyword_research",
            "keyword": request.keyword,
            "result": result
        })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"키워드 리서치 실패: {str(e)}")

@router.get("/keywords/suggestions/{keyword}")
async def get_keyword_suggestions(
    keyword: str,
    current_user: dict = Depends(get_current_user)
):
    """키워드 제안 조회"""
    try:
        related_keywords = seo_service.generate_related_keywords(keyword)
        suggestions = seo_service.generate_keyword_suggestions(keyword)
        
        return {
            "success": True,
            "keyword": keyword,
            "related_keywords": related_keywords,
            "suggestions": suggestions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"키워드 제안 조회 실패: {str(e)}")

@router.get("/history")
async def get_seo_history(current_user: dict = Depends(get_current_user)):
    """SEO 분석 기록 조회"""
    try:
        user_id = str(current_user.get("id"))
        history_file = f"data/seo/{user_id}_seo_history.json"
        
        history = []
        if os.path.exists(history_file):
            with open(history_file, "r", encoding="utf-8") as f:
                history = json.load(f)
        
        return {
            "success": True,
            "history": history[-20:]  # 최근 20개만 반환
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SEO 기록 조회 실패: {str(e)}")

@router.post("/optimize")
async def optimize_content(
    request: SEOAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """콘텐츠 SEO 최적화 제안"""
    try:
        # 기본 SEO 분석 수행
        analysis_result = seo_service.analyze_content_seo(request.keyword, request.content)
        
        if not analysis_result["success"]:
            raise HTTPException(status_code=400, detail="SEO 분석 실패")
        
        analysis = analysis_result["analysis"]
        
        # 최적화 제안 생성
        optimization_suggestions = []
        
        # 키워드 밀도 최적화
        current_density = analysis["metrics"]["keyword_density"]
        if current_density < 1:
            optimization_suggestions.append({
                "type": "keyword_density",
                "priority": "high",
                "suggestion": f"키워드 '{request.keyword}'를 {3-int(current_density)}회 더 추가하여 키워드 밀도를 1-3% 범위로 맞추세요."
            })
        elif current_density > 3:
            optimization_suggestions.append({
                "type": "keyword_density",
                "priority": "high",
                "suggestion": f"키워드 '{request.keyword}'의 사용을 줄여 키워드 밀도를 3% 이하로 낮추세요."
            })
        
        # 제목 최적화
        lines = request.content.split('\n')
        title_line = lines[0] if lines else ""
        if request.keyword.lower() not in title_line.lower():
            optimization_suggestions.append({
                "type": "title",
                "priority": "high",
                "suggestion": f"제목에 키워드 '{request.keyword}'를 포함하세요."
            })
        
        # 메타 설명 생성 제안
        meta_description = f"{request.keyword}에 대한 완벽한 가이드. {request.content[:100]}..."
        optimization_suggestions.append({
            "type": "meta_description",
            "priority": "medium",
            "suggestion": f"추천 메타 설명: {meta_description}"
        })
        
        return {
            "success": True,
            "analysis": analysis,
            "optimization_suggestions": optimization_suggestions,
            "optimized_meta": {
                "title": f"{request.keyword} - 완벽한 가이드",
                "description": meta_description,
                "keywords": [request.keyword] + seo_service.generate_related_keywords(request.keyword)[:5]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"콘텐츠 최적화 실패: {str(e)}")

