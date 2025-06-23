from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import requests
import base64
from datetime import datetime, timedelta
import re

from src.db import get_db
from src.models.user import User
from src.utils.dependencies import get_current_user

router = APIRouter()

class WordPressConnector:
    def __init__(self, site_url, username, password):
        self.site_url = site_url.rstrip('/')
        self.username = username
        self.password = password
        self.jwt_token = None
        self.token_expires_at = None

    def get_jwt_token(self):
        try:
            auth_url = f"{self.site_url}/wp-json/jwt-auth/v1/token"
            auth_data = {'username': self.username, 'password': self.password}
            response = requests.post(auth_url, json=auth_data, timeout=30)
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get('token')
                self.token_expires_at = datetime.now() + timedelta(hours=24)
                return True, "JWT token acquired"
            return False, f"Token error: {response.text}"
        except Exception as e:
            return False, str(e)

    def get_auth_headers(self):
        if self.jwt_token and self.token_expires_at and datetime.now() < self.token_expires_at:
            return {'Authorization': f'Bearer {self.jwt_token}'}
        credentials = base64.b64encode(f"{self.username}:{self.password}".encode()).decode()
        return {'Authorization': f'Basic {credentials}'}

    def test_connection(self):
        try:
            self.get_jwt_token()
            url = f"{self.site_url}/wp-json/wp/v2/users/me"
            headers = self.get_auth_headers()
            headers['Content-Type'] = 'application/json'
            response = requests.get(url, headers=headers, timeout=30)
            if response.status_code == 200:
                return True, response.json()
            return False, response.text
        except Exception as e:
            return False, str(e)

@router.get('/sites')
def get_wordpress_sites(user: User = Depends(get_current_user)):
    sites = [{
        'id': 1,
        'name': 'My Blog',
        'url': 'https://example.com',
        'username': 'admin',
        'is_active': True,
        'last_connected': '2024-06-20T10:30:00Z'
    }]
    return {'sites': sites}

@router.post('/sites')
def add_wordpress_site(data: dict, user: User = Depends(get_current_user)):
    site_url = data.get('url', '').strip()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    if not all([site_url, username, password]):
        raise HTTPException(status_code=400, detail='Missing fields')
    if not re.match(r'^https?://', site_url):
        site_url = 'https://' + site_url
    connector = WordPressConnector(site_url, username, password)
    success, result = connector.test_connection()
    if not success:
        raise HTTPException(status_code=400, detail=f'Connection failed: {result}')
    site_data = {
        'id': 2,
        'name': data.get('name', ''),
        'url': site_url,
        'username': username,
        'is_active': True,
        'connection_test': result,
        'created_at': datetime.now().isoformat()
    }
    return {'message': 'Site added', 'site': site_data}
