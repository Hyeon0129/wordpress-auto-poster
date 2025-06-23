from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from openai import OpenAI
import requests
import json
import re
from datetime import datetime

content_bp = Blueprint('content', __name__)

class LLMManager:
    """LLM 관리 클래스"""
    
    def __init__(self, provider='ollama', api_key=None, base_url=None, model_name=None):
        self.provider = provider
        self.api_key = api_key or "ollama"
        self.base_url = base_url or "http://localhost:11434/v1"
        self.model_name = model_name or "qwen2.5:32b"
        
        if provider == 'openai':
            self.client = OpenAI(api_key=api_key)
            self.model_name = model_name or "gpt-3.5-turbo"
        else:  # ollama
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url
            )
    
    def generate_content(self, keyword, context="", content_type="blog_post"):
        """콘텐츠 생성"""
        try:
            if content_type == "blog_post":
                prompt = self._create_blog_post_prompt(keyword, context)
            elif content_type == "product_review":
                prompt = self._create_product_review_prompt(keyword, context)
            elif content_type == "how_to":
                prompt = self._create_how_to_prompt(keyword, context)
            else:
                prompt = self._create_blog_post_prompt(keyword, context)
            
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "당신은 전문적인 블로그 콘텐츠 작성자입니다. 한국어로 자연스럽고 유익한 블로그 글을 작성해주세요."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=3000,
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            
            # 마크다운 형식으로 정리
            formatted_content = self._format_content(content)
            
            return True, formatted_content
            
        except Exception as e:
            return False, f"콘텐츠 생성 중 오류: {str(e)}"
    
    def _create_blog_post_prompt(self, keyword, context):
        """블로그 포스트 프롬프트 생성"""
        return f"""
다음 키워드에 대한 고품질 블로그 게시물을 작성해주세요: "{keyword}"

참고 정보:
{context}

요구사항:
1. 2000자 이상의 상세한 내용
2. 독자에게 실질적인 도움이 되는 정보 제공
3. 자연스러운 한국어 문체
4. 논리적인 구조 (서론, 본론, 결론)
5. SEO를 고려한 키워드 자연스러운 배치
6. 마크다운 형식으로 작성 (제목은 #, ## 사용)

블로그 게시물:
"""
    
    def _create_product_review_prompt(self, keyword, context):
        """제품 리뷰 프롬프트 생성"""
        return f"""
다음 제품에 대한 상세한 리뷰 글을 작성해주세요: "{keyword}"

참고 정보:
{context}

요구사항:
1. 제품의 장점과 단점을 균형있게 서술
2. 실제 사용 경험을 바탕으로 한 구체적인 내용
3. 구매를 고려하는 독자에게 도움이 되는 정보
4. 마크다운 형식으로 작성
5. 평점 및 추천 여부 포함

제품 리뷰:
"""
    
    def _create_how_to_prompt(self, keyword, context):
        """How-to 가이드 프롬프트 생성"""
        return f"""
다음 주제에 대한 단계별 가이드를 작성해주세요: "{keyword}"

참고 정보:
{context}

요구사항:
1. 초보자도 따라할 수 있는 명확한 단계별 설명
2. 각 단계마다 구체적인 방법과 팁 제공
3. 주의사항 및 문제 해결 방법 포함
4. 마크다운 형식으로 작성
5. 필요한 도구나 준비물 명시

가이드:
"""
    
    def _format_content(self, content):
        """콘텐츠 포맷팅"""
        # 기본적인 마크다운 정리
        lines = content.split('\n')
        formatted_lines = []
        
        for line in lines:
            line = line.strip()
            if line:
                formatted_lines.append(line)
            elif formatted_lines and formatted_lines[-1] != '':
                formatted_lines.append('')
        
        return '\n'.join(formatted_lines)
    
    def analyze_keyword(self, keyword):
        """키워드 분석"""
        try:
            prompt = f"""
다음 키워드를 분석하고 블로그 콘텐츠 작성에 도움이 되는 정보를 제공해주세요: "{keyword}"

분석 항목:
1. 키워드의 의미와 중요성
2. 관련 키워드 8개 (검색량이 높을 것으로 예상되는)
3. 타겟 독자층
4. 콘텐츠 제안 5개
5. SEO 관점에서의 키워드 활용 팁

JSON 형식으로 응답해주세요:
{{
    "keyword": "{keyword}",
    "meaning": "키워드의 의미와 중요성",
    "related_keywords": ["관련키워드1", "관련키워드2", ...],
    "target_audience": ["타겟독자1", "타겟독자2", ...],
    "content_suggestions": ["콘텐츠제안1", "콘텐츠제안2", ...],
    "seo_tips": ["SEO팁1", "SEO팁2", ...]
}}
"""
            
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "당신은 SEO 전문가이자 키워드 분석 전문가입니다. 정확하고 유용한 키워드 분석을 제공해주세요."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500,
                temperature=0.5
            )
            
            try:
                analysis_data = json.loads(response.choices[0].message.content)
                return True, analysis_data
            except json.JSONDecodeError:
                # JSON 파싱 실패 시 기본 분석 반환
                return True, self._generate_fallback_analysis(keyword)
            
        except Exception as e:
            return False, f"키워드 분석 중 오류: {str(e)}"
    
    def _generate_fallback_analysis(self, keyword):
        """기본 키워드 분석 반환"""
        return {
            "keyword": keyword,
            "meaning": f"{keyword}에 대한 기본 분석입니다.",
            "related_keywords": [
                f"{keyword} 방법",
                f"{keyword} 가이드",
                f"{keyword} 팁",
                f"{keyword} 활용",
                f"{keyword} 장점",
                f"{keyword} 단점",
                f"{keyword} 비교",
                f"{keyword} 추천"
            ],
            "target_audience": [
                f"{keyword}에 관심 있는 초보자",
                f"{keyword} 전문가",
                f"{keyword} 관련 업계 종사자"
            ],
            "content_suggestions": [
                f"{keyword} 초보자 가이드",
                f"{keyword} 고급 활용법",
                f"{keyword} 사례 연구",
                f"{keyword} 최신 트렌드",
                f"{keyword} 비교 분석"
            ],
            "seo_tips": [
                f"제목에 '{keyword}' 키워드 포함",
                "메타 디스크립션에 키워드 자연스럽게 배치",
                "헤딩 태그(H1, H2, H3)에 관련 키워드 사용",
                "본문에 키워드 밀도 2-3% 유지"
            ]
        }

