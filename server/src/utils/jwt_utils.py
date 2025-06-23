import os
from datetime import datetime, timedelta
import jwt

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-secret-string-wordpress-auto-poster")

def create_access_token(subject: str, expires_delta: timedelta | None = None):
    if expires_delta is None:
        expires_delta = timedelta(days=1)
    expire = datetime.utcnow() + expires_delta
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def decode_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
