import requests
import base64
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import re
from urllib.parse import urljoin, urlparse
from wordpress_xmlrpc import Client, WordPressPost, WordPressPage
from wordpress_xmlrpc.methods import posts, media, taxonomies
from wordpress_xmlrpc.compat import xmlrpc_client
import time

class AdvancedWordPressConnector:
    """고급 워드프레스 연동 클래스"""
    
    def __init__(self, site_url: str, username: str, password: str):
        self.site_url = site_url.rstrip('/')
        self.username = username
        self.password = password
        self.jwt_token = None
        self.token_expires_at = None
        self.xmlrpc_client = None
        self.rest_api_base = f"{self.site_url}/wp-json/wp/v2"
        
        # XML-RPC 클라이언트 초기화
        try:
            xmlrpc_url = f"{self.site_url}/xmlrpc.php"
            self.xmlrpc_client = Client(xmlrpc_url, username, password)
        except Exception as e:
            print(f"XML-RPC 클라이언트 초기화 실패: {e}")
    
    def get_jwt_token(self) -> Tuple[bool, str]:
        """JWT 토큰 획득"""
        try:
            auth_url = f"{self.site_url}/wp-json/jwt-auth/v1/token"
            auth_data = {'username': self.username, 'password': self.password}
            response = requests.post(auth_url, json=auth_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get('token')
                self.token_expires_at = datetime.now() + timedelta(hours=24)
                return True, "JWT token acquired successfully"
            else:
                return False, f"JWT token error: {response.text}"
        except Exception as e:
            return False, f"JWT token acquisition failed: {str(e)}"
    
    def get_auth_headers(self) -> Dict[str, str]:
        """인증 헤더 생성"""
        # JWT 토큰이 유효한 경우
        if self.jwt_token and self.token_expires_at and datetime.now() < self.token_expires_at:
            return {
                'Authorization': f'Bearer {self.jwt_token}',
                'Content-Type': 'application/json'
            }
        
        # Basic Auth 사용
        credentials = base64.b64encode(f"{self.username}:{self.password}".encode()).decode()
        return {
            'Authorization': f'Basic {credentials}',
            'Content-Type': 'application/json'
        }
    
    def test_connection(self) -> Tuple[bool, Dict]:
        """연결 테스트"""
        try:
            # JWT 토큰 시도
            jwt_success, jwt_message = self.get_jwt_token()
            
            # REST API 테스트
            url = f"{self.rest_api_base}/users/me"
            headers = self.get_auth_headers()
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                user_data = response.json()
                
                # 사이트 정보 추가 수집
                site_info = self.get_site_info()
                
                return True, {
                    "user_info": user_data,
                    "site_info": site_info,
                    "jwt_available": jwt_success,
                    "connection_method": "JWT" if jwt_success else "Basic Auth",
                    "test_time": datetime.now().isoformat()
                }
            else:
                return False, {
                    "error": f"Connection failed: {response.status_code}",
                    "message": response.text,
                    "jwt_status": jwt_message
                }
        except Exception as e:
            return False, {
                "error": "Connection test failed",
                "message": str(e)
            }
    
    def get_site_info(self) -> Dict:
        """사이트 정보 조회"""
        try:
            # 사이트 기본 정보
            site_url = f"{self.site_url}/wp-json"
            response = requests.get(site_url, timeout=30)
            
            if response.status_code == 200:
                site_data = response.json()
                
                # 추가 정보 수집
                additional_info = {}
                
                # 테마 정보 (가능한 경우)
                try:
                    themes_url = f"{self.rest_api_base}/themes"
                    headers = self.get_auth_headers()
                    themes_response = requests.get(themes_url, headers=headers, timeout=10)
                    if themes_response.status_code == 200:
                        themes = themes_response.json()
                        active_theme = next((theme for theme in themes if theme.get('status') == 'active'), None)
                        additional_info['active_theme'] = active_theme
                except:
                    pass
                
                # 플러그인 정보 (가능한 경우)
                try:
                    plugins_url = f"{self.rest_api_base}/plugins"
                    headers = self.get_auth_headers()
                    plugins_response = requests.get(plugins_url, headers=headers, timeout=10)
                    if plugins_response.status_code == 200:
                        plugins = plugins_response.json()
                        additional_info['plugins_count'] = len(plugins)
                        additional_info['active_plugins'] = [p for p in plugins if p.get('status') == 'active']
                except:
                    pass
                
                return {
                    "name": site_data.get('name', 'Unknown'),
                    "description": site_data.get('description', ''),
                    "url": site_data.get('url', self.site_url),
                    "wordpress_version": site_data.get('gmt_offset', 'Unknown'),
                    "timezone": site_data.get('timezone_string', 'Unknown'),
                    **additional_info
                }
            else:
                return {"error": "Could not retrieve site info"}
        except Exception as e:
            return {"error": f"Site info retrieval failed: {str(e)}"}
    
    def create_post(self, title: str, content: str, status: str = 'draft', 
                   categories: List[str] = None, tags: List[str] = None,
                   featured_image_url: str = None, excerpt: str = None,
                   meta_description: str = None, meta_keywords: str = None) -> Tuple[bool, Dict]:
        """포스트 생성"""
        try:
            # REST API를 통한 포스트 생성
            post_data = {
                'title': title,
                'content': content,
                'status': status,
                'excerpt': excerpt or '',
                'meta': {}
            }
            
            # 카테고리 처리
            if categories:
                category_ids = self._get_or_create_categories(categories)
                if category_ids:
                    post_data['categories'] = category_ids
            
            # 태그 처리
            if tags:
                tag_ids = self._get_or_create_tags(tags)
                if tag_ids:
                    post_data['tags'] = tag_ids
            
            # SEO 메타 데이터 (Yoast SEO 플러그인 호환)
            if meta_description:
                post_data['meta']['_yoast_wpseo_metadesc'] = meta_description
            if meta_keywords:
                post_data['meta']['_yoast_wpseo_focuskw'] = meta_keywords
            
            # 포스트 생성
            headers = self.get_auth_headers()
            response = requests.post(
                f"{self.rest_api_base}/posts",
                headers=headers,
                json=post_data,
                timeout=60
            )
            
            if response.status_code == 201:
                post_result = response.json()
                
                # 대표 이미지 설정
                if featured_image_url:
                    self._set_featured_image(post_result['id'], featured_image_url)
                
                return True, {
                    "post_id": post_result['id'],
                    "post_url": post_result['link'],
                    "status": post_result['status'],
                    "created_at": post_result['date'],
                    "title": post_result['title']['rendered']
                }
            else:
                return False, {
                    "error": f"Post creation failed: {response.status_code}",
                    "message": response.text
                }
        
        except Exception as e:
            # XML-RPC 백업 시도
            if self.xmlrpc_client:
                return self._create_post_xmlrpc(title, content, status, categories, tags)
            else:
                return False, {"error": f"Post creation failed: {str(e)}"}
    
    def _create_post_xmlrpc(self, title: str, content: str, status: str,
                           categories: List[str] = None, tags: List[str] = None) -> Tuple[bool, Dict]:
        """XML-RPC를 통한 포스트 생성 (백업 방법)"""
        try:
            post = WordPressPost()
            post.title = title
            post.content = content
            post.post_status = status
            
            if categories:
                post.terms_names = {'category': categories}
            if tags:
                post.terms_names = post.terms_names or {}
                post.terms_names['post_tag'] = tags
            
            post_id = self.xmlrpc_client.call(posts.NewPost(post))
            
            return True, {
                "post_id": post_id,
                "method": "XML-RPC",
                "status": status,
                "created_at": datetime.now().isoformat()
            }
        except Exception as e:
            return False, {"error": f"XML-RPC post creation failed: {str(e)}"}
    
    def _get_or_create_categories(self, category_names: List[str]) -> List[int]:
        """카테고리 조회 또는 생성"""
        category_ids = []
        
        try:
            # 기존 카테고리 조회
            headers = self.get_auth_headers()
            response = requests.get(
                f"{self.rest_api_base}/categories",
                headers=headers,
                params={'per_page': 100},
                timeout=30
            )
            
            if response.status_code == 200:
                existing_categories = response.json()
                existing_names = {cat['name'].lower(): cat['id'] for cat in existing_categories}
                
                for category_name in category_names:
                    if category_name.lower() in existing_names:
                        category_ids.append(existing_names[category_name.lower()])
                    else:
                        # 새 카테고리 생성
                        new_cat_data = {'name': category_name}
                        create_response = requests.post(
                            f"{self.rest_api_base}/categories",
                            headers=headers,
                            json=new_cat_data,
                            timeout=30
                        )
                        if create_response.status_code == 201:
                            new_category = create_response.json()
                            category_ids.append(new_category['id'])
        except Exception as e:
            print(f"카테고리 처리 중 오류: {e}")
        
        return category_ids
    
    def _get_or_create_tags(self, tag_names: List[str]) -> List[int]:
        """태그 조회 또는 생성"""
        tag_ids = []
        
        try:
            # 기존 태그 조회
            headers = self.get_auth_headers()
            response = requests.get(
                f"{self.rest_api_base}/tags",
                headers=headers,
                params={'per_page': 100},
                timeout=30
            )
            
            if response.status_code == 200:
                existing_tags = response.json()
                existing_names = {tag['name'].lower(): tag['id'] for tag in existing_tags}
                
                for tag_name in tag_names:
                    if tag_name.lower() in existing_names:
                        tag_ids.append(existing_names[tag_name.lower()])
                    else:
                        # 새 태그 생성
                        new_tag_data = {'name': tag_name}
                        create_response = requests.post(
                            f"{self.rest_api_base}/tags",
                            headers=headers,
                            json=new_tag_data,
                            timeout=30
                        )
                        if create_response.status_code == 201:
                            new_tag = create_response.json()
                            tag_ids.append(new_tag['id'])
        except Exception as e:
            print(f"태그 처리 중 오류: {e}")
        
        return tag_ids
    
    def _set_featured_image(self, post_id: int, image_url: str) -> bool:
        """대표 이미지 설정"""
        try:
            # 이미지 업로드
            media_id = self._upload_image_from_url(image_url)
            if media_id:
                # 포스트에 대표 이미지 설정
                headers = self.get_auth_headers()
                update_data = {'featured_media': media_id}
                response = requests.post(
                    f"{self.rest_api_base}/posts/{post_id}",
                    headers=headers,
                    json=update_data,
                    timeout=30
                )
                return response.status_code == 200
        except Exception as e:
            print(f"대표 이미지 설정 중 오류: {e}")
        
        return False
    
    def _upload_image_from_url(self, image_url: str) -> Optional[int]:
        """URL에서 이미지 다운로드 후 워드프레스에 업로드"""
        try:
            # 이미지 다운로드
            img_response = requests.get(image_url, timeout=30)
            if img_response.status_code != 200:
                return None
            
            # 파일명 추출
            filename = image_url.split('/')[-1]
            if '.' not in filename:
                filename += '.jpg'
            
            # 워드프레스에 업로드
            headers = self.get_auth_headers()
            headers['Content-Disposition'] = f'attachment; filename="{filename}"'
            headers['Content-Type'] = img_response.headers.get('content-type', 'image/jpeg')
            
            upload_response = requests.post(
                f"{self.rest_api_base}/media",
                headers=headers,
                data=img_response.content,
                timeout=60
            )
            
            if upload_response.status_code == 201:
                media_data = upload_response.json()
                return media_data['id']
        except Exception as e:
            print(f"이미지 업로드 중 오류: {e}")
        
        return None
    
    def get_posts(self, limit: int = 10, status: str = 'any') -> Tuple[bool, List[Dict]]:
        """포스트 목록 조회"""
        try:
            headers = self.get_auth_headers()
            params = {
                'per_page': limit,
                'status': status,
                'orderby': 'date',
                'order': 'desc'
            }
            
            response = requests.get(
                f"{self.rest_api_base}/posts",
                headers=headers,
                params=params,
                timeout=30
            )
            
            if response.status_code == 200:
                posts = response.json()
                formatted_posts = []
                
                for post in posts:
                    formatted_posts.append({
                        'id': post['id'],
                        'title': post['title']['rendered'],
                        'content': post['content']['rendered'][:200] + '...',
                        'status': post['status'],
                        'date': post['date'],
                        'url': post['link'],
                        'author': post['author']
                    })
                
                return True, formatted_posts
            else:
                return False, []
        except Exception as e:
            return False, []
    
    def update_post(self, post_id: int, title: str = None, content: str = None,
                   status: str = None) -> Tuple[bool, Dict]:
        """포스트 업데이트"""
        try:
            update_data = {}
            if title:
                update_data['title'] = title
            if content:
                update_data['content'] = content
            if status:
                update_data['status'] = status
            
            if not update_data:
                return False, {"error": "No data to update"}
            
            headers = self.get_auth_headers()
            response = requests.post(
                f"{self.rest_api_base}/posts/{post_id}",
                headers=headers,
                json=update_data,
                timeout=30
            )
            
            if response.status_code == 200:
                updated_post = response.json()
                return True, {
                    "post_id": updated_post['id'],
                    "title": updated_post['title']['rendered'],
                    "status": updated_post['status'],
                    "updated_at": updated_post['modified']
                }
            else:
                return False, {
                    "error": f"Update failed: {response.status_code}",
                    "message": response.text
                }
        except Exception as e:
            return False, {"error": f"Update failed: {str(e)}"}
    
    def delete_post(self, post_id: int, force: bool = False) -> Tuple[bool, Dict]:
        """포스트 삭제"""
        try:
            headers = self.get_auth_headers()
            params = {'force': force}
            
            response = requests.delete(
                f"{self.rest_api_base}/posts/{post_id}",
                headers=headers,
                params=params,
                timeout=30
            )
            
            if response.status_code == 200:
                return True, {"message": "Post deleted successfully"}
            else:
                return False, {
                    "error": f"Delete failed: {response.status_code}",
                    "message": response.text
                }
        except Exception as e:
            return False, {"error": f"Delete failed: {str(e)}"}
    
    def schedule_post(self, title: str, content: str, publish_date: datetime,
                     categories: List[str] = None, tags: List[str] = None) -> Tuple[bool, Dict]:
        """포스트 예약 발행"""
        try:
            # 미래 날짜인지 확인
            if publish_date <= datetime.now():
                return False, {"error": "Publish date must be in the future"}
            
            # 포스트 생성 (상태를 'future'로 설정)
            post_data = {
                'title': title,
                'content': content,
                'status': 'future',
                'date': publish_date.isoformat()
            }
            
            # 카테고리 및 태그 처리
            if categories:
                category_ids = self._get_or_create_categories(categories)
                if category_ids:
                    post_data['categories'] = category_ids
            
            if tags:
                tag_ids = self._get_or_create_tags(tags)
                if tag_ids:
                    post_data['tags'] = tag_ids
            
            headers = self.get_auth_headers()
            response = requests.post(
                f"{self.rest_api_base}/posts",
                headers=headers,
                json=post_data,
                timeout=60
            )
            
            if response.status_code == 201:
                post_result = response.json()
                return True, {
                    "post_id": post_result['id'],
                    "scheduled_date": post_result['date'],
                    "status": post_result['status'],
                    "title": post_result['title']['rendered']
                }
            else:
                return False, {
                    "error": f"Scheduling failed: {response.status_code}",
                    "message": response.text
                }
        except Exception as e:
            return False, {"error": f"Scheduling failed: {str(e)}"}

class WordPressSiteManager:
    """워드프레스 사이트 관리 클래스"""
    
    def __init__(self):
        self.sites = {}  # 실제로는 데이터베이스에 저장
    
    def add_site(self, user_id: int, site_data: Dict) -> Tuple[bool, Dict]:
        """사이트 추가"""
        try:
            connector = AdvancedWordPressConnector(
                site_data['url'],
                site_data['username'],
                site_data['password']
            )
            
            # 연결 테스트
            success, result = connector.test_connection()
            if not success:
                return False, result
            
            # 사이트 정보 저장
            site_id = f"{user_id}_{len(self.sites) + 1}"
            self.sites[site_id] = {
                'id': site_id,
                'user_id': user_id,
                'name': site_data.get('name', result.get('site_info', {}).get('name', 'Unknown')),
                'url': site_data['url'],
                'username': site_data['username'],
                'password': site_data['password'],  # 실제로는 암호화 저장
                'is_active': True,
                'connection_info': result,
                'created_at': datetime.now().isoformat(),
                'last_tested': datetime.now().isoformat()
            }
            
            return True, self.sites[site_id]
        except Exception as e:
            return False, {"error": f"Site addition failed: {str(e)}"}
    
    def get_user_sites(self, user_id: int) -> List[Dict]:
        """사용자 사이트 목록 조회"""
        user_sites = []
        for site_id, site_data in self.sites.items():
            if site_data['user_id'] == user_id:
                # 비밀번호 제외하고 반환
                safe_site_data = {k: v for k, v in site_data.items() if k != 'password'}
                user_sites.append(safe_site_data)
        return user_sites
    
    def get_site_connector(self, site_id: str) -> Optional[AdvancedWordPressConnector]:
        """사이트 커넥터 조회"""
        if site_id in self.sites:
            site_data = self.sites[site_id]
            return AdvancedWordPressConnector(
                site_data['url'],
                site_data['username'],
                site_data['password']
            )
        return None
    
    def test_site_connection(self, site_id: str) -> Tuple[bool, Dict]:
        """사이트 연결 테스트"""
        connector = self.get_site_connector(site_id)
        if connector:
            success, result = connector.test_connection()
            # 테스트 결과 업데이트
            if site_id in self.sites:
                self.sites[site_id]['last_tested'] = datetime.now().isoformat()
                self.sites[site_id]['last_test_result'] = result
            return success, result
        return False, {"error": "Site not found"}
    
    def remove_site(self, site_id: str, user_id: int) -> bool:
        """사이트 제거"""
        if site_id in self.sites and self.sites[site_id]['user_id'] == user_id:
            del self.sites[site_id]
            return True
        return False