def get_user_llm_settings(user_id):
    """사용자 LLM 설정 조회"""
    # 실제로는 데이터베이스에서 조회
    # 현재는 기본값 반환
    return {
        'provider': 'ollama',
        'api_key': 'ollama',
        'base_url': 'http://localhost:11434/v1',
        'model_name': 'qwen2.5:32b'
    }

@content_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_content():
    """콘텐츠 생성"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        keyword = data.get('keyword', '').strip()
        content_type = data.get('content_type', 'blog_post')
        context = data.get('context', '')
        
        if not keyword:
            return jsonify({'error': '키워드를 입력해주세요.'}), 400
        
        # 사용자 LLM 설정 조회
        llm_settings = get_user_llm_settings(current_user_id)
        
        # LLM 매니저 초기화
        llm_manager = LLMManager(
            provider=llm_settings['provider'],
            api_key=llm_settings['api_key'],
            base_url=llm_settings['base_url'],
            model_name=llm_settings['model_name']
        )
        
        # 콘텐츠 생성
        success, result = llm_manager.generate_content(keyword, context, content_type)
        
        if success:
            return jsonify({
                'keyword': keyword,
                'content_type': content_type,
                'content': result,
                'generated_at': datetime.now().isoformat(),
                'word_count': len(result.split()),
                'character_count': len(result)
            }), 200
        else:
            return jsonify({'error': result}), 500
            
    except Exception as e:
        return jsonify({'error': f'콘텐츠 생성 중 오류: {str(e)}'}), 500

@content_bp.route('/analyze-keyword', methods=['POST'])
@jwt_required()
def analyze_keyword():
    """키워드 분석"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        keyword = data.get('keyword', '').strip()
        
        if not keyword:
            return jsonify({'error': '키워드를 입력해주세요.'}), 400
        
        # 사용자 LLM 설정 조회
        llm_settings = get_user_llm_settings(current_user_id)
        
        # LLM 매니저 초기화
        llm_manager = LLMManager(
            provider=llm_settings['provider'],
            api_key=llm_settings['api_key'],
            base_url=llm_settings['base_url'],
            model_name=llm_settings['model_name']
        )
        
        # 키워드 분석
        success, result = llm_manager.analyze_keyword(keyword)
        
        if success:
            return jsonify(result), 200
        else:
            return jsonify({'error': result}), 500
            
    except Exception as e:
        return jsonify({'error': f'키워드 분석 중 오류: {str(e)}'}), 500

@content_bp.route('/preview', methods=['POST'])
@jwt_required()
def preview_content():
    """콘텐츠 미리보기 (마크다운을 HTML로 변환)"""
    try:
        data = request.get_json()
        markdown_content = data.get('content', '')
        
        if not markdown_content:
            return jsonify({'error': '미리보기할 콘텐츠가 없습니다.'}), 400
        
        # 간단한 마크다운 to HTML 변환
        # 실제로는 markdown 라이브러리 사용 권장
        html_content = convert_markdown_to_html(markdown_content)
        
        return jsonify({
            'html_content': html_content,
            'word_count': len(markdown_content.split()),
            'character_count': len(markdown_content)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'미리보기 생성 중 오류: {str(e)}'}), 500

def convert_markdown_to_html(markdown_text):
    """간단한 마크다운 to HTML 변환"""
    html = markdown_text
    
    # 헤딩 변환
    html = re.sub(r'^### (.*$)', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*$)', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^# (.*$)', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    
    # 볼드 변환
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    
    # 이탤릭 변환
    html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)
    
    # 링크 변환
    html = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', html)
    
    # 줄바꿈 변환
    html = html.replace('\n\n', '</p><p>')
    html = html.replace('\n', '<br>')
    
    # 문단 태그 추가
    if html and not html.startswith('<'):
        html = '<p>' + html + '</p>'
    
    return html

@content_bp.route('/templates', methods=['GET'])
@jwt_required()
def get_content_templates():
    """콘텐츠 템플릿 목록 조회"""
    try:
        current_user_id = get_jwt_identity()
        
        # 실제로는 데이터베이스에서 조회
        templates = [
            {
                'id': 1,
                'name': '기본 블로그 포스트',
                'type': 'blog_post',
                'description': '일반적인 블로그 글 형식',
                'is_default': True
            },
            {
                'id': 2,
                'name': '제품 리뷰',
                'type': 'product_review',
                'description': '제품 리뷰 전용 템플릿',
                'is_default': False
            },
            {
                'id': 3,
                'name': 'How-to 가이드',
                'type': 'how_to',
                'description': '단계별 가이드 템플릿',
                'is_default': False
            }
        ]
        
        return jsonify({'templates': templates}), 200
        
    except Exception as e:
        return jsonify({'error': f'템플릿 조회 중 오류: {str(e)}'}), 500

