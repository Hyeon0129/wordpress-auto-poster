from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import re
from datetime import datetime

seo_bp = Blueprint('seo', __name__)

class SEOAnalyzer:
    """SEO 분석 클래스"""
    
    def __init__(self):
        self.stop_words = [
            '그리고', '하지만', '그러나', '또한', '따라서', '그래서', '그런데',
            '이것', '그것', '저것', '이런', '그런', '저런', '이렇게', '그렇게',
            '있다', '없다', '되다', '하다', '이다', '아니다', '같다', '다르다'
        ]
    
    def analyze_content(self, title, content, meta_description, target_keyword):
        """콘텐츠 SEO 분석"""
        try:
            analysis = {
                'keyword_analysis': self._analyze_keyword_density(content, target_keyword),
                'title_analysis': self._analyze_title(title, target_keyword),
                'meta_analysis': self._analyze_meta_description(meta_description, target_keyword),
                'content_analysis': self._analyze_content_structure(content),
                'readability': self._analyze_readability(content),
                'suggestions': [],
                'score': 0
            }
            
            # 제안사항 생성
            analysis['suggestions'] = self._generate_suggestions(analysis, target_keyword)
            
            # 전체 점수 계산
            analysis['score'] = self._calculate_seo_score(analysis)
            
            return analysis
            
        except Exception as e:
            return {'error': f'SEO 분석 중 오류: {str(e)}'}
    
    def _analyze_keyword_density(self, content, keyword):
        """키워드 밀도 분석"""
        if not content or not keyword:
            return {'density': 0, 'count': 0, 'total_words': 0}
        
        # 텍스트 정리
        clean_content = re.sub(r'[^\w\s가-힣]', ' ', content.lower())
        words = clean_content.split()
        total_words = len(words)
        
        # 키워드 카운트
        keyword_lower = keyword.lower()
        keyword_count = clean_content.count(keyword_lower)
        
        # 밀도 계산
        density = (keyword_count / total_words * 100) if total_words > 0 else 0
        
        return {
            'density': round(density, 2),
            'count': keyword_count,
            'total_words': total_words,
            'optimal_range': [2, 3],
            'status': self._get_density_status(density)
        }
    
    def _get_density_status(self, density):
        """키워드 밀도 상태 판정"""
        if density < 1:
            return 'too_low'
        elif density <= 3:
            return 'optimal'
        elif density <= 5:
            return 'high'
        else:
            return 'too_high'
    
    def _analyze_title(self, title, keyword):
        """제목 분석"""
        if not title:
            return {'length': 0, 'has_keyword': False, 'status': 'missing'}
        
        title_length = len(title)
        has_keyword = keyword.lower() in title.lower() if keyword else False
        
        # 제목 길이 상태
        if title_length < 30:
            length_status = 'too_short'
        elif title_length <= 60:
            length_status = 'optimal'
        else:
            length_status = 'too_long'
        
        return {
            'length': title_length,
            'has_keyword': has_keyword,
            'optimal_range': [30, 60],
            'length_status': length_status,
            'keyword_status': 'good' if has_keyword else 'missing'
        }
    
    def _analyze_meta_description(self, meta_description, keyword):
        """메타 디스크립션 분석"""
        if not meta_description:
            return {'length': 0, 'has_keyword': False, 'status': 'missing'}
        
        desc_length = len(meta_description)
        has_keyword = keyword.lower() in meta_description.lower() if keyword else False
        
        # 길이 상태
        if desc_length < 120:
            length_status = 'too_short'
        elif desc_length <= 160:
            length_status = 'optimal'
        else:
            length_status = 'too_long'
        
        return {
            'length': desc_length,
            'has_keyword': has_keyword,
            'optimal_range': [120, 160],
            'length_status': length_status,
            'keyword_status': 'good' if has_keyword else 'missing'
        }
    
    def _analyze_content_structure(self, content):
        """콘텐츠 구조 분석"""
        if not content:
            return {'headings': [], 'paragraphs': 0, 'word_count': 0}
        
        # 헤딩 추출
        headings = {
            'h1': len(re.findall(r'^# (.+)$', content, re.MULTILINE)),
            'h2': len(re.findall(r'^## (.+)$', content, re.MULTILINE)),
            'h3': len(re.findall(r'^### (.+)$', content, re.MULTILINE))
        }
        
        # 문단 수 계산
        paragraphs = len([p for p in content.split('\n\n') if p.strip()])
        
        # 단어 수 계산
        word_count = len(content.split())
        
        return {
            'headings': headings,
            'paragraphs': paragraphs,
            'word_count': word_count,
            'has_structure': sum(headings.values()) > 0
        }
    
    def _analyze_readability(self, content):
        """가독성 분석"""
        if not content:
            return {'score': 0, 'level': 'unknown'}
        
        # 간단한 가독성 점수 계산
        sentences = len(re.findall(r'[.!?]+', content))
        words = len(content.split())
        
        if sentences == 0:
            return {'score': 0, 'level': 'unknown'}
        
        avg_words_per_sentence = words / sentences
        
        # 가독성 레벨 판정
        if avg_words_per_sentence <= 15:
            level = 'easy'
            score = 80
        elif avg_words_per_sentence <= 20:
            level = 'medium'
            score = 60
        else:
            level = 'hard'
            score = 40
        
        return {
            'score': score,
            'level': level,
            'avg_words_per_sentence': round(avg_words_per_sentence, 1),
            'total_sentences': sentences
        }
    
    def _generate_suggestions(self, analysis, keyword):
        """SEO 개선 제안 생성"""
        suggestions = []
        
        # 키워드 밀도 제안
        keyword_analysis = analysis['keyword_analysis']
        if keyword_analysis['status'] == 'too_low':
            suggestions.append({
                'type': 'keyword_density',
                'priority': 'high',
                'message': f"키워드 '{keyword}' 밀도가 {keyword_analysis['density']}%로 낮습니다. 2-3% 정도로 늘려보세요."
            })
        elif keyword_analysis['status'] == 'too_high':
            suggestions.append({
                'type': 'keyword_density',
                'priority': 'high',
                'message': f"키워드 '{keyword}' 밀도가 {keyword_analysis['density']}%로 높습니다. 자연스럽게 줄여보세요."
            })
        
        # 제목 제안
        title_analysis = analysis['title_analysis']
        if title_analysis['length_status'] == 'too_short':
            suggestions.append({
                'type': 'title',
                'priority': 'medium',
                'message': f"제목이 {title_analysis['length']}자로 짧습니다. 30-60자 정도로 늘려보세요."
            })
        elif title_analysis['length_status'] == 'too_long':
            suggestions.append({
                'type': 'title',
                'priority': 'medium',
                'message': f"제목이 {title_analysis['length']}자로 깁니다. 60자 이내로 줄여보세요."
            })
        
        if not title_analysis['has_keyword']:
            suggestions.append({
                'type': 'title',
                'priority': 'high',
                'message': f"제목에 키워드 '{keyword}'를 포함해보세요."
            })
        
        # 메타 디스크립션 제안
        meta_analysis = analysis['meta_analysis']
        if meta_analysis['length_status'] == 'missing':
            suggestions.append({
                'type': 'meta_description',
                'priority': 'high',
                'message': "메타 디스크립션을 작성해주세요."
            })
        elif meta_analysis['length_status'] == 'too_short':
            suggestions.append({
                'type': 'meta_description',
                'priority': 'medium',
                'message': f"메타 디스크립션이 {meta_analysis['length']}자로 짧습니다. 120-160자 정도로 늘려보세요."
            })
        
        # 콘텐츠 구조 제안
        content_analysis = analysis['content_analysis']
        if not content_analysis['has_structure']:
            suggestions.append({
                'type': 'structure',
                'priority': 'medium',
                'message': "헤딩 태그(#, ##, ###)를 사용하여 콘텐츠를 구조화해보세요."
            })
        
        if content_analysis['word_count'] < 300:
            suggestions.append({
                'type': 'content_length',
                'priority': 'high',
                'message': f"콘텐츠가 {content_analysis['word_count']}단어로 짧습니다. 최소 300단어 이상 작성해보세요."
            })
        
        return suggestions
    
    def _calculate_seo_score(self, analysis):
        """전체 SEO 점수 계산"""
        score = 0
        max_score = 100
        
        # 키워드 밀도 점수 (30점)
        keyword_status = analysis['keyword_analysis']['status']
        if keyword_status == 'optimal':
            score += 30
        elif keyword_status in ['high', 'too_low']:
            score += 15
        
        # 제목 점수 (25점)
        title_analysis = analysis['title_analysis']
        if title_analysis['has_keyword']:
            score += 15
        if title_analysis['length_status'] == 'optimal':
            score += 10
        
        # 메타 디스크립션 점수 (20점)
        meta_analysis = analysis['meta_analysis']
        if meta_analysis['has_keyword']:
            score += 10
        if meta_analysis['length_status'] == 'optimal':
            score += 10
        
        # 콘텐츠 구조 점수 (15점)
        if analysis['content_analysis']['has_structure']:
            score += 15
        
        # 가독성 점수 (10점)
        readability_score = analysis['readability']['score']
        score += (readability_score / 100) * 10
        
        return min(round(score), max_score)

