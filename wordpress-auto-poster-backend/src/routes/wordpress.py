from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db, User
import requests
import json
import base64
from datetime import datetime, timedelta
import re

wordpress_bp = Blueprint('wordpress', __name__)

class WordPressConnector:
    """워드프레스 API 연결 클래스"""
    
    def __init__(self, site_url, username, password):
        self.site_url = site_url.rstrip('/')
        self.username = username
        self.password = password
        self.jwt_token = None
        self.token_expires_at = None
    
    def get_jwt_token(self):
        """JWT 토큰 획득"""
        try:
            # JWT 플러그인이 설치되어 있다고 가정
            auth_url = f"{self.site_url}/wp-json/jwt-auth/v1/token"
            
            auth_data = {
                'username': self.username,
                'password': self.password
            }
            
            response = requests.post(auth_url, json=auth_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get('token')
                # 토큰 만료 시간 설정 (24시간)
                self.token_expires_at = datetime.now() + timedelta(hours=24)
                return True, "JWT 토큰 획득 성공"
            else:
                return False, f"JWT 토큰 획득 실패: {response.text}"
                
        except Exception as e:
            return False, f"JWT 토큰 획득 중 오류: {str(e)}"
    
    def get_auth_headers(self):
        """인증 헤더 반환"""
        if self.jwt_token and self.token_expires_at and datetime.now() < self.token_expires_at:
            return {'Authorization': f'Bearer {self.jwt_token}'}
        else:
            # Basic Auth 사용
            credentials = base64.b64encode(f"{self.username}:{self.password}".encode()).decode()
            return {'Authorization': f'Basic {credentials}'}
    
    def test_connection(self):
        """연결 테스트"""
        try:
            # 먼저 JWT 토큰 시도
            jwt_success, jwt_message = self.get_jwt_token()
            
            # 사이트 정보 조회로 연결 테스트
            url = f"{self.site_url}/wp-json/wp/v2/users/me"
            headers = self.get_auth_headers()
            headers['Content-Type'] = 'application/json'
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                user_data = response.json()
                return True, {
                    'message': '연결 성공',
                    'jwt_available': jwt_success,
                    'user_info': {
                        'id': user_data.get('id'),
                        'name': user_data.get('name'),
                        'email': user_data.get('email'),
                        'roles': user_data.get('roles', [])
                    }
                }
            else:
                return False, f"연결 실패: {response.status_code} - {response.text}"
                
        except Exception as e:
            return False, f"연결 테스트 중 오류: {str(e)}"
    
    def get_categories(self):
        """카테고리 목록 조회"""
        try:
            url = f"{self.site_url}/wp-json/wp/v2/categories"
            headers = self.get_auth_headers()
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                categories = response.json()
                return True, categories
            else:
                return False, f"카테고리 조회 실패: {response.text}"
                
        except Exception as e:
            return False, f"카테고리 조회 중 오류: {str(e)}"
    
    def get_tags(self):
        """태그 목록 조회"""
        try:
            url = f"{self.site_url}/wp-json/wp/v2/tags"
            headers = self.get_auth_headers()
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                tags = response.json()
                return True, tags
            else:
                return False, f"태그 조회 실패: {response.text}"
                
        except Exception as e:
            return False, f"태그 조회 중 오류: {str(e)}"
    
    def create_post(self, post_data):
        """포스트 생성"""
        try:
            url = f"{self.site_url}/wp-json/wp/v2/posts"
            headers = self.get_auth_headers()
            headers['Content-Type'] = 'application/json'
            
            response = requests.post(url, json=post_data, headers=headers, timeout=60)
            
            if response.status_code == 201:
                post = response.json()
                return True, post
            else:
                return False, f"포스트 생성 실패: {response.status_code} - {response.text}"
                
        except Exception as e:
            return False, f"포스트 생성 중 오류: {str(e)}"
    
    def update_post(self, post_id, post_data):
        """포스트 업데이트"""
        try:
            url = f"{self.site_url}/wp-json/wp/v2/posts/{post_id}"
            headers = self.get_auth_headers()
            headers['Content-Type'] = 'application/json'
            
            response = requests.post(url, json=post_data, headers=headers, timeout=60)
            
            if response.status_code == 200:
                post = response.json()
                return True, post
            else:
                return False, f"포스트 업데이트 실패: {response.status_code} - {response.text}"
                
        except Exception as e:
            return False, f"포스트 업데이트 중 오류: {str(e)}"

@wordpress_bp.route('/sites', methods=['GET'])
@jwt_required()
def get_wordpress_sites():
    """사용자의 워드프레스 사이트 목록 조회"""
    try:
        current_user_id = get_jwt_identity()
        
        # 실제로는 데이터베이스에서 조회해야 하지만, 
        # 현재는 간단한 예시 데이터 반환
        sites = [
            {
                'id': 1,
                'name': '내 블로그',
                'url': 'https://myblog.com',
                'username': 'admin',
                'is_active': True,
                'last_connected': '2024-06-20T10:30:00Z'
            }
        ]
        
        return jsonify({'sites': sites}), 200
        
    except Exception as e:
        return jsonify({'error': f'사이트 목록 조회 중 오류: {str(e)}'}), 500

@wordpress_bp.route('/sites', methods=['POST'])
@jwt_required()
def add_wordpress_site():
    """워드프레스 사이트 추가"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        site_name = data.get('name', '').strip()
        site_url = data.get('url', '').strip()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not all([site_name, site_url, username, password]):
            return jsonify({'error': '모든 필드를 입력해주세요.'}), 400
        
        # URL 형식 검증
        if not re.match(r'^https?://', site_url):
            site_url = 'https://' + site_url
        
        # 연결 테스트
        wp_connector = WordPressConnector(site_url, username, password)
        success, result = wp_connector.test_connection()
        
        if not success:
            return jsonify({'error': f'워드프레스 연결 실패: {result}'}), 400
        
        # 실제로는 데이터베이스에 저장해야 함
        site_data = {
            'id': 2,  # 새로 생성된 ID
            'name': site_name,
            'url': site_url,
            'username': username,
            'is_active': True,
            'connection_test': result,
            'created_at': datetime.now().isoformat()
        }
        
        return jsonify({
            'message': '워드프레스 사이트가 성공적으로 추가되었습니다.',
            'site': site_data
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'사이트 추가 중 오류: {str(e)}'}), 500

@wordpress_bp.route('/sites/<int:site_id>/test-connection', methods=['POST'])
@jwt_required()
def test_wordpress_connection(site_id):
    """워드프레스 연결 테스트"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        site_url = data.get('url', '').strip()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not all([site_url, username, password]):
            return jsonify({'error': '사이트 URL, 사용자명, 비밀번호를 입력해주세요.'}), 400
        
        # URL 형식 검증
        if not re.match(r'^https?://', site_url):
            site_url = 'https://' + site_url
        
        wp_connector = WordPressConnector(site_url, username, password)
        success, result = wp_connector.test_connection()
        
        if success:
            return jsonify({
                'success': True,
                'message': '연결 성공',
                'connection_info': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result
            }), 400
            
    except Exception as e:
        return jsonify({'error': f'연결 테스트 중 오류: {str(e)}'}), 500

@wordpress_bp.route('/sites/<int:site_id>/categories', methods=['GET'])
@jwt_required()
def get_wordpress_categories(site_id):
    """워드프레스 카테고리 목록 조회"""
    try:
        current_user_id = get_jwt_identity()
        
        # 실제로는 데이터베이스에서 사이트 정보를 조회해야 함
        # 여기서는 예시 데이터 사용
        site_url = "https://example.com"
        username = "admin"
        password = "password"
        
        wp_connector = WordPressConnector(site_url, username, password)
        success, categories = wp_connector.get_categories()
        
        if success:
            return jsonify({'categories': categories}), 200
        else:
            return jsonify({'error': categories}), 400
            
    except Exception as e:
        return jsonify({'error': f'카테고리 조회 중 오류: {str(e)}'}), 500

@wordpress_bp.route('/sites/<int:site_id>/tags', methods=['GET'])
@jwt_required()
def get_wordpress_tags(site_id):
    """워드프레스 태그 목록 조회"""
    try:
        current_user_id = get_jwt_identity()
        
        # 실제로는 데이터베이스에서 사이트 정보를 조회해야 함
        # 여기서는 예시 데이터 사용
        site_url = "https://example.com"
        username = "admin"
        password = "password"
        
        wp_connector = WordPressConnector(site_url, username, password)
        success, tags = wp_connector.get_tags()
        
        if success:
            return jsonify({'tags': tags}), 200
        else:
            return jsonify({'error': tags}), 400
            
    except Exception as e:
        return jsonify({'error': f'태그 조회 중 오류: {str(e)}'}), 500

@wordpress_bp.route('/sites/<int:site_id>/posts', methods=['POST'])
@jwt_required()
def create_wordpress_post(site_id):
    """워드프레스 포스트 생성"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        title = data.get('title', '').strip()
        content = data.get('content', '').strip()
        excerpt = data.get('excerpt', '').strip()
        status = data.get('status', 'draft')  # draft, publish
        categories = data.get('categories', [])
        tags = data.get('tags', [])
        featured_media = data.get('featured_media')
        
        if not title or not content:
            return jsonify({'error': '제목과 내용을 입력해주세요.'}), 400
        
        # 실제로는 데이터베이스에서 사이트 정보를 조회해야 함
        site_url = "https://example.com"
        username = "admin"
        password = "password"
        
        wp_connector = WordPressConnector(site_url, username, password)
        
        post_data = {
            'title': title,
            'content': content,
            'excerpt': excerpt,
            'status': status,
            'categories': categories,
            'tags': tags
        }
        
        if featured_media:
            post_data['featured_media'] = featured_media
        
        success, result = wp_connector.create_post(post_data)
        
        if success:
            return jsonify({
                'message': '포스트가 성공적으로 생성되었습니다.',
                'post': result
            }), 201
        else:
            return jsonify({'error': result}), 400
            
    except Exception as e:
        return jsonify({'error': f'포스트 생성 중 오류: {str(e)}'}), 500

