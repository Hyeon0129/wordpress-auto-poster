import requests
import base64
import json
from typing import Dict, List, Optional
from fastapi import HTTPException
from pydantic import BaseModel

class WordPressConfig(BaseModel):
    name: str
    url: str
    username: str
    password: str  # 실제 WordPress 비밀번호 또는 애플리케이션 비밀번호
    is_active: bool = True

class WordPressPost(BaseModel):
    title: str
    content: str
    status: str = "draft"  # draft, publish, private
    categories: List[str] = []
    tags: List[str] = []

class WordPressService:
    def __init__(self):
        self.configs: Dict[str, WordPressConfig] = {}
        self.load_configs()
    
    def load_configs(self):
        """저장된 WordPress 설정 로드"""
        try:
            if os.path.exists("data/wordpress_configs.json"):
                with open("data/wordpress_configs.json", "r", encoding="utf-8") as f:
                    configs_data = json.load(f)
                
                for config_id, config_data in configs_data.items():
                    self.configs[config_id] = WordPressConfig(**config_data)
        except Exception as e:
            print(f"WordPress 설정 로드 실패: {str(e)}")
    
    def save_configs(self):
        """WordPress 설정 저장"""
        try:
            configs_data = {}
            for config_id, config in self.configs.items():
                configs_data[config_id] = config.dict()
            
            os.makedirs("data", exist_ok=True)
            with open("data/wordpress_configs.json", "w", encoding="utf-8") as f:
                json.dump(configs_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"WordPress 설정 저장 실패: {str(e)}")
    
    def add_wordpress_site(self, config: WordPressConfig) -> Dict:
        """새로운 WordPress 사이트 추가"""
        try:
            # 연결 테스트
            if not self.test_connection(config):
                raise HTTPException(status_code=400, detail="WordPress 사이트에 연결할 수 없습니다.")
            
            # 설정 저장
            config_id = f"wp_{len(self.configs)}"
            self.configs[config_id] = config
            self.save_configs()
            
            return {
                "success": True,
                "message": "WordPress 사이트가 성공적으로 추가되었습니다.",
                "config_id": config_id
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"사이트 추가 실패: {str(e)}")
    
    def test_connection(self, config: WordPressConfig) -> bool:
        """WordPress 연결 테스트"""
        try:
            # URL 정규화
            base_url = config.url.rstrip('/')
            if not base_url.startswith(('http://', 'https://')):
                base_url = 'https://' + base_url
            
            # REST API 엔드포인트
            api_url = f"{base_url}/wp-json/wp/v2/users/me"
            
            # 인증 헤더 생성 (Basic Auth)
            credentials = f"{config.username}:{config.password}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                "Authorization": f"Basic {encoded_credentials}",
                "Content-Type": "application/json"
            }
            
            # API 호출
            response = requests.get(api_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                user_data = response.json()
                print(f"WordPress 연결 성공: {user_data.get('name', 'Unknown')}")
                return True
            else:
                print(f"WordPress 연결 실패: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"WordPress 연결 오류: {str(e)}")
            return False
        except Exception as e:
            print(f"WordPress 연결 테스트 실패: {str(e)}")
            return False
    
    def create_post(self, config_id: str, post: WordPressPost) -> Dict:
        """WordPress에 포스트 생성"""
        try:
            if config_id not in self.configs:
                raise HTTPException(status_code=404, detail="WordPress 설정을 찾을 수 없습니다.")
            
            config = self.configs[config_id]
            
            # URL 정규화
            base_url = config.url.rstrip('/')
            if not base_url.startswith(('http://', 'https://')):
                base_url = 'https://' + base_url
            
            # REST API 엔드포인트
            api_url = f"{base_url}/wp-json/wp/v2/posts"
            
            # 인증 헤더 생성
            credentials = f"{config.username}:{config.password}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                "Authorization": f"Basic {encoded_credentials}",
                "Content-Type": "application/json"
            }
            
            # 포스트 데이터 준비
            post_data = {
                "title": post.title,
                "content": post.content,
                "status": post.status,
                "tags": post.tags
            }
            
            # 카테고리 처리 (필요시 카테고리 ID 조회)
            if post.categories:
                category_ids = self.get_category_ids(config, post.categories)
                if category_ids:
                    post_data["categories"] = category_ids
            
            # API 호출
            response = requests.post(api_url, headers=headers, json=post_data, timeout=30)
            
            if response.status_code == 201:
                post_data = response.json()
                return {
                    "success": True,
                    "message": "포스트가 성공적으로 생성되었습니다.",
                    "post_id": post_data.get("id"),
                    "post_url": post_data.get("link"),
                    "status": post_data.get("status")
                }
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"포스트 생성 실패: {response.text}"
                )
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"포스트 생성 실패: {str(e)}")
    
    def get_category_ids(self, config: WordPressConfig, category_names: List[str]) -> List[int]:
        """카테고리 이름으로 카테고리 ID 조회"""
        try:
            base_url = config.url.rstrip('/')
            if not base_url.startswith(('http://', 'https://')):
                base_url = 'https://' + base_url
            
            api_url = f"{base_url}/wp-json/wp/v2/categories"
            
            credentials = f"{config.username}:{config.password}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                "Authorization": f"Basic {encoded_credentials}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(api_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                categories = response.json()
                category_ids = []
                
                for category_name in category_names:
                    for category in categories:
                        if category.get("name", "").lower() == category_name.lower():
                            category_ids.append(category.get("id"))
                            break
                
                return category_ids
            
            return []
            
        except Exception as e:
            print(f"카테고리 ID 조회 실패: {str(e)}")
            return []
    
    def get_wordpress_sites(self) -> List[Dict]:
        """모든 WordPress 사이트 조회"""
        sites_list = []
        for config_id, config in self.configs.items():
            sites_list.append({
                "id": config_id,
                "name": config.name,
                "url": config.url,
                "username": config.username,
                "is_active": config.is_active
            })
        return sites_list
    
    def update_wordpress_site(self, config_id: str, config: WordPressConfig) -> Dict:
        """WordPress 사이트 설정 업데이트"""
        try:
            if config_id not in self.configs:
                raise HTTPException(status_code=404, detail="WordPress 설정을 찾을 수 없습니다.")
            
            # 연결 테스트
            if not self.test_connection(config):
                raise HTTPException(status_code=400, detail="WordPress 사이트에 연결할 수 없습니다.")
            
            self.configs[config_id] = config
            self.save_configs()
            
            return {
                "success": True,
                "message": "WordPress 사이트 설정이 성공적으로 업데이트되었습니다."
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"설정 업데이트 실패: {str(e)}")
    
    def delete_wordpress_site(self, config_id: str) -> Dict:
        """WordPress 사이트 삭제"""
        try:
            if config_id not in self.configs:
                raise HTTPException(status_code=404, detail="WordPress 설정을 찾을 수 없습니다.")
            
            del self.configs[config_id]
            self.save_configs()
            
            return {
                "success": True,
                "message": "WordPress 사이트가 성공적으로 삭제되었습니다."
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"사이트 삭제 실패: {str(e)}")

# 전역 WordPress 서비스 인스턴스
wordpress_service = WordPressService()