@seo_bp.route('/analyze', methods=['POST'])
@jwt_required()
def analyze_seo():
    """SEO 분석"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        title = data.get('title', '').strip()
        content = data.get('content', '').strip()
        meta_description = data.get('meta_description', '').strip()
        target_keyword = data.get('target_keyword', '').strip()
        
        if not content:
            return jsonify({'error': '분석할 콘텐츠를 입력해주세요.'}), 400
        
        # SEO 분석 수행
        analyzer = SEOAnalyzer()
        analysis_result = analyzer.analyze_content(title, content, meta_description, target_keyword)
        
        if 'error' in analysis_result:
            return jsonify(analysis_result), 500
        
        return jsonify({
            'analysis': analysis_result,
            'analyzed_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'SEO 분석 중 오류: {str(e)}'}), 500

@seo_bp.route('/suggestions', methods=['POST'])
@jwt_required()
def get_seo_suggestions():
    """SEO 개선 제안"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        keyword = data.get('keyword', '').strip()
        content_type = data.get('content_type', 'blog_post')
        
        if not keyword:
            return jsonify({'error': '키워드를 입력해주세요.'}), 400
        
        # 콘텐츠 타입별 SEO 제안
        suggestions = generate_seo_suggestions_by_type(keyword, content_type)
        
        return jsonify({
            'keyword': keyword,
            'content_type': content_type,
            'suggestions': suggestions
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'SEO 제안 생성 중 오류: {str(e)}'}), 500

