from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'server'))
from src.main import app

client = TestClient(app)

def test_register_and_login():
    res = client.post('/api/auth/register', json={'username': 'user1', 'email': 'user1@example.com', 'password': 'Password1'})
    assert res.status_code == 200
    token = res.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    me = client.get('/api/auth/me', headers=headers)
    assert me.status_code == 200
