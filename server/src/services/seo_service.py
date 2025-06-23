import requests
import requests
import json
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin, urlparse
import time
import random

class SEOAnalyzer:
    """SEO 분석 및 키워드 크롤링을 위한 클래스"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    
    def get_seo_suggestions(self, keyword: str) -> List[str]:
        """SEO 제안사항 생성"""
        suggestions = [
            f"'{keyword}' 키워드를 제목에 포함하세요",
            "메타 디스크립션을 150-160자로 작성하세요",
            "H1, H2 태그에 키워드를 적절히 배치하세요",
            "이미지 alt 태그에 키워드를 포함하세요",
            "내부 링크를 활용하여 SEO를 강화하세요",
            "콘텐츠 길이를 최소 800단어 이상으로 작성하세요",
            "관련 키워드를 자연스럽게 포함하세요"
        ]
        return suggestions[:5]  # 상위 5개 제안사항 반환
    
    def get_related_keywords(self, keyword: str, count: int = 10) -> List[str]:
        """관련 키워드 생성"""
        base_keywords = [
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
            f"{keyword} 정보"
        ]
        return base_keywords[:count]
    
    def analyze_keyword_competition(self, keyword: str, location: str = "kr") -> Dict:
        """키워드 경쟁 강도 분석"""
        try:
            # Google 검색 결과 크롤링
            search_url = f"https://www.google.com/search?q={keyword}&gl={location}&hl=ko"
            response = requests.get(search_url, headers=self.headers)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 검색 결과 수 추출
            result_stats = soup.find('div', {'id': 'result-stats'})
            total_results = 0
            if result_stats:
                text = result_stats.get_text()
                numbers = re.findall(r'[\d,]+', text)
                if numbers:
                    total_results = int(numbers[0].replace(',', ''))
            
            # 경쟁 강도 계산 (간단한 알고리즘)
            if total_results > 10000000:
                competition_level = "높음"
                difficulty_score = 85
            elif total_results > 1000000:
                competition_level = "중간"
                difficulty_score = 60
            else:
                competition_level = "낮음"
                difficulty_score = 35
            
            return {
                "keyword": keyword,
                "total_results": total_results,
                "competition_level": competition_level,
                "difficulty_score": difficulty_score,
                "search_volume_estimate": self._estimate_search_volume(total_results)
            }
        except Exception as e:
            return {
                "keyword": keyword,
                "error": str(e),
                "competition_level": "알 수 없음",
                "difficulty_score": 50
            }
    
    def _estimate_search_volume(self, total_results: int) -> str:
        """검색 결과 수를 기반으로 검색량 추정"""
        if total_results > 50000000:
            return "매우 높음 (10,000+/월)"
        elif total_results > 10000000:
            return "높음 (1,000-10,000/월)"
        elif total_results > 1000000:
            return "중간 (100-1,000/월)"
        else:
            return "낮음 (10-100/월)"
    
    def get_related_keywords(self, keyword: str, count: int = 10) -> List[str]:
        """관련 키워드 추출"""
        try:
            search_url = f"https://www.google.com/search?q={keyword}&gl=kr&hl=ko"
            response = requests.get(search_url, headers=self.headers)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            related_keywords = []
            
            # "다른 사람들이 묻는 질문" 섹션에서 키워드 추출
            questions = soup.find_all('div', {'class': 'related-question-pair'})
            for question in questions[:count//2]:
                text = question.get_text().strip()
                if text and len(text) < 100:
                    related_keywords.append(text)
            
            # 검색 제안에서 키워드 추출
            suggestions = soup.find_all('div', {'class': 'BNeawe'})
            for suggestion in suggestions[:count//2]:
                text = suggestion.get_text().strip()
                if text and keyword.lower() in text.lower() and len(text) < 50:
                    related_keywords.append(text)
            
            return list(set(related_keywords))[:count]
        except Exception as e:
            return [f"{keyword} 관련", f"{keyword} 방법", f"{keyword} 추천"]
    
    def analyze_top_competitors(self, keyword: str, count: int = 5) -> List[Dict]:
        """상위 경쟁사 분석"""
        try:
            search_url = f"https://www.google.com/search?q={keyword}&gl=kr&hl=ko"
            response = requests.get(search_url, headers=self.headers)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            competitors = []
            search_results = soup.find_all('div', {'class': 'g'})
            
            for i, result in enumerate(search_results[:count]):
                try:
                    title_elem = result.find('h3')
                    link_elem = result.find('a')
                    snippet_elem = result.find('span', {'class': 'aCOpRe'})
                    
                    if title_elem and link_elem:
                        title = title_elem.get_text().strip()
                        url = link_elem.get('href', '')
                        snippet = snippet_elem.get_text().strip() if snippet_elem else ""
                        
                        # URL에서 도메인 추출
                        domain = urlparse(url).netloc if url.startswith('http') else "알 수 없음"
                        
                        competitors.append({
                            "rank": i + 1,
                            "title": title,
                            "url": url,
                            "domain": domain,
                            "snippet": snippet[:200] + "..." if len(snippet) > 200 else snippet
                        })
                except Exception:
                    continue
            
            return competitors
        except Exception as e:
            return []
    
    def analyze_content_seo(self, title: str, content: str, target_keyword: str) -> Dict:
        """콘텐츠 SEO 분석"""
        analysis = {
            "keyword_in_title": target_keyword.lower() in title.lower(),
            "keyword_density": self._calculate_keyword_density(content, target_keyword),
            "content_length": len(content),
            "title_length": len(title),
            "recommendations": []
        }
        
        # SEO 점수 계산
        score = 0
        
        # 제목에 키워드 포함 여부 (30점)
        if analysis["keyword_in_title"]:
            score += 30
        else:
            analysis["recommendations"].append("제목에 타겟 키워드를 포함하세요")
        
        # 키워드 밀도 (20점)
        if 1 <= analysis["keyword_density"] <= 3:
            score += 20
        elif analysis["keyword_density"] < 1:
            analysis["recommendations"].append("콘텐츠에 키워드를 더 자주 사용하세요")
        else:
            analysis["recommendations"].append("키워드 사용을 줄이세요 (키워드 스터핑 방지)")
        
        # 콘텐츠 길이 (25점)
        if analysis["content_length"] >= 1000:
            score += 25
        elif analysis["content_length"] >= 500:
            score += 15
        else:
            analysis["recommendations"].append("콘텐츠 길이를 늘리세요 (최소 500자 권장)")
        
        # 제목 길이 (15점)
        if 30 <= analysis["title_length"] <= 60:
            score += 15
        else:
            analysis["recommendations"].append("제목 길이를 30-60자로 조정하세요")
        
        # 기본 점수 (10점)
        score += 10
        
        analysis["seo_score"] = min(score, 100)
        analysis["grade"] = self._get_seo_grade(analysis["seo_score"])
        
        return analysis
    
    def _calculate_keyword_density(self, content: str, keyword: str) -> float:
        """키워드 밀도 계산"""
        if not content or not keyword:
            return 0
        
        words = content.lower().split()
        keyword_count = words.count(keyword.lower())
        total_words = len(words)
        
        if total_words == 0:
            return 0
        
        return round((keyword_count / total_words) * 100, 2)
    
    def _get_seo_grade(self, score: int) -> str:
        """SEO 점수를 등급으로 변환"""
        if score >= 90:
            return "A+"
        elif score >= 80:
            return "A"
        elif score >= 70:
            return "B"
        elif score >= 60:
            return "C"
        else:
            return "D"
    
    def generate_meta_tags(self, title: str, content: str, keyword: str) -> Dict:
        """메타 태그 생성"""
        # 메타 설명 생성 (콘텐츠 첫 부분에서 추출)
        sentences = content.split('.')[:3]
        meta_description = '. '.join(sentences).strip()
        if len(meta_description) > 160:
            meta_description = meta_description[:157] + "..."
        
        # 키워드 태그 생성
        keywords = [keyword]
        related = self.get_related_keywords(keyword, 5)
        keywords.extend(related[:4])
        
        return {
            "title": title,
            "meta_description": meta_description,
            "meta_keywords": ", ".join(keywords),
            "og_title": title,
            "og_description": meta_description,
            "og_type": "article"
        }
    
    def optimize_images_alt_text(self, content: str, keyword: str) -> str:
        """이미지 alt 태그 자동 최적화"""
        # 이미지 태그 찾기
        img_pattern = r'<img[^>]*>'
        images = re.findall(img_pattern, content, re.IGNORECASE)
        
        optimized_content = content
        
        for i, img_tag in enumerate(images):
            # alt 속성이 없거나 비어있는 경우
            if 'alt=' not in img_tag.lower() or 'alt=""' in img_tag or "alt=''" in img_tag:
                # 새로운 alt 텍스트 생성
                alt_text = f"{keyword} 관련 이미지 {i+1}"
                
                # alt 속성 추가 또는 수정
                if 'alt=' in img_tag.lower():
                    # 기존 alt 속성 교체
                    new_img_tag = re.sub(r'alt=["\'][^"\']*["\']', f'alt="{alt_text}"', img_tag, flags=re.IGNORECASE)
                else:
                    # alt 속성 추가
                    new_img_tag = img_tag.replace('>', f' alt="{alt_text}">')
                
                optimized_content = optimized_content.replace(img_tag, new_img_tag)
        
        return optimized_content

class KeywordResearcher:
    """키워드 리서치 전용 클래스"""
    
    def __init__(self):
        self.seo_analyzer = SEOAnalyzer()
    
    def research_keywords(self, seed_keyword: str, count: int = 20) -> Dict:
        """종합적인 키워드 리서치"""
        results = {
            "seed_keyword": seed_keyword,
            "main_analysis": self.seo_analyzer.analyze_keyword_competition(seed_keyword),
            "related_keywords": [],
            "long_tail_keywords": [],
            "competitor_analysis": self.seo_analyzer.analyze_top_competitors(seed_keyword)
        }
        
        # 관련 키워드 분석
        related = self.seo_analyzer.get_related_keywords(seed_keyword, count)
        for keyword in related:
            analysis = self.seo_analyzer.analyze_keyword_competition(keyword)
            results["related_keywords"].append(analysis)
            time.sleep(0.5)  # API 제한 방지
        
        # 롱테일 키워드 생성
        long_tail_variations = [
            f"{seed_keyword} 방법",
            f"{seed_keyword} 추천",
            f"{seed_keyword} 가이드",
            f"{seed_keyword} 팁",
            f"최고의 {seed_keyword}",
            f"{seed_keyword} 비교",
            f"{seed_keyword} 리뷰",
            f"{seed_keyword} 순위"
        ]
        
        for keyword in long_tail_variations[:count//3]:
            analysis = self.seo_analyzer.analyze_keyword_competition(keyword)
            results["long_tail_keywords"].append(analysis)
            time.sleep(0.5)
        
        return results