@seo_bp.route('/keywords/related', methods=['POST'])
@jwt_required()
def get_related_keywords():
    """관련 키워드 조회"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        keyword = data.get('keyword', '').strip()
        
        if not keyword:
            return jsonify({'error': '키워드를 입력해주세요.'}), 400
        
        # 관련 키워드 생성
        related_keywords = generate_related_keywords(keyword)
        
        return jsonify({
            'keyword': keyword,
            'related_keywords': related_keywords
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'관련 키워드 조회 중 오류: {str(e)}'}), 500

def generate_seo_suggestions_by_type(keyword, content_type):
    """콘텐츠 타입별 SEO 제안 생성"""
    base_suggestions = [
        {
            'category': 'title',
            'suggestions': [
                f"{keyword} 완벽 가이드 - 2024년 최신 정보",
                f"{keyword}란? 초보자를 위한 쉬운 설명",
                f"{keyword} 활용법 총정리"
            ]
        },
        {
            'category': 'meta_description',
            'suggestions': [
                f"{keyword}에 대한 완벽한 가이드입니다. {keyword}의 정의, 특징, 활용법을 상세히 설명하고 실무에서 바로 적용할 수 있는 방법을 제시합니다.",
                f"{keyword} 관련 모든 정보를 한 곳에서 확인하세요. 전문가가 정리한 {keyword} 가이드로 빠르게 학습하고 실무에 적용해보세요."
            ]
        }
    ]
    
    if content_type == 'product_review':
        base_suggestions[0]['suggestions'].extend([
            f"{keyword} 리뷰 - 장단점 솔직 후기",
            f"{keyword} 구매 전 꼭 읽어야 할 리뷰",
            f"{keyword} 실사용 후기와 평점"
        ])
    elif content_type == 'how_to':
        base_suggestions[0]['suggestions'].extend([
            f"{keyword} 하는 방법 - 단계별 가이드",
            f"{keyword} 초보자도 쉽게 따라하는 방법",
            f"{keyword} 완벽 마스터 가이드"
        ])
    
    return base_suggestions

def generate_related_keywords(keyword):
    """관련 키워드 생성"""
    suffixes = [
        "방법", "가이드", "팁", "활용", "장점", "단점", 
        "비교", "추천", "후기", "리뷰", "사용법", "설명"
    ]
    
    prefixes = [
        "최고의", "최신", "인기", "추천", "베스트", "완벽한"
    ]
    
    related = []
    
    # 접미사 조합
    for suffix in suffixes:
        related.append(f"{keyword} {suffix}")
    
    # 접두사 조합
    for prefix in prefixes:
        related.append(f"{prefix} {keyword}")
    
    # 연도 조합
    current_year = datetime.now().year
    related.extend([
        f"{keyword} {current_year}",
        f"{current_year}년 {keyword}",
        f"{keyword} 최신 트렌드"
    ])
    
    return related[:20]  # 상위 20개만 반환

