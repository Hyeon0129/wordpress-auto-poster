from fastapi import Depends, HTTPException, Header
from jwt import PyJWTError
from sqlalchemy.orm import Session

from src.utils.jwt_utils import decode_token
from src.db import get_db
from src.models.user import User

async def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Not authenticated')
    token = authorization.split()[1]
    try:
        payload = decode_token(token)
    except PyJWTError:
        raise HTTPException(status_code=401, detail='Invalid token')
    user = db.get(User, int(payload['sub']))
    if user is None:
        raise HTTPException(status_code=401, detail='User not found')
    return user
