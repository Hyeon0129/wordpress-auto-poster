from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Optional
from ..services.post_record_service import post_record_service, ContentGenerationRequest
from ..auth import get_current_user

router = APIRouter(prefix="/api/posts", tags=["Posts"])

@router.post("/generate")
async def generate_content(
    request: ContentGenerationRequest,
    current_user: dict = Depends(get_current_user)
):
    """콘텐츠 생성"""
    try:
        user_id = str(current_user.get("id"))
        result = post_record_service.generate_content(user_id, request)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"콘텐츠 생성 실패: {str(e)}")

@router.get("/")
async def get_posts(
    limit: int = 50,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """포스트 목록 조회"""
    try:
        user_id = str(current_user.get("id"))
        posts = post_record_service.get_user_posts(user_id, limit, status)
        
        return {
            "success": True,
            "posts": posts,
            "total": len(posts)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"포스트 조회 실패: {str(e)}")

@router.get("/{post_id}")
async def get_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """특정 포스트 조회"""
    try:
        user_id = str(current_user.get("id"))
        post = post_record_service.get_post_by_id(user_id, post_id)
        
        if not post:
            raise HTTPException(status_code=404, detail="포스트를 찾을 수 없습니다.")
        
        return {
            "success": True,
            "post": post
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"포스트 조회 실패: {str(e)}")

@router.put("/{post_id}")
async def update_post(
    post_id: str,
    update_data: Dict,
    current_user: dict = Depends(get_current_user)
):
    """포스트 업데이트"""
    try:
        user_id = str(current_user.get("id"))
        result = post_record_service.update_post_record(user_id, post_id, update_data)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"포스트 업데이트 실패: {str(e)}")

@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """포스트 삭제"""
    try:
        user_id = str(current_user.get("id"))
        result = post_record_service.delete_post_record(user_id, post_id)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"포스트 삭제 실패: {str(e)}")

@router.get("/statistics/overview")
async def get_post_statistics(current_user: dict = Depends(get_current_user)):
    """포스트 통계 조회"""
    try:
        user_id = str(current_user.get("id"))
        stats = post_record_service.get_post_statistics(user_id)
        
        return {
            "success": True,
            "statistics": stats
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"통계 조회 실패: {str(e)}")

@router.post("/{post_id}/publish")
async def publish_to_wordpress(
    post_id: str,
    wordpress_config: Dict,
    current_user: dict = Depends(get_current_user)
):
    """WordPress에 포스트 발행"""
    try:
        user_id = str(current_user.get("id"))
        
        # 포스트 조회
        post = post_record_service.get_post_by_id(user_id, post_id)
        if not post:
            raise HTTPException(status_code=404, detail="포스트를 찾을 수 없습니다.")
        
        # WordPress 발행 로직 (wordpress_service 사용)
        from ..services.wordpress_service import wordpress_service, WordPressPost
        
        wp_post = WordPressPost(
            title=post["title"],
            content=post["content"],
            status=wordpress_config.get("status", "draft"),
            categories=wordpress_config.get("categories", []),
            tags=wordpress_config.get("tags", [])
        )
        
        wp_result = wordpress_service.create_post(
            wordpress_config["site_id"], 
            wp_post
        )
        
        if wp_result["success"]:
            # 포스트 기록 업데이트
            update_data = {
                "status": "published",
                "wordpress_site": wordpress_config["site_id"],
                "wordpress_post_id": wp_result.get("post_id"),
                "wordpress_url": wp_result.get("post_url")
            }
            
            post_record_service.update_post_record(user_id, post_id, update_data)
            
            return {
                "success": True,
                "message": "WordPress에 성공적으로 발행되었습니다.",
                "wordpress_result": wp_result
            }
        else:
            raise HTTPException(status_code=400, detail="WordPress 발행 실패")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"WordPress 발행 실패: {str(e)}")

