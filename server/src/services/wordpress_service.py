import requests
import base64
import json
from typing import Dict, List, Optional
from datetime import datetime
import re
from urllib.parse import urljoin, urlparse

class WordPressService:
    """WordPress 연동 서비스"""
    
    def __init__(self):
        # 간단한 메모리 기반 저장소 (실제 환경에서는 데이터베이스 사용)
        self.sites_store = {}
        self.user_sites = {}
    
    def add_site(self, user_id: int, name: str, url: str, username: str, password: str) -> Dict:
        """WordPress 사이트 추가"""
        
        # URL 정규화
        normalized_url = self._normalize_url(url)
        
        # 연결 테스트
        test_result = self.test_connection(normalized_url, username, password)
        if not test_result['success']:
            raise ValueError(f"WordPress 연결 실패: {test_result['message']}")
        
        # 사이트 정보 저장
        if user_id not in self.user_sites:
            self.user_sites[user_id] = []
        
        site_id = len(self.user_sites[user_id]) + 1
        site = {
            'id': site_id,
            'name': name,
            'url': normalized_url,
            'username': username,
            'password': password,
            'user_id': user_id,
            'is_active': True,
            'created_at': datetime.utcnow().isoformat(),
            'last_tested': datetime.utcnow().isoformat(),
            'status': 'connected',
            'user_info': test_result.get('user_info', {})
        }
        
        self.user_sites[user_id].append(site)
        return site
    
    def get_user_sites(self, user_id: int) -> List[Dict]:
        """사용자의 WordPress 사이트 목록 조회"""
        return self.user_sites.get(user_id, [])
    
    def get_site(self, user_id: int, site_id: int) -> Optional[Dict]:
        """특정 사이트 조회"""
        sites = self.get_user_sites(user_id)
        for site in sites:
            if site['id'] == site_id:
                return site
        return None
    
    def update_site(self, user_id: int, site_id: int, name: str, url: str, username: str, password: str) -> Dict:
        """WordPress 사이트 정보 수정"""
        site = self.get_site(user_id, site_id)
        if not site:
            raise ValueError("사이트를 찾을 수 없습니다.")
        
        # URL 정규화
        normalized_url = self._normalize_url(url)
        
        # 연결 테스트
        test_result = self.test_connection(normalized_url, username, password)
        if not test_result['success']:
            raise ValueError(f"WordPress 연결 실패: {test_result['message']}")
        
        # 사이트 정보 업데이트
        site.update({
            'name': name,
            'url': normalized_url,
            'username': username,
            'password': password,
            'last_tested': datetime.utcnow().isoformat(),
            'status': 'connected',
            'user_info': test_result.get('user_info', {}),
            'updated_at': datetime.utcnow().isoformat()
        })
        
        return site
    
    def delete_site(self, user_id: int, site_id: int):
        """WordPress 사이트 삭제"""
        if user_id not in self.user_sites:
            raise ValueError("사용자의 사이트를 찾을 수 없습니다.")
        
        self.user_sites[user_id] = [
            site for site in self.user_sites[user_id] 
            if site['id'] != site_id
        ]
    
    def test_connection(self, url: str, username: str, password: str) -> Dict:
        """WordPress 연결 테스트"""
        try:
            # REST API 엔드포인트 확인
            api_url = urljoin(url.rstrip('/') + '/', 'wp-json/wp/v2/users/me')
            
            # 인증 헤더 생성
            credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
            headers = {
                'Authorization': f'Basic {credentials}',
                'Content-Type': 'application/json',
                'User-Agent': 'WordPress Auto Poster/1.0'
            }
            
            # API 요청
            response = requests.get(api_url, headers=headers, timeout=15)
            
            if response.status_code == 200:
                user_data = response.json()
                return {
                    "success": True,
                    "message": "연결 성공",
                    "user_info": {
                        "id": user_data.get('id'),
                        "name": user_data.get('name'),
                        "email": user_data.get('email'),
                        "roles": user_data.get('roles', []),
                        "capabilities": user_data.get('capabilities', {})
                    }
                }
            elif response.status_code == 401:
                return {
                    "success": False,
                    "message": "인증 실패: 사용자명 또는 비밀번호가 올바르지 않습니다."
                }
            elif response.status_code == 403:
                return {
                    "success": False,
                    "message": "권한 부족: 해당 계정에 REST API 접근 권한이 없습니다."
                }
            elif response.status_code == 404:
                # REST API가 비활성화된 경우 XML-RPC 시도
                return self._test_xmlrpc_connection(url, username, password)
            else:
                return {
                    "success": False,
                    "message": f"연결 실패: HTTP {response.status_code} - {response.text[:100]}"
                }
                
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "message": "연결 시간 초과: 사이트 응답이 너무 느립니다."
            }
        except requests.exceptions.ConnectionError:
            return {
                "success": False,
                "message": "연결 오류: 사이트에 접근할 수 없습니다. URL을 확인해주세요."
            }
        except requests.exceptions.SSLError:
            return {
                "success": False,
                "message": "SSL 인증서 오류: HTTPS 설정을 확인해주세요."
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"알 수 없는 오류: {str(e)}"
            }
    
    def _test_xmlrpc_connection(self, url: str, username: str, password: str) -> Dict:
        """XML-RPC를 통한 연결 테스트"""
        try:
            from wordpress_xmlrpc import Client
            from wordpress_xmlrpc.methods.users import GetProfile
            
            xmlrpc_url = urljoin(url.rstrip('/') + '/', 'xmlrpc.php')
            client = Client(xmlrpc_url, username, password)
            
            # 사용자 프로필 조회로 연결 테스트
            profile = client.call(GetProfile())
            
            return {
                "success": True,
                "message": "XML-RPC 연결 성공",
                "user_info": {
                    "id": profile.user_id,
                    "name": profile.display_name,
                    "email": profile.email,
                    "roles": [profile.roles[0]] if profile.roles else []
                },
                "connection_type": "xmlrpc"
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"REST API와 XML-RPC 모두 사용할 수 없습니다: {str(e)}"
            }
    
    def create_post(self, user_id: int, site_id: int, title: str, content: str, 
                   status: str = 'draft', categories: List[str] = None, 
                   tags: List[str] = None, featured_image_url: str = None,
                   excerpt: str = None, meta_description: str = None) -> Dict:
        """WordPress 포스트 생성"""
        
        site = self.get_site(user_id, site_id)
        if not site:
            raise ValueError("사이트를 찾을 수 없습니다.")
        
        try:
            # REST API 시도
            return self._create_post_rest_api(site, title, content, status, 
                                            categories, tags, featured_image_url, 
                                            excerpt, meta_description)
        except Exception as rest_error:
            try:
                # XML-RPC 시도
                return self._create_post_xmlrpc(site, title, content, status, 
                                              categories, tags, featured_image_url, 
                                              excerpt)
            except Exception as xmlrpc_error:
                raise ValueError(f"포스트 생성 실패 - REST API: {rest_error}, XML-RPC: {xmlrpc_error}")
    
    def _create_post_rest_api(self, site: Dict, title: str, content: str, 
                             status: str, categories: List[str], tags: List[str],
                             featured_image_url: str, excerpt: str, 
                             meta_description: str) -> Dict:
        """REST API를 통한 포스트 생성"""
        
        api_url = urljoin(site['url'].rstrip('/') + '/', 'wp-json/wp/v2/posts')
        
        credentials = base64.b64encode(f"{site['username']}:{site['password']}".encode()).decode()
        headers = {
            'Authorization': f'Basic {credentials}',
            'Content-Type': 'application/json',
            'User-Agent': 'WordPress Auto Poster/1.0'
        }
        
        # 포스트 데이터 준비
        post_data = {
            'title': title,
            'content': content,
            'status': status,
            'excerpt': excerpt or '',
        }
        
        # 카테고리 처리
        if categories:
            category_ids = self._get_or_create_categories(site, categories)
            post_data['categories'] = category_ids
        
        # 태그 처리
        if tags:
            tag_ids = self._get_or_create_tags(site, tags)
            post_data['tags'] = tag_ids
        
        # 메타 설명 처리 (Yoast SEO 플러그인 지원)
        if meta_description:
            post_data['meta'] = {
                '_yoast_wpseo_metadesc': meta_description
            }
        
        response = requests.post(api_url, headers=headers, json=post_data, timeout=30)
        
        if response.status_code in [200, 201]:
            post_result = response.json()
            
            # 특성 이미지 설정
            if featured_image_url:
                self._set_featured_image(site, post_result['id'], featured_image_url)
            
            return {
                'id': post_result['id'],
                'title': post_result['title']['rendered'],
                'link': post_result['link'],
                'status': post_result['status'],
                'date': post_result['date']
            }
        else:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
            raise Exception(f"HTTP {response.status_code}: {error_data.get('message', response.text)}")
    
    def _create_post_xmlrpc(self, site: Dict, title: str, content: str, 
                           status: str, categories: List[str], tags: List[str],
                           featured_image_url: str, excerpt: str) -> Dict:
        """XML-RPC를 통한 포스트 생성"""
        
        from wordpress_xmlrpc import Client, WordPressPost
        from wordpress_xmlrpc.methods.posts import NewPost
        
        xmlrpc_url = urljoin(site['url'].rstrip('/') + '/', 'xmlrpc.php')
        client = Client(xmlrpc_url, site['username'], site['password'])
        
        post = WordPressPost()
        post.title = title
        post.content = content
        post.post_status = status
        post.excerpt = excerpt or ''
        
        if categories:
            post.terms_names = {'category': categories}
        
        if tags:
            post.terms_names = post.terms_names or {}
            post.terms_names['post_tag'] = tags
        
        post_id = client.call(NewPost(post))
        
        return {
            'id': post_id,
            'title': title,
            'link': f"{site['url']}/?p={post_id}",
            'status': status,
            'date': datetime.utcnow().isoformat()
        }
    
    def _get_or_create_categories(self, site: Dict, category_names: List[str]) -> List[int]:
        """카테고리 조회 또는 생성"""
        try:
            api_url = urljoin(site['url'].rstrip('/') + '/', 'wp-json/wp/v2/categories')
            credentials = base64.b64encode(f"{site['username']}:{site['password']}".encode()).decode()
            headers = {
                'Authorization': f'Basic {credentials}',
                'Content-Type': 'application/json'
            }
            
            category_ids = []
            
            for category_name in category_names:
                # 기존 카테고리 검색
                search_url = f"{api_url}?search={category_name}"
                response = requests.get(search_url, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    categories = response.json()
                    existing_category = next((cat for cat in categories if cat['name'].lower() == category_name.lower()), None)
                    
                    if existing_category:
                        category_ids.append(existing_category['id'])
                    else:
                        # 새 카테고리 생성
                        create_response = requests.post(api_url, headers=headers, json={'name': category_name}, timeout=10)
                        if create_response.status_code in [200, 201]:
                            new_category = create_response.json()
                            category_ids.append(new_category['id'])
            
            return category_ids
        except:
            return [1]  # 기본 카테고리 ID
    
    def _get_or_create_tags(self, site: Dict, tag_names: List[str]) -> List[int]:
        """태그 조회 또는 생성"""
        try:
            api_url = urljoin(site['url'].rstrip('/') + '/', 'wp-json/wp/v2/tags')
            credentials = base64.b64encode(f"{site['username']}:{site['password']}".encode()).decode()
            headers = {
                'Authorization': f'Basic {credentials}',
                'Content-Type': 'application/json'
            }
            
            tag_ids = []
            
            for tag_name in tag_names:
                # 기존 태그 검색
                search_url = f"{api_url}?search={tag_name}"
                response = requests.get(search_url, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    tags = response.json()
                    existing_tag = next((tag for tag in tags if tag['name'].lower() == tag_name.lower()), None)
                    
                    if existing_tag:
                        tag_ids.append(existing_tag['id'])
                    else:
                        # 새 태그 생성
                        create_response = requests.post(api_url, headers=headers, json={'name': tag_name}, timeout=10)
                        if create_response.status_code in [200, 201]:
                            new_tag = create_response.json()
                            tag_ids.append(new_tag['id'])
            
            return tag_ids
        except:
            return []
    
    def _set_featured_image(self, site: Dict, post_id: int, image_url: str):
        """특성 이미지 설정"""
        try:
            # 이미지 업로드 및 설정 로직
            # 실제 구현에서는 이미지를 다운로드하고 WordPress 미디어 라이브러리에 업로드
            pass
        except:
            pass
    
    def get_posts(self, user_id: int, site_id: int, limit: int = 10) -> List[Dict]:
        """WordPress 포스트 목록 조회"""
        site = self.get_site(user_id, site_id)
        if not site:
            raise ValueError("사이트를 찾을 수 없습니다.")
        
        try:
            api_url = urljoin(site['url'].rstrip('/') + '/', f'wp-json/wp/v2/posts?per_page={limit}')
            credentials = base64.b64encode(f"{site['username']}:{site['password']}".encode()).decode()
            headers = {
                'Authorization': f'Basic {credentials}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(api_url, headers=headers, timeout=15)
            
            if response.status_code == 200:
                posts = response.json()
                return [{
                    'id': post['id'],
                    'title': post['title']['rendered'],
                    'content': post['content']['rendered'][:200] + '...' if len(post['content']['rendered']) > 200 else post['content']['rendered'],
                    'status': post['status'],
                    'date': post['date'],
                    'link': post['link'],
                    'excerpt': post['excerpt']['rendered']
                } for post in posts]
            else:
                return []
        except Exception as e:
            return []
    
    def _normalize_url(self, url: str) -> str:
        """URL 정규화"""
        url = url.strip()
        
        # 프로토콜 추가
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # 마지막 슬래시 제거
        url = url.rstrip('/')
        
        # URL 유효성 검사
        parsed = urlparse(url)
        if not parsed.netloc:
            raise ValueError("유효하지 않은 URL입니다.")
        
        return url

