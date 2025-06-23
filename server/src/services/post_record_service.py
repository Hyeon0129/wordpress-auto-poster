import os
import json
from typing import Dict, List, Optional
from datetime import datetime
from fastapi import HTTPException
from pydantic import BaseModel

class PostRecord(BaseModel):
    id: str
    title: str
    content: str
    keyword: str
    status: str  # draft, published, failed
    wordpress_site: str = ""
    wordpress_post_id: Optional[int] = None
    wordpress_url: Optional[str] = None
    seo_score: Optional[int] = None
    created_at: str
    published_at: Optional[str] = None
    views: int = 0
    word_count: int = 0

class ContentGenerationRequest(BaseModel):
    keyword: str
    content_type: str = "blog"
    tone: str = "professional"
    word_count: int = 1000
    target_audience: str = "general"

class PostRecordService:
    def __init__(self):
        self.data_dir = "data/posts"
        os.makedirs(self.data_dir, exist_ok=True)
    
    def get_user_posts_file(self, user_id: str) -> str:
        """사용자별 포스트 파일 경로 반환"""
        return os.path.join(self.data_dir, f"{user_id}_posts.json")
    
    def load_user_posts(self, user_id: str) -> List[Dict]:
        """사용자 포스트 목록 로드"""
        try:
            posts_file = self.get_user_posts_file(user_id)
            
            if os.path.exists(posts_file):
                with open(posts_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            return []
            
        except Exception as e:
            print(f"포스트 로드 실패: {str(e)}")
            return []
    
    def save_user_posts(self, user_id: str, posts: List[Dict]):
        """사용자 포스트 목록 저장"""
        try:
            posts_file = self.get_user_posts_file(user_id)
            
            with open(posts_file, "w", encoding="utf-8") as f:
                json.dump(posts, f, ensure_ascii=False, indent=2)
                
        except Exception as e:
            print(f"포스트 저장 실패: {str(e)}")
    
    def create_post_record(self, user_id: str, post_data: Dict) -> Dict:
        """새 포스트 기록 생성"""
        try:
            posts = self.load_user_posts(user_id)
            
            # 새 포스트 ID 생성
            post_id = f"post_{len(posts) + 1}_{int(datetime.now().timestamp())}"
            
            # 포스트 기록 생성
            post_record = {
                "id": post_id,
                "title": post_data.get("title", "제목 없음"),
                "content": post_data.get("content", ""),
                "keyword": post_data.get("keyword", ""),
                "status": "draft",
                "wordpress_site": "",
                "wordpress_post_id": None,
                "wordpress_url": None,
                "seo_score": post_data.get("seo_score"),
                "created_at": datetime.now().isoformat(),
                "published_at": None,
                "views": 0,
                "word_count": len(post_data.get("content", "").split())
            }
            
            posts.append(post_record)
            self.save_user_posts(user_id, posts)
            
            return {
                "success": True,
                "message": "포스트 기록이 생성되었습니다.",
                "post_id": post_id,
                "post": post_record
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"포스트 기록 생성 실패: {str(e)}")
    
    def update_post_record(self, user_id: str, post_id: str, update_data: Dict) -> Dict:
        """포스트 기록 업데이트"""
        try:
            posts = self.load_user_posts(user_id)
            
            # 포스트 찾기
            post_index = None
            for i, post in enumerate(posts):
                if post["id"] == post_id:
                    post_index = i
                    break
            
            if post_index is None:
                raise HTTPException(status_code=404, detail="포스트를 찾을 수 없습니다.")
            
            # 업데이트
            for key, value in update_data.items():
                if key in posts[post_index]:
                    posts[post_index][key] = value
            
            # 발행 시간 업데이트
            if update_data.get("status") == "published" and not posts[post_index].get("published_at"):
                posts[post_index]["published_at"] = datetime.now().isoformat()
            
            self.save_user_posts(user_id, posts)
            
            return {
                "success": True,
                "message": "포스트 기록이 업데이트되었습니다.",
                "post": posts[post_index]
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"포스트 기록 업데이트 실패: {str(e)}")
    
    def get_user_posts(self, user_id: str, limit: int = 50, status: str = None) -> List[Dict]:
        """사용자 포스트 목록 조회"""
        try:
            posts = self.load_user_posts(user_id)
            
            # 상태별 필터링
            if status:
                posts = [post for post in posts if post.get("status") == status]
            
            # 최신순 정렬
            posts.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            
            # 제한
            return posts[:limit]
            
        except Exception as e:
            print(f"포스트 조회 실패: {str(e)}")
            return []
    
    def get_post_by_id(self, user_id: str, post_id: str) -> Optional[Dict]:
        """특정 포스트 조회"""
        try:
            posts = self.load_user_posts(user_id)
            
            for post in posts:
                if post["id"] == post_id:
                    return post
            
            return None
            
        except Exception as e:
            print(f"포스트 조회 실패: {str(e)}")
            return None
    
    def delete_post_record(self, user_id: str, post_id: str) -> Dict:
        """포스트 기록 삭제"""
        try:
            posts = self.load_user_posts(user_id)
            
            # 포스트 찾기 및 삭제
            posts = [post for post in posts if post["id"] != post_id]
            
            self.save_user_posts(user_id, posts)
            
            return {
                "success": True,
                "message": "포스트 기록이 삭제되었습니다."
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"포스트 기록 삭제 실패: {str(e)}")
    
    def get_post_statistics(self, user_id: str) -> Dict:
        """포스트 통계 조회"""
        try:
            posts = self.load_user_posts(user_id)
            
            total_posts = len(posts)
            published_posts = len([p for p in posts if p.get("status") == "published"])
            draft_posts = len([p for p in posts if p.get("status") == "draft"])
            total_views = sum(p.get("views", 0) for p in posts)
            
            # 평균 SEO 점수
            seo_scores = [p.get("seo_score", 0) for p in posts if p.get("seo_score")]
            avg_seo_score = sum(seo_scores) / len(seo_scores) if seo_scores else 0
            
            # 이번 달 포스트 수
            current_month = datetime.now().strftime("%Y-%m")
            this_month_posts = len([
                p for p in posts 
                if p.get("created_at", "").startswith(current_month)
            ])
            
            return {
                "total_posts": total_posts,
                "published_posts": published_posts,
                "draft_posts": draft_posts,
                "total_views": total_views,
                "avg_seo_score": round(avg_seo_score, 1),
                "this_month_posts": this_month_posts
            }
            
        except Exception as e:
            print(f"포스트 통계 조회 실패: {str(e)}")
            return {
                "total_posts": 0,
                "published_posts": 0,
                "draft_posts": 0,
                "total_views": 0,
                "avg_seo_score": 0,
                "this_month_posts": 0
            }
    
    def generate_content(self, user_id: str, request: ContentGenerationRequest) -> Dict:
        """콘텐츠 생성 및 기록"""
        try:
            # 여기서는 간단한 콘텐츠 생성 (실제로는 LLM 서비스 사용)
            content_templates = {
                "blog": f"""# {request.keyword}에 대한 완벽한 가이드

## 소개
{request.keyword}는 현재 많은 사람들이 관심을 가지고 있는 주제입니다. 이 글에서는 {request.keyword}에 대해 자세히 알아보겠습니다.

## {request.keyword}란 무엇인가?
{request.keyword}는 [상세한 설명이 여기에 들어갑니다]. 이는 매우 중요한 개념으로, 다양한 분야에서 활용되고 있습니다.

## {request.keyword}의 주요 특징
1. 첫 번째 특징
2. 두 번째 특징
3. 세 번째 특징

## {request.keyword} 활용 방법
{request.keyword}를 효과적으로 활용하기 위해서는 다음과 같은 방법들을 고려해볼 수 있습니다.

### 방법 1: 기본적인 접근
기본적인 {request.keyword} 활용법에 대해 설명합니다.

### 방법 2: 고급 기법
더 고급스러운 {request.keyword} 활용 기법을 소개합니다.

## 결론
{request.keyword}는 올바르게 이해하고 활용한다면 매우 유용한 도구가 될 수 있습니다. 이 가이드를 통해 {request.keyword}에 대한 이해를 높이시기 바랍니다.
""",
                "article": f"""# {request.keyword}: 전문가가 알려주는 핵심 정보

{request.keyword}에 대한 전문적인 분석과 인사이트를 제공합니다.

## 현재 상황 분석
{request.keyword}의 현재 상황과 트렌드를 분석해보겠습니다.

## 전문가 의견
업계 전문가들이 {request.keyword}에 대해 어떻게 생각하는지 알아보겠습니다.

## 향후 전망
{request.keyword}의 미래 전망과 발전 가능성을 예측해봅니다.
""",
                "tutorial": f"""# {request.keyword} 튜토리얼: 단계별 가이드

이 튜토리얼에서는 {request.keyword}를 단계별로 학습할 수 있습니다.

## 준비 사항
{request.keyword}를 시작하기 전에 필요한 준비 사항들을 확인해보세요.

## 단계 1: 기초 이해
{request.keyword}의 기본 개념을 이해해봅시다.

## 단계 2: 실습
실제로 {request.keyword}를 적용해보는 실습 과정입니다.

## 단계 3: 응용
학습한 내용을 바탕으로 {request.keyword}를 응용해봅시다.
"""
            }
            
            # 콘텐츠 생성
            template = content_templates.get(request.content_type, content_templates["blog"])
            
            # 단어 수에 맞게 조정 (간단한 방식)
            words = template.split()
            if len(words) > request.word_count:
                template = " ".join(words[:request.word_count])
            elif len(words) < request.word_count:
                # 내용 확장 (실제로는 LLM이 처리)
                additional_content = f"\n\n## {request.keyword}의 추가 정보\n{request.keyword}에 대한 더 자세한 내용을 여기에 추가합니다."
                template += additional_content
            
            # 포스트 기록 생성
            post_data = {
                "title": f"{request.keyword}에 대한 완벽한 가이드",
                "content": template,
                "keyword": request.keyword,
                "seo_score": 75  # 기본 SEO 점수
            }
            
            result = self.create_post_record(user_id, post_data)
            
            return {
                "success": True,
                "message": "콘텐츠가 성공적으로 생성되었습니다.",
                "content": template,
                "post_record": result["post"],
                "generation_info": {
                    "keyword": request.keyword,
                    "content_type": request.content_type,
                    "tone": request.tone,
                    "word_count": len(template.split()),
                    "target_audience": request.target_audience
                }
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"콘텐츠 생성 실패: {str(e)}")

# 전역 포스트 기록 서비스 인스턴스
post_record_service = PostRecordService()

