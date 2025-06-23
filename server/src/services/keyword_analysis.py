import requests
import json
import re
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import statistics
from collections import Counter
import math

class AdvancedKeywordAnalyzer:
    """고급 키워드 분석 및 경쟁 강도 확인 클래스"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    
    def comprehensive_keyword_analysis(self, keyword: str) -> Dict:
        """종합적인 키워드 분석"""
        analysis = {
            "keyword": keyword,
            "timestamp": datetime.now().isoformat(),
            "basic_metrics": self._get_basic_metrics(keyword),
            "competition_analysis": self._analyze_competition_depth(keyword),
            "trend_analysis": self._analyze_keyword_trends(keyword),
            "difficulty_score": 0,
            "opportunity_score": 0,
            "recommendations": []
        }
        
        # 종합 점수 계산
        analysis["difficulty_score"] = self._calculate_difficulty_score(analysis)
        analysis["opportunity_score"] = self._calculate_opportunity_score(analysis)
        analysis["recommendations"] = self._generate_recommendations(analysis)
        
        return analysis
    
    def _get_basic_metrics(self, keyword: str) -> Dict:
        """기본 키워드 메트릭 수집"""
        try:
            search_url = f"https://www.google.com/search?q={keyword}&gl=kr&hl=ko"
            response = requests.get(search_url, headers=self.headers)
            
            # 검색 결과 수 추출
            result_count = self._extract_result_count(response.text)
            
            # 키워드 특성 분석
            keyword_length = len(keyword)
            word_count = len(keyword.split())
            is_long_tail = word_count >= 3
            
            # 상업적 의도 분석
            commercial_indicators = ['구매', '가격', '할인', '쇼핑', '리뷰', '추천', '비교', '최고', '베스트']
            commercial_score = sum(1 for indicator in commercial_indicators if indicator in keyword)
            
            return {
                "result_count": result_count,
                "keyword_length": keyword_length,
                "word_count": word_count,
                "is_long_tail": is_long_tail,
                "commercial_score": commercial_score,
                "estimated_cpc": self._estimate_cpc(keyword, commercial_score)
            }
        except Exception as e:
            return {
                "result_count": 0,
                "keyword_length": len(keyword),
                "word_count": len(keyword.split()),
                "is_long_tail": len(keyword.split()) >= 3,
                "commercial_score": 0,
                "estimated_cpc": 0,
                "error": str(e)
            }
    
    def _extract_result_count(self, html_content: str) -> int:
        """HTML에서 검색 결과 수 추출"""
        patterns = [
            r'약 ([\d,]+)개',
            r'About ([\d,]+) results',
            r'([\d,]+) results'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, html_content)
            if match:
                return int(match.group(1).replace(',', ''))
        
        return 0
    
    def _estimate_cpc(self, keyword: str, commercial_score: int) -> float:
        """CPC 추정 (상업적 점수 기반)"""
        base_cpc = 100  # 기본 CPC (원)
        
        # 상업적 의도가 높을수록 CPC 증가
        commercial_multiplier = 1 + (commercial_score * 0.5)
        
        # 키워드 길이에 따른 조정 (롱테일일수록 CPC 감소)
        length_multiplier = max(0.3, 1 - (len(keyword.split()) - 1) * 0.2)
        
        estimated_cpc = base_cpc * commercial_multiplier * length_multiplier
        return round(estimated_cpc, 2)
    
    def _analyze_competition_depth(self, keyword: str) -> Dict:
        """경쟁 강도 심화 분석"""
        try:
            search_url = f"https://www.google.com/search?q={keyword}&gl=kr&hl=ko"
            response = requests.get(search_url, headers=self.headers)
            
            # 광고 개수 분석
            ad_count = self._count_ads(response.text)
            
            # 도메인 권위도 분석
            top_domains = self._analyze_top_domains(response.text)
            
            # 콘텐츠 유형 분석
            content_types = self._analyze_content_types(response.text)
            
            return {
                "ad_count": ad_count,
                "top_domains": top_domains,
                "content_types": content_types,
                "competition_level": self._determine_competition_level(ad_count, top_domains)
            }
        except Exception as e:
            return {
                "ad_count": 0,
                "top_domains": [],
                "content_types": {},
                "competition_level": "중간",
                "error": str(e)
            }
    
    def _count_ads(self, html_content: str) -> int:
        """광고 개수 카운트"""
        ad_indicators = ['광고', 'Ad', 'Sponsored']
        ad_count = 0
        
        for indicator in ad_indicators:
            ad_count += html_content.count(indicator)
        
        return min(ad_count, 10)  # 최대 10개로 제한
    
    def _analyze_top_domains(self, html_content: str) -> List[Dict]:
        """상위 도메인 분석"""
        # 간단한 도메인 추출 (실제로는 더 정교한 파싱 필요)
        domain_patterns = [
            r'https?://([^/\s]+)',
            r'www\.([^/\s]+)'
        ]
        
        domains = []
        for pattern in domain_patterns:
            matches = re.findall(pattern, html_content)
            domains.extend(matches[:5])
        
        # 도메인 권위도 추정
        authority_scores = {
            'naver.com': 95,
            'google.com': 100,
            'youtube.com': 90,
            'wikipedia.org': 85,
            'tistory.com': 70,
            'blog.naver.com': 75
        }
        
        analyzed_domains = []
        for domain in domains[:5]:
            domain_clean = domain.replace('www.', '').lower()
            authority = authority_scores.get(domain_clean, 50)
            analyzed_domains.append({
                "domain": domain_clean,
                "authority_score": authority
            })
        
        return analyzed_domains
    
    def _analyze_content_types(self, html_content: str) -> Dict:
        """콘텐츠 유형 분석"""
        content_indicators = {
            "blog": ["블로그", "blog", "포스트"],
            "news": ["뉴스", "news", "기사"],
            "ecommerce": ["쇼핑", "구매", "가격", "할인"],
            "video": ["동영상", "video", "유튜브"],
            "wiki": ["위키", "wiki", "백과사전"]
        }
        
        content_types = {}
        for content_type, indicators in content_indicators.items():
            count = sum(html_content.lower().count(indicator) for indicator in indicators)
            content_types[content_type] = count
        
        return content_types
    
    def _determine_competition_level(self, ad_count: int, top_domains: List[Dict]) -> str:
        """경쟁 수준 결정"""
        # 광고 개수 기반 점수
        ad_score = min(ad_count * 10, 50)
        
        # 도메인 권위도 기반 점수
        if top_domains:
            avg_authority = statistics.mean([domain["authority_score"] for domain in top_domains])
            authority_score = avg_authority
        else:
            authority_score = 50
        
        total_score = (ad_score + authority_score) / 2
        
        if total_score >= 80:
            return "매우 높음"
        elif total_score >= 60:
            return "높음"
        elif total_score >= 40:
            return "중간"
        else:
            return "낮음"
    
    def _analyze_keyword_trends(self, keyword: str) -> Dict:
        """키워드 트렌드 분석 (시뮬레이션)"""
        # 실제로는 Google Trends API나 다른 트렌드 데이터를 사용
        # 여기서는 키워드 특성을 기반으로 트렌드 시뮬레이션
        
        seasonal_keywords = ['크리스마스', '여름', '겨울', '봄', '가을', '휴가', '선물']
        is_seasonal = any(seasonal in keyword for seasonal in seasonal_keywords)
        
        # 트렌드 방향 추정
        growth_indicators = ['신상', '최신', '2025', '트렌드', 'AI', '디지털']
        decline_indicators = ['구형', '옛날', '전통', '클래식']
        
        growth_score = sum(1 for indicator in growth_indicators if indicator in keyword)
        decline_score = sum(1 for indicator in decline_indicators if indicator in keyword)
        
        if growth_score > decline_score:
            trend_direction = "상승"
            trend_score = 70 + (growth_score * 10)
        elif decline_score > growth_score:
            trend_direction = "하락"
            trend_score = 30 - (decline_score * 10)
        else:
            trend_direction = "안정"
            trend_score = 50
        
        return {
            "is_seasonal": is_seasonal,
            "trend_direction": trend_direction,
            "trend_score": max(0, min(100, trend_score)),
            "volatility": "높음" if is_seasonal else "낮음"
        }
    
    def _calculate_difficulty_score(self, analysis: Dict) -> int:
        """키워드 난이도 점수 계산"""
        basic = analysis["basic_metrics"]
        competition = analysis["competition_analysis"]
        
        # 검색 결과 수 기반 점수 (0-40점)
        result_score = min(40, (basic["result_count"] / 1000000) * 10)
        
        # 광고 개수 기반 점수 (0-30점)
        ad_score = min(30, competition["ad_count"] * 3)
        
        # 도메인 권위도 기반 점수 (0-30점)
        if competition["top_domains"]:
            avg_authority = statistics.mean([d["authority_score"] for d in competition["top_domains"]])
            authority_score = (avg_authority / 100) * 30
        else:
            authority_score = 15
        
        total_score = result_score + ad_score + authority_score
        return min(100, int(total_score))
    
    def _calculate_opportunity_score(self, analysis: Dict) -> int:
        """기회 점수 계산 (난이도의 역수 + 트렌드 보정)"""
        difficulty = analysis["difficulty_score"]
        trend = analysis["trend_analysis"]
        basic = analysis["basic_metrics"]
        
        # 기본 기회 점수 (난이도의 역수)
        base_opportunity = 100 - difficulty
        
        # 트렌드 보정
        trend_bonus = 0
        if trend["trend_direction"] == "상승":
            trend_bonus = 20
        elif trend["trend_direction"] == "하락":
            trend_bonus = -20
        
        # 롱테일 키워드 보너스
        longtail_bonus = 15 if basic["is_long_tail"] else 0
        
        # 상업적 의도 보정
        commercial_bonus = basic["commercial_score"] * 5
        
        total_opportunity = base_opportunity + trend_bonus + longtail_bonus + commercial_bonus
        return max(0, min(100, int(total_opportunity)))
    
    def _generate_recommendations(self, analysis: Dict) -> List[str]:
        """분석 결과 기반 추천사항 생성"""
        recommendations = []
        
        difficulty = analysis["difficulty_score"]
        opportunity = analysis["opportunity_score"]
        basic = analysis["basic_metrics"]
        competition = analysis["competition_analysis"]
        trend = analysis["trend_analysis"]
        
        # 난이도 기반 추천
        if difficulty > 80:
            recommendations.append("매우 경쟁이 치열한 키워드입니다. 롱테일 키워드를 고려해보세요.")
        elif difficulty < 30:
            recommendations.append("경쟁이 낮은 키워드입니다. 빠른 랭킹 상승이 가능할 것 같습니다.")
        
        # 기회 점수 기반 추천
        if opportunity > 70:
            recommendations.append("높은 기회 점수를 가진 키워드입니다. 적극적으로 타겟팅하세요.")
        elif opportunity < 30:
            recommendations.append("기회 점수가 낮습니다. 다른 키워드를 고려해보세요.")
        
        # 트렌드 기반 추천
        if trend["trend_direction"] == "상승":
            recommendations.append("상승 트렌드의 키워드입니다. 지금이 진입 적기입니다.")
        elif trend["trend_direction"] == "하락":
            recommendations.append("하락 트렌드의 키워드입니다. 신중한 접근이 필요합니다.")
        
        # 롱테일 키워드 추천
        if not basic["is_long_tail"]:
            recommendations.append("더 구체적인 롱테일 키워드를 고려해보세요.")
        
        # 광고 경쟁 기반 추천
        if competition["ad_count"] > 5:
            recommendations.append("광고 경쟁이 치열합니다. 유기적 검색 최적화에 집중하세요.")
        
        return recommendations

class KeywordClusterAnalyzer:
    """키워드 클러스터링 및 그룹 분석"""
    
    def __init__(self):
        self.analyzer = AdvancedKeywordAnalyzer()
    
    def cluster_keywords(self, keywords: List[str]) -> Dict:
        """키워드 클러스터링"""
        clusters = {
            "high_opportunity": [],
            "medium_opportunity": [],
            "low_opportunity": [],
            "high_difficulty": [],
            "medium_difficulty": [],
            "low_difficulty": [],
            "trending_up": [],
            "trending_down": [],
            "commercial": [],
            "informational": []
        }
        
        for keyword in keywords:
            analysis = self.analyzer.comprehensive_keyword_analysis(keyword)
            
            # 기회 점수별 분류
            opportunity = analysis["opportunity_score"]
            if opportunity >= 70:
                clusters["high_opportunity"].append(keyword)
            elif opportunity >= 40:
                clusters["medium_opportunity"].append(keyword)
            else:
                clusters["low_opportunity"].append(keyword)
            
            # 난이도별 분류
            difficulty = analysis["difficulty_score"]
            if difficulty >= 70:
                clusters["high_difficulty"].append(keyword)
            elif difficulty >= 40:
                clusters["medium_difficulty"].append(keyword)
            else:
                clusters["low_difficulty"].append(keyword)
            
            # 트렌드별 분류
            trend_direction = analysis["trend_analysis"]["trend_direction"]
            if trend_direction == "상승":
                clusters["trending_up"].append(keyword)
            elif trend_direction == "하락":
                clusters["trending_down"].append(keyword)
            
            # 의도별 분류
            commercial_score = analysis["basic_metrics"]["commercial_score"]
            if commercial_score >= 2:
                clusters["commercial"].append(keyword)
            else:
                clusters["informational"].append(keyword)
        
        return {
            "clusters": clusters,
            "summary": self._generate_cluster_summary(clusters),
            "recommendations": self._generate_cluster_recommendations(clusters)
        }
    
    def _generate_cluster_summary(self, clusters: Dict) -> Dict:
        """클러스터 요약 생성"""
        total_keywords = sum(len(cluster) for cluster in clusters.values())
        
        return {
            "total_keywords": total_keywords,
            "high_opportunity_count": len(clusters["high_opportunity"]),
            "low_difficulty_count": len(clusters["low_difficulty"]),
            "trending_up_count": len(clusters["trending_up"]),
            "commercial_count": len(clusters["commercial"]),
            "best_targets": clusters["high_opportunity"][:5]
        }
    
    def _generate_cluster_recommendations(self, clusters: Dict) -> List[str]:
        """클러스터 기반 추천사항"""
        recommendations = []
        
        if clusters["high_opportunity"]:
            recommendations.append(f"높은 기회 키워드 {len(clusters['high_opportunity'])}개를 우선 타겟팅하세요.")
        
        if clusters["low_difficulty"]:
            recommendations.append(f"낮은 난이도 키워드 {len(clusters['low_difficulty'])}개로 빠른 성과를 노려보세요.")
        
        if clusters["trending_up"]:
            recommendations.append(f"상승 트렌드 키워드 {len(clusters['trending_up'])}개에 집중 투자하세요.")
        
        if len(clusters["commercial"]) > len(clusters["informational"]):
            recommendations.append("상업적 키워드가 많습니다. 전환 최적화에 집중하세요.")
        else:
            recommendations.append("정보성 키워드가 많습니다. 브랜드 인지도 향상에 집중하세요.")
        
        return recommendations

