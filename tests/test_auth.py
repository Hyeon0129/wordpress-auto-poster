from fastapi.testclient import TestClient
import sys, os, tempfile
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'server'))
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.main import app
from src.db import Base, get_db


def setup_module(module):
    fd, path = tempfile.mkstemp()
    os.close(fd)
    engine = create_engine(
        f"sqlite:///{path}", connect_args={"check_same_thread": False}
    )
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=engine
    )
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    module.TEST_DB_PATH = path


def teardown_module(module):
    os.unlink(module.TEST_DB_PATH)

client = TestClient(app)

def test_register_and_login():
    res = client.post('/api/auth/register', json={'username': 'user1', 'email': 'user1@example.com', 'password': 'Password1'})
    assert res.status_code == 200
    token = res.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    me = client.get('/api/auth/me', headers=headers)
    assert me.status_code == 200
