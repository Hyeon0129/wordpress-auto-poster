from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from werkzeug.security import check_password_hash, generate_password_hash
import re

from src.db import get_db
from src.models.user import User
from src.utils.jwt_utils import create_access_token
from src.utils.dependencies import get_current_user

router = APIRouter()

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

def validate_password(password: str):
    if len(password) < 8:
        return False, "Password must be at least 8 characters."
    if not re.search(r'[A-Za-z]', password):
        return False, "Password must contain letters."
    if not re.search(r'\d', password):
        return False, "Password must contain numbers."
    return True, "Valid password"

@router.post('/register')
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter((User.username == payload.username) | (User.email == payload.email)).first():
        raise HTTPException(status_code=409, detail="User already exists")

    is_valid, message = validate_password(payload.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)

    user = User(
        username=payload.username.strip(),
        email=payload.email.strip(),
        password_hash=generate_password_hash(payload.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(str(user.id))
    return {
        'message': 'Registered',
        'access_token': access_token,
        'user': user.to_dict()
    }

@router.post('/login')
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter((User.username == payload.username) | (User.email == payload.username)).first()
    if not user or not check_password_hash(user.password_hash, payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')
    access_token = create_access_token(str(user.id))
    return {
        'message': 'Login successful',
        'access_token': access_token,
        'user': user.to_dict()
    }

@router.get('/me')
def get_current_user_route(user: User = Depends(get_current_user)):
    return {'user': user.to_dict()}

@router.post('/change-password')
def change_password(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    if not check_password_hash(user.password_hash, current_password):
        raise HTTPException(status_code=401, detail='Current password incorrect')
    is_valid, message = validate_password(new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    user.password_hash = generate_password_hash(new_password)
    db.commit()
    return {'message': 'Password updated'}
