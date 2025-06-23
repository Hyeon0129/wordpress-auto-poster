import os
from datetime import datetime
from typing import Dict, List, Optional
from openai import OpenAI

class AdvancedContentGenerator:
    """고급 AI 콘텐츠 생성 클래스 (데모 모드 지원)"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "demo-key")
        self.demo_mode = True
        
        try:
            if self.api_key and self.api_key != "demo-key":
                self.client = OpenAI(api_key=self.api_key)
                self.demo_mode = False
            else:
                self.client = None
                print("OpenAI API 키가 설정되지 않았습니다. 데모 모드로 실행됩니다.")
        except Exception as e:
            self.client = None
            print(f"OpenAI 클라이언트 초기화 실패: {e}")
    
    def generate_seo_optimized_content(self, keyword: str, content_type: str = 'blog_post', 
                                      tone: str = 'professional', target_audience: str = 'general',
                                      additional_keywords: List[str] = None, 
                                      custom_instructions: str = "") -> Dict:
        """SEO 최적화된 콘텐츠 생성"""
        
        # 데모 모드인 경우 샘플 콘텐츠 반환
        if self.demo_mode or not self.client:
            return self._generate_demo_content(keyword, content_type, tone)
        
        try:
            # 실제 AI 생성 로직 (OpenAI API 사용)
            additional_keywords = additional_keywords or []
            
            prompt = f"""
            다음 조건에 맞는 SEO 최적화된 {content_type} 콘텐츠를 작성해주세요:
            
            - 메인 키워드: {keyword}
            - 추가 키워드: {', '.join(additional_keywords) if additional_keywords else '없음'}
            - 톤: {tone}
            - 타겟 독자: {target_audience}
            - 추가 지시사항: {custom_instructions if custom_instructions else '없음'}
            
            제목과 본문을 포함하여 1000-1500단어로 작성해주세요.
            """
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "당신은 전문적인 SEO 콘텐츠 작성자입니다."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            
            # 제목과 본문 분리
            lines = content.split('\n')
            title = lines[0].replace('# ', '').replace('## ', '').strip()
            body = '\n'.join(lines[1:]).strip()
            
            return self._format_content_response(title, body, keyword, content_type, tone, target_audience)
            
        except Exception as e:
            print(f"콘텐츠 생성 오류: {e}")
            return self._generate_demo_content(keyword, content_type, tone)
    
    def _generate_demo_content(self, keyword: str, content_type: str, tone: str) -> Dict:
        """데모 콘텐츠 생성"""
        title = f"{keyword}에 대한 완벽한 가이드"
        
        demo_content = f"""
{keyword}는 현대 디지털 시대에서 매우 중요한 주제입니다. 이 글에서는 {keyword}에 대해 자세히 알아보고, 실제로 어떻게 활용할 수 있는지 살펴보겠습니다.

## {keyword}란 무엇인가?

{keyword}는 다양한 분야에서 활용되는 중요한 개념입니다. 특히 최근 몇 년간 그 중요성이 더욱 부각되고 있으며, 많은 전문가들이 주목하고 있는 분야입니다.

## {keyword}의 주요 특징

1. **효율성**: {keyword}는 높은 효율성을 제공합니다.
2. **확장성**: 다양한 규모에서 적용 가능합니다.
3. **유연성**: 변화하는 요구사항에 쉽게 적응할 수 있습니다.

## {keyword} 활용 방법

{keyword}를 효과적으로 활용하기 위해서는 다음과 같은 단계를 따르는 것이 좋습니다:

### 1단계: 기초 이해
먼저 {keyword}의 기본 개념을 정확히 이해해야 합니다.

### 2단계: 실습
이론적 지식을 바탕으로 실제 실습을 진행합니다.

### 3단계: 응용
학습한 내용을 실제 프로젝트에 적용해봅니다.

## {keyword}의 미래 전망

{keyword} 분야는 지속적으로 발전하고 있으며, 앞으로도 많은 혁신이 예상됩니다. 특히 인공지능과 머신러닝 기술의 발전과 함께 더욱 정교하고 효율적인 솔루션들이 등장할 것으로 예상됩니다.

## 결론

{keyword}는 현재와 미래의 디지털 환경에서 핵심적인 역할을 할 것입니다. 이를 제대로 이해하고 활용한다면, 개인과 조직 모두에게 큰 도움이 될 것입니다.

지금 바로 {keyword}에 대해 더 자세히 알아보고, 실제로 적용해보시기 바랍니다.
        """.strip()
        
        return self._format_content_response(title, demo_content, keyword, content_type, tone, 'general', demo_mode=True)
    
    def _format_content_response(self, title: str, content: str, keyword: str, 
                                content_type: str, tone: str, target_audience: str, demo_mode: bool = False) -> Dict:
        """콘텐츠 응답 포맷팅"""
        response = {
            'title': title,
            'content': content,
            'keyword': keyword,
            'content_type': content_type,
            'tone': tone,
            'target_audience': target_audience,
            'meta_tags': {
                'meta_description': f"{keyword}에 대한 포괄적인 가이드입니다. {keyword}의 정의, 특징, 활용 방법 등을 자세히 알아보세요.",
                'meta_keywords': f"{keyword}, 가이드, 활용법, 특징"
            },
            'content_analysis': {
                'seo_score': 85,
                'content_length': len(content),
                'keyword_density': 2.5,
                'readability_score': 'Good',
                'keyword_in_title': keyword.lower() in title.lower(),
                'title_length': len(title)
            },
            'related_keywords': [f"{keyword} 가이드", f"{keyword} 활용", f"{keyword} 방법", f"{keyword} 특징"],
            'generated_at': datetime.now().isoformat(),
            'word_count': len(content.split()),
            'estimated_reading_time': max(1, len(content.split()) // 200)
        }
        
        if demo_mode:
            response['demo_mode'] = True
            
        return response
    
    def generate_content_variations(self, base_content: Dict, variation_count: int = 3) -> List[Dict]:
        """콘텐츠 변형 생성"""
        variations = []
        
        for i in range(variation_count):
            variation = {
                'title': f"{base_content['title']} - 변형 {i+1}",
                'content': f"[변형 {i+1}] " + base_content['content'],
                'variation_type': f'variation_{i+1}',
                'generated_at': datetime.now().isoformat()
            }
            variations.append(variation)
        
        return variations
    
    def generate_social_media_content(self, main_content: Dict) -> Dict:
        """소셜 미디어용 콘텐츠 생성"""
        return {
            'facebook': {
                'text': f"📝 새 글: {main_content['title']}\n\n{main_content['content'][:100]}...",
                'hashtags': ['#블로그', '#콘텐츠', f"#{main_content['keyword']}"]
            },
            'twitter': {
                'text': f"📝 {main_content['title']}\n\n{main_content['content'][:100]}...",
                'hashtags': ['#블로그', f"#{main_content['keyword']}"]
            },
            'linkedin': {
                'text': f"새로운 인사이트: {main_content['title']}\n\n{main_content['content'][:200]}...",
                'hashtags': ['#전문지식', '#인사이트', f"#{main_content['keyword']}"]
            }
        }

