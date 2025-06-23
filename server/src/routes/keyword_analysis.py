from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from src.utils.dependencies import get_current_user

router = APIRouter()

class KeywordAnalysisRequest(BaseModel):
    keyword: str
    location: str = "kr"
    language: str = "ko"

class BulkKeywordAnalysisRequest(BaseModel):
    keywords: List[str]
    location: str = "kr"
    language: str = "ko"

@router.post('/analyze')
def analyze_keyword(payload: KeywordAnalysisRequest, user = Depends(get_current_user)):
    """키워드 분석"""
    try:
        # 키워드 분석 로직 (데모 데이터)
        keyword = payload.keyword
        
        # 해시를 이용한 일관된 데모 데이터 생성
        hash_value = hash(keyword)
        
        analysis_result = {
            "keyword": keyword,
            "search_volume": 1000 + abs(hash_value) % 50000,
            "competition_score": abs(hash_value) % 100,
            "difficulty": abs(hash_value * 7) % 100,
            "cpc": round(abs(hash_value % 500) / 100, 2),
            "trend": "increasing" if hash_value % 3 == 0 else "stable" if hash_value % 3 == 1 else "decreasing",
            "related_keywords": [
                f"{keyword} 방법",
                f"{keyword} 가이드", 
                f"{keyword} 팁",
                f"{keyword} 추천",
                f"{keyword} 비교",
                f"{keyword} 리뷰",
                f"최고의 {keyword}",
                f"{keyword} 사용법"
            ][:5 + abs(hash_value) % 4],
            "suggestions": [
                f"'{keyword}' 키워드의 경쟁 강도가 적절합니다",
                "롱테일 키워드를 활용하여 더 구체적인 타겟팅을 시도해보세요",
                "관련 키워드를 콘텐츠에 자연스럽게 포함시키세요",
                "검색 의도를 파악하여 사용자가 원하는 정보를 제공하세요"
            ],
            "search_intent": "informational" if hash_value % 4 == 0 else "commercial" if hash_value % 4 == 1 else "navigational" if hash_value % 4 == 2 else "transactional",
            "seasonality": {
                "is_seasonal": hash_value % 5 == 0,
                "peak_months": ["12", "1", "2"] if hash_value % 5 == 0 else []
            }
        }
        
        return {
            "success": True,
            "data": analysis_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/bulk-analyze')
def bulk_analyze_keywords(payload: BulkKeywordAnalysisRequest, user = Depends(get_current_user)):
    """대량 키워드 분석"""
    try:
        if len(payload.keywords) > 20:
            raise HTTPException(status_code=400, detail="한 번에 최대 20개의 키워드만 분석할 수 있습니다.")
        
        results = []
        for keyword in payload.keywords:
            try:
                # 개별 키워드 분석
                hash_value = hash(keyword)
                
                analysis = {
                    "keyword": keyword,
                    "search_volume": 1000 + abs(hash_value) % 50000,
                    "competition_score": abs(hash_value) % 100,
                    "difficulty": abs(hash_value * 7) % 100,
                    "cpc": round(abs(hash_value % 500) / 100, 2),
                    "trend": "increasing" if hash_value % 3 == 0 else "stable" if hash_value % 3 == 1 else "decreasing"
                }
                
                results.append({
                    "keyword": keyword,
                    "status": "success",
                    "data": analysis
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
                "total_analyzed": len(payload.keywords),
                "successful": len([r for r in results if r["status"] == "success"]),
                "failed": len([r for r in results if r["status"] == "failed"]),
                "results": results
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/trending')
def get_trending_keywords(category: str = "general", limit: int = 20, user = Depends(get_current_user)):
    """트렌딩 키워드 조회"""
    try:
        # 카테고리별 트렌딩 키워드 (데모 데이터)
        trending_keywords = {
            "general": [
                "인공지능", "메타버스", "NFT", "블록체인", "암호화폐",
                "원격근무", "디지털 전환", "지속가능성", "ESG", "탄소중립",
                "전기차", "자율주행", "5G", "클라우드", "빅데이터"
            ],
            "technology": [
                "ChatGPT", "머신러닝", "딥러닝", "클라우드 컴퓨팅", "사이버보안",
                "양자컴퓨팅", "엣지컴퓨팅", "IoT", "AR", "VR"
            ],
            "business": [
                "스타트업", "디지털 마케팅", "이커머스", "핀테크", "애자일",
                "리모트워크", "디지털 트랜스포메이션", "고객경험", "데이터 분석", "자동화"
            ],
            "lifestyle": [
                "홈트레이닝", "제로웨이스트", "미니멀라이프", "플렉시테리언", "워라밸",
                "셀프케어", "마인드풀니스", "지속가능한 패션", "비건", "홈카페"
            ]
        }
        
        keywords = trending_keywords.get(category, trending_keywords["general"])[:limit]
        
        # 각 키워드에 대한 기본 정보 추가
        result = []
        for i, keyword in enumerate(keywords):
            hash_value = hash(keyword)
            result.append({
                "keyword": keyword,
                "rank": i + 1,
                "search_volume": 5000 + abs(hash_value) % 45000,
                "growth_rate": abs(hash_value) % 200 - 50,  # -50% ~ +150%
                "competition": abs(hash_value) % 100
            })
        
        return {
            "success": True,
            "data": {
                "category": category,
                "keywords": result
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/suggestions/{keyword}')
def get_keyword_suggestions(keyword: str, limit: int = 10, user = Depends(get_current_user)):
    """키워드 제안"""
    try:
        # 키워드 제안 생성
        base_suggestions = [
            f"{keyword} 방법",
            f"{keyword} 가이드",
            f"{keyword} 팁",
            f"{keyword} 추천",
            f"{keyword} 비교",
            f"{keyword} 리뷰",
            f"{keyword} 사용법",
            f"{keyword} 장점",
            f"{keyword} 단점",
            f"{keyword} 효과",
            f"최고의 {keyword}",
            f"{keyword} 선택",
            f"{keyword} 종류",
            f"{keyword} 특징",
            f"{keyword} 정보",
            f"{keyword} 순위",
            f"{keyword} 가격",
            f"{keyword} 구매",
            f"{keyword} 설치",
            f"{keyword} 설정"
        ]
        
        suggestions = base_suggestions[:limit]
        
        # 각 제안에 대한 기본 정보 추가
        result = []
        for suggestion in suggestions:
            hash_value = hash(suggestion)
            result.append({
                "keyword": suggestion,
                "search_volume": 500 + abs(hash_value) % 10000,
                "competition": abs(hash_value) % 100,
                "relevance_score": 70 + abs(hash_value) % 30
            })
        
        return {
            "success": True,
            "data": {
                "original_keyword": keyword,
                "suggestions": result
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/competition-analysis')
def analyze_competition(payload: KeywordAnalysisRequest, user = Depends(get_current_user)):
    """키워드 경쟁 분석"""
    try:
        keyword = payload.keyword
        hash_value = hash(keyword)
        
        # 경쟁사 분석 데모 데이터
        competitors = []
        for i in range(5):
            competitor_hash = hash(f"{keyword}_{i}")
            competitors.append({
                "rank": i + 1,
                "domain": f"example{i+1}.com",
                "title": f"{keyword} 관련 최고의 가이드 - Example{i+1}",
                "url": f"https://example{i+1}.com/{keyword.replace(' ', '-')}",
                "domain_authority": 50 + abs(competitor_hash) % 50,
                "page_authority": 30 + abs(competitor_hash) % 40,
                "backlinks": abs(competitor_hash) % 10000,
                "content_length": 800 + abs(competitor_hash) % 2000,
                "social_shares": abs(competitor_hash) % 5000
            })
        
        analysis_result = {
            "keyword": keyword,
            "total_results": 1000000 + abs(hash_value) % 9000000,
            "avg_domain_authority": sum(c["domain_authority"] for c in competitors) / len(competitors),
            "avg_content_length": sum(c["content_length"] for c in competitors) / len(competitors),
            "competition_level": "높음" if abs(hash_value) % 3 == 0 else "보통" if abs(hash_value) % 3 == 1 else "낮음",
            "opportunity_score": abs(hash_value) % 100,
            "top_competitors": competitors,
            "recommendations": [
                "더 긴 형태의 콘텐츠를 작성하세요 (2000+ 단어)",
                "고품질 백링크 구축에 집중하세요",
                "소셜 미디어 공유를 늘리세요",
                "사용자 경험을 개선하세요",
                "모바일 최적화를 확인하세요"
            ]
        }
        
        return {
            "success": True,
            "data": analysis_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

