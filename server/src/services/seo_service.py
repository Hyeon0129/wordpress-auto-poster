import requests
import re
from typing import Dict, List, Optional
from fastapi import HTTPException
from pydantic import BaseModel
from bs4 import BeautifulSoup
import json
import os

class SEOAnalysisRequest(BaseModel):
    keyword: str
    content: str = ""
    url: str = ""

class KeywordResearchRequest(BaseModel):
    keyword: str
    language: str = "ko"
    country: str = "KR"

class SEOService:
    def __init__(self):
        self.data_dir = "data/seo"
        os.makedirs(self.data_dir, exist_ok=True)
    
    def analyze_content_seo(self, keyword: str, content: str) -> Dict:
        """콘텐츠 SEO 분석"""
        try:
            analysis = {
                "keyword": keyword,
                "score": 0,
                "recommendations": [],
                "metrics": {}
            }
            
            # 기본 메트릭 계산
            word_count = len(content.split())
            keyword_count = content.lower().count(keyword.lower())
            keyword_density = (keyword_count / word_count * 100) if word_count > 0 else 0
            
            analysis["metrics"] = {
                "word_count": word_count,
                "keyword_count": keyword_count,
                "keyword_density": round(keyword_density, 2),
                "readability_score": self.calculate_readability(content)
            }
            
            # SEO 점수 계산
            score = 0
            
            # 단어 수 체크 (300-2000 단어 권장)
            if 300 <= word_count <= 2000:
                score += 20
            elif word_count < 300:
                analysis["recommendations"].append("콘텐츠가 너무 짧습니다. 최소 300단어 이상 작성하세요.")
            else:
                analysis["recommendations"].append("콘텐츠가 너무 깁니다. 2000단어 이하로 줄이는 것을 권장합니다.")
            
            # 키워드 밀도 체크 (1-3% 권장)
            if 1 <= keyword_density <= 3:
                score += 25
            elif keyword_density < 1:
                analysis["recommendations"].append("키워드 밀도가 낮습니다. 키워드를 더 자주 사용하세요.")
            else:
                analysis["recommendations"].append("키워드 밀도가 높습니다. 키워드 사용을 줄이세요.")
            
            # 제목에 키워드 포함 체크
            lines = content.split('\n')
            title_line = lines[0] if lines else ""
            if keyword.lower() in title_line.lower():
                score += 20
            else:
                analysis["recommendations"].append("제목에 키워드를 포함하세요.")
            
            # 헤딩 구조 체크
            heading_count = len(re.findall(r'^#{1,6}\s', content, re.MULTILINE))
            if heading_count >= 2:
                score += 15
            else:
                analysis["recommendations"].append("헤딩(H1, H2, H3 등)을 사용하여 구조를 개선하세요.")
            
            # 가독성 점수
            readability = analysis["metrics"]["readability_score"]
            if readability >= 60:
                score += 20
            else:
                analysis["recommendations"].append("문장을 더 간단하고 읽기 쉽게 작성하세요.")
            
            analysis["score"] = min(score, 100)
            
            # 점수에 따른 전체 평가
            if analysis["score"] >= 80:
                analysis["overall"] = "우수"
            elif analysis["score"] >= 60:
                analysis["overall"] = "양호"
            elif analysis["score"] >= 40:
                analysis["overall"] = "보통"
            else:
                analysis["overall"] = "개선 필요"
            
            return {
                "success": True,
                "analysis": analysis
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"SEO 분석 실패: {str(e)}")
    
    def calculate_readability(self, content: str) -> float:
        """가독성 점수 계산 (간단한 버전)"""
        try:
            sentences = re.split(r'[.!?]+', content)
            sentences = [s.strip() for s in sentences if s.strip()]
            
            if not sentences:
                return 0
            
            total_words = len(content.split())
            total_sentences = len(sentences)
            
            if total_sentences == 0:
                return 0
            
            avg_sentence_length = total_words / total_sentences
            
            # 간단한 가독성 공식 (문장 길이 기반)
            if avg_sentence_length <= 15:
                return 90
            elif avg_sentence_length <= 20:
                return 80
            elif avg_sentence_length <= 25:
                return 70
            elif avg_sentence_length <= 30:
                return 60
            else:
                return 50
                
        except Exception:
            return 50
    
    def research_keywords(self, keyword: str, language: str = "ko") -> Dict:
        """키워드 리서치"""
        try:
            # 실제 키워드 리서치 API를 사용할 수 있지만, 
            # 여기서는 기본적인 관련 키워드 생성
            related_keywords = self.generate_related_keywords(keyword)
            
            keyword_data = []
            for related_keyword in related_keywords:
                # 모의 데이터 (실제로는 키워드 도구 API 사용)
                keyword_data.append({
                    "keyword": related_keyword,
                    "search_volume": self.estimate_search_volume(related_keyword),
                    "competition": self.estimate_competition(related_keyword),
                    "difficulty": self.estimate_difficulty(related_keyword),
                    "trend": "상승" if hash(related_keyword) % 3 == 0 else "안정"
                })
            
            return {
                "success": True,
                "main_keyword": keyword,
                "related_keywords": keyword_data,
                "suggestions": self.generate_keyword_suggestions(keyword)
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"키워드 리서치 실패: {str(e)}")
    
    def generate_related_keywords(self, keyword: str) -> List[str]:
        """관련 키워드 생성"""
        # 기본적인 관련 키워드 패턴
        prefixes = ["최고의", "효과적인", "완벽한", "전문", "고급"]
        suffixes = ["방법", "가이드", "팁", "전략", "노하우", "추천", "리뷰"]
        
        related = [keyword]
        
        # 접두사 조합
        for prefix in prefixes[:3]:
            related.append(f"{prefix} {keyword}")
        
        # 접미사 조합
        for suffix in suffixes[:3]:
            related.append(f"{keyword} {suffix}")
        
        # 롱테일 키워드
        long_tail = [
            f"{keyword} 초보자",
            f"{keyword} 전문가",
            f"{keyword} 2024",
            f"{keyword} 완전정복"
        ]
        
        related.extend(long_tail)
        
        return related[:10]  # 최대 10개 반환
    
    def estimate_search_volume(self, keyword: str) -> str:
        """검색량 추정 (모의 데이터)"""
        length = len(keyword)
        if length <= 5:
            return "높음 (10K+)"
        elif length <= 10:
            return "보통 (1K-10K)"
        else:
            return "낮음 (<1K)"
    
    def estimate_competition(self, keyword: str) -> str:
        """경쟁도 추정 (모의 데이터)"""
        hash_val = hash(keyword) % 3
        if hash_val == 0:
            return "높음"
        elif hash_val == 1:
            return "보통"
        else:
            return "낮음"
    
    def estimate_difficulty(self, keyword: str) -> int:
        """키워드 난이도 추정 (1-100)"""
        return (hash(keyword) % 80) + 20
    
    def generate_keyword_suggestions(self, keyword: str) -> List[str]:
        """키워드 제안 생성"""
        suggestions = [
            f"'{keyword}'를 제목에 포함하세요",
            f"'{keyword}' 관련 롱테일 키워드를 활용하세요",
            f"'{keyword}'의 동의어도 함께 사용하세요",
            "메타 설명에 키워드를 자연스럽게 포함하세요",
            "이미지 alt 텍스트에도 키워드를 활용하세요"
        ]
        return suggestions
    
    def analyze_url_seo(self, url: str, keyword: str) -> Dict:
        """URL SEO 분석"""
        try:
            # URL에서 콘텐츠 가져오기
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 기본 SEO 요소 추출
            title = soup.find('title')
            title_text = title.text if title else ""
            
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            meta_desc_text = meta_desc.get('content', '') if meta_desc else ""
            
            # 본문 텍스트 추출
            content = soup.get_text()
            
            # SEO 분석 수행
            content_analysis = self.analyze_content_seo(keyword, content)
            
            # URL 특화 분석 추가
            url_analysis = {
                "title": title_text,
                "meta_description": meta_desc_text,
                "title_has_keyword": keyword.lower() in title_text.lower(),
                "meta_has_keyword": keyword.lower() in meta_desc_text.lower(),
                "url_structure": self.analyze_url_structure(url),
                "content_analysis": content_analysis["analysis"]
            }
            
            return {
                "success": True,
                "url": url,
                "analysis": url_analysis
            }
            
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=400, detail=f"URL 접근 실패: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"URL SEO 분석 실패: {str(e)}")
    
    def analyze_url_structure(self, url: str) -> Dict:
        """URL 구조 분석"""
        return {
            "length": len(url),
            "has_https": url.startswith('https://'),
            "has_www": 'www.' in url,
            "path_depth": url.count('/') - 2,
            "has_special_chars": bool(re.search(r'[^a-zA-Z0-9\-._~:/?#[\]@!$&\'()*+,;=]', url))
        }
    
    def save_analysis_history(self, user_id: str, analysis_data: Dict):
        """분석 기록 저장"""
        try:
            history_file = os.path.join(self.data_dir, f"{user_id}_seo_history.json")
            
            history = []
            if os.path.exists(history_file):
                with open(history_file, "r", encoding="utf-8") as f:
                    history = json.load(f)
            
            # 새 분석 결과 추가
            analysis_data["timestamp"] = datetime.now().isoformat()
            history.append(analysis_data)
            
            # 최근 50개만 유지
            history = history[-50:]
            
            with open(history_file, "w", encoding="utf-8") as f:
                json.dump(history, f, ensure_ascii=False, indent=2)
                
        except Exception as e:
            print(f"SEO 분석 기록 저장 실패: {str(e)}")

# 전역 SEO 서비스 인스턴스
seo_service = SEOService()

