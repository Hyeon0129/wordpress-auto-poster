from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import re
import requests
import base64

from src.db import get_db
from src.utils.dependencies import get_current_user

router = APIRouter()

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
    site_id: str
    title: str
    content: str
    status: str = 'draft'  # draft, publish, private
    categories: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    featured_image_url: Optional[str] = None
    excerpt: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None

# 임시 사이트 저장소 (실제로는 데이터베이스 사용)
wordpress_sites = {}

@router.post('/connect')
def connect_wordpress_site(payload: WordPressSiteRequest, user = Depends(get_current_user)):
    """WordPress 사이트 연결"""
    try:
        # URL 정규화
        url = payload.url.rstrip('/')
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # 연결 테스트
        test_result = test_wordpress_connection(url, payload.username, payload.password)
        
        if not test_result['success']:
            raise HTTPException(status_code=400, detail=f"WordPress 연결 실패: {test_result['message']}")
        
        # 사이트 정보 저장
        site_id = f"site_{len(wordpress_sites) + 1}"
        wordpress_sites[site_id] = {
            'id': site_id,
            'name': payload.name,
            'url': url,
            'username': payload.username,
            'password': payload.password,
            'user_id': user.id,
            'is_active': True,
            'created_at': datetime.now().isoformat(),
            'last_tested': datetime.now().isoformat(),
            'status': 'connected'
        }
        
        return {
            "success": True,
            "message": "WordPress 사이트가 성공적으로 연결되었습니다.",
            "site": wordpress_sites[site_id]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/test-connection')
def test_connection(payload: WordPressTestRequest, user = Depends(get_current_user)):
    """WordPress 연결 테스트"""
    try:
        result = test_wordpress_connection(payload.url, payload.username, payload.password)
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
        user_sites = [site for site in wordpress_sites.values() if site['user_id'] == user.id]
        return {
            "success": True,
            "sites": user_sites
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/sites/{site_id}')
def delete_wordpress_site(site_id: str, user = Depends(get_current_user)):
    """WordPress 사이트 삭제"""
    try:
        if site_id not in wordpress_sites:
            raise HTTPException(status_code=404, detail="사이트를 찾을 수 없습니다.")
        
        site = wordpress_sites[site_id]
        if site['user_id'] != user.id:
            raise HTTPException(status_code=403, detail="권한이 없습니다.")
        
        del wordpress_sites[site_id]
        
        return {
            "success": True,
            "message": "사이트가 성공적으로 삭제되었습니다."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/post')
def create_wordpress_post(payload: PostCreationRequest, user = Depends(get_current_user)):
    """WordPress 포스트 생성"""
    try:
        if payload.site_id not in wordpress_sites:
            raise HTTPException(status_code=404, detail="사이트를 찾을 수 없습니다.")
        
        site = wordpress_sites[payload.site_id]
        if site['user_id'] != user.id:
            raise HTTPException(status_code=403, detail="권한이 없습니다.")
        
        # WordPress API를 통한 포스트 생성
        result = create_wordpress_post_api(site, payload)
        
        return {
            "success": True,
            "message": "포스트가 성공적으로 생성되었습니다.",
            "post_id": result.get('id'),
            "post_url": result.get('link')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/posts/{site_id}')
def get_wordpress_posts(site_id: str, user = Depends(get_current_user)):
    """WordPress 포스트 목록 조회"""
    try:
        if site_id not in wordpress_sites:
            raise HTTPException(status_code=404, detail="사이트를 찾을 수 없습니다.")
        
        site = wordpress_sites[site_id]
        if site['user_id'] != user.id:
            raise HTTPException(status_code=403, detail="권한이 없습니다.")
        
        # WordPress API를 통한 포스트 목록 조회
        posts = get_wordpress_posts_api(site)
        
        return {
            "success": True,
            "posts": posts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def test_wordpress_connection(url: str, username: str, password: str) -> dict:
    """WordPress 연결 테스트 함수"""
    try:
        # URL 정규화
        api_url = url.rstrip('/') + '/wp-json/wp/v2/users/me'
        
        # 인증 헤더 생성
        credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
        headers = {
            'Authorization': f'Basic {credentials}',
            'Content-Type': 'application/json'
        }
        
        # API 요청
        response = requests.get(api_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            user_data = response.json()
            return {
                "success": True,
                "message": "연결 성공",
                "user_info": {
                    "id": user_data.get('id'),
                    "name": user_data.get('name'),
                    "email": user_data.get('email'),
                    "roles": user_data.get('roles', [])
                }
            }
        elif response.status_code == 401:
            return {
                "success": False,
                "message": "인증 실패: 사용자명 또는 비밀번호가 올바르지 않습니다."
            }
        elif response.status_code == 404:
            return {
                "success": False,
                "message": "WordPress REST API를 찾을 수 없습니다. WordPress 버전을 확인해주세요."
            }
        else:
            return {
                "success": False,
                "message": f"연결 실패: HTTP {response.status_code}"
            }
    except requests.exceptions.Timeout:
        return {
            "success": False,
            "message": "연결 시간 초과: 사이트 URL을 확인해주세요."
        }
    except requests.exceptions.ConnectionError:
        return {
            "success": False,
            "message": "연결 오류: 사이트에 접근할 수 없습니다."
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"알 수 없는 오류: {str(e)}"
        }

def create_wordpress_post_api(site: dict, payload: PostCreationRequest) -> dict:
    """WordPress API를 통한 포스트 생성"""
    try:
        api_url = site['url'].rstrip('/') + '/wp-json/wp/v2/posts'
        
        credentials = base64.b64encode(f"{site['username']}:{site['password']}".encode()).decode()
        headers = {
            'Authorization': f'Basic {credentials}',
            'Content-Type': 'application/json'
        }
        
        post_data = {
            'title': payload.title,
            'content': payload.content,
            'status': payload.status,
            'excerpt': payload.excerpt or '',
        }
        
        # 카테고리 처리
        if payload.categories:
            # 실제로는 카테고리 ID를 조회해야 함
            post_data['categories'] = [1]  # 기본 카테고리
        
        # 태그 처리
        if payload.tags:
            # 실제로는 태그 ID를 조회하거나 생성해야 함
            post_data['tags'] = []
        
        response = requests.post(api_url, headers=headers, json=post_data, timeout=30)
        
        if response.status_code in [200, 201]:
            return response.json()
        else:
            raise Exception(f"포스트 생성 실패: HTTP {response.status_code}")
    
    except Exception as e:
        raise Exception(f"WordPress 포스트 생성 중 오류: {str(e)}")

def get_wordpress_posts_api(site: dict) -> List[dict]:
    """WordPress API를 통한 포스트 목록 조회"""
    try:
        api_url = site['url'].rstrip('/') + '/wp-json/wp/v2/posts'
        
        credentials = base64.b64encode(f"{site['username']}:{site['password']}".encode()).decode()
        headers = {
            'Authorization': f'Basic {credentials}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(api_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            posts = response.json()
            return [{
                'id': post['id'],
                'title': post['title']['rendered'],
                'content': post['content']['rendered'][:200] + '...',
                'status': post['status'],
                'date': post['date'],
                'link': post['link']
            } for post in posts[:10]]  # 최근 10개 포스트
        else:
            return []
    
    except Exception as e:
        return []

