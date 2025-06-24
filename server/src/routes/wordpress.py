from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from src.db import get_db
from src.utils.dependencies import get_current_user
from src.services.wordpress_service import WordPressService

router = APIRouter()

# WordPress 서비스 인스턴스
wp_service = WordPressService()

class WordPressSiteRequest(BaseModel):
    name: str
    url: str
    username: str
    password: str

class WordPressTestRequest(BaseModel):
    url: str
    username: str
    password: str

class PostCreationRequest(BaseModel):
    site_id: int
    title: str
    content: str
    status: str = 'draft'  # draft, publish, private
    categories: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    featured_image_url: Optional[str] = None
    excerpt: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None

@router.post('/connect')
def connect_wordpress_site(payload: WordPressSiteRequest, user = Depends(get_current_user)):
    """WordPress 사이트 연결"""
    try:
        site = wp_service.add_site(
            user_id=user.id,
            name=payload.name,
            url=payload.url,
            username=payload.username,
            password=payload.password
        )
        
        return {
            "success": True,
            "message": "WordPress 사이트가 성공적으로 연결되었습니다.",
            "site": site
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"사이트 연결 중 오류: {str(e)}")

@router.post('/test-connection')
def test_connection(payload: WordPressTestRequest, user = Depends(get_current_user)):
    """WordPress 연결 테스트"""
    try:
        result = wp_service.test_connection(payload.url, payload.username, payload.password)
        return result
    except Exception as e:
        return {
            "success": False,
            "message": f"연결 테스트 중 오류: {str(e)}"
        }

@router.get('/sites')
def get_wordpress_sites(user = Depends(get_current_user)):
    """사용자의 WordPress 사이트 목록 조회"""
    try:
        sites = wp_service.get_user_sites(user.id)
        return {
            "success": True,
            "sites": sites
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put('/sites/{site_id}')
def update_wordpress_site(site_id: int, payload: WordPressSiteRequest, user = Depends(get_current_user)):
    """WordPress 사이트 정보 수정"""
    try:
        site = wp_service.update_site(
            user_id=user.id,
            site_id=site_id,
            name=payload.name,
            url=payload.url,
            username=payload.username,
            password=payload.password
        )
        
        return {
            "success": True,
            "message": "사이트 정보가 성공적으로 수정되었습니다.",
            "site": site
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/sites/{site_id}')
def delete_wordpress_site(site_id: int, user = Depends(get_current_user)):
    """WordPress 사이트 삭제"""
    try:
        wp_service.delete_site(user.id, site_id)
        
        return {
            "success": True,
            "message": "사이트가 성공적으로 삭제되었습니다."
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/post')
def create_wordpress_post(payload: PostCreationRequest, user = Depends(get_current_user)):
    """WordPress 포스트 생성"""
    try:
        result = wp_service.create_post(
            user_id=user.id,
            site_id=payload.site_id,
            title=payload.title,
            content=payload.content,
            status=payload.status,
            categories=payload.categories,
            tags=payload.tags,
            featured_image_url=payload.featured_image_url,
            excerpt=payload.excerpt,
            meta_description=payload.meta_description
        )
        
        return {
            "success": True,
            "message": "포스트가 성공적으로 생성되었습니다.",
            "post": result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"포스트 생성 중 오류: {str(e)}")

@router.get('/posts/{site_id}')
def get_wordpress_posts(site_id: int, limit: int = 10, user = Depends(get_current_user)):
    """WordPress 포스트 목록 조회"""
    try:
        posts = wp_service.get_posts(user.id, site_id, limit)
        
        return {
            "success": True,
            "posts": posts
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/sites/{site_id}/info')
def get_site_info(site_id: int, user = Depends(get_current_user)):
    """WordPress 사이트 정보 조회"""
    try:
        site = wp_service.get_site(user.id, site_id)
        if not site:
            raise HTTPException(status_code=404, detail="사이트를 찾을 수 없습니다.")
        
        return {
            "success": True,
            "site": site
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/sites/{site_id}/test')
def test_site_connection(site_id: int, user = Depends(get_current_user)):
    """특정 사이트 연결 테스트"""
    try:
        site = wp_service.get_site(user.id, site_id)
        if not site:
            raise HTTPException(status_code=404, detail="사이트를 찾을 수 없습니다.")
        
        result = wp_service.test_connection(site['url'], site['username'], site['password'])
        
        # 테스트 결과에 따라 사이트 상태 업데이트
        site['last_tested'] = datetime.utcnow().isoformat()
        site['status'] = 'connected' if result['success'] else 'disconnected'
        
        return result
    except Exception as e:
        return {
            "success": False,
            "message": f"연결 테스트 중 오류: {str(e)}"
        }

@router.put('/sites/{site_id}/toggle-active')
def toggle_site_active(site_id: int, user = Depends(get_current_user)):
    """WordPress 사이트 활성화 상태 토글"""
    try:
        site = wp_service.get_site(user.id, site_id)
        if not site:
            raise HTTPException(status_code=404, detail="사이트를 찾을 수 없습니다.")
        
        # 다른 사이트들을 비활성화하고 현재 사이트를 활성화
        sites = wp_service.get_user_sites(user.id)
        for s in sites:
            s['is_active'] = (s['id'] == site_id)
        
        return {
            "success": True,
            "message": f"사이트 '{site['name']}'이 활성화되었습니다.",
            "site": site
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

