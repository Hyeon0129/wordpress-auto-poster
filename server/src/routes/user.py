from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from src.db import get_db
from src.models.user import User

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    email: str

class UserUpdate(BaseModel):
    username: str | None = None
    email: str | None = None

@router.get('/users')
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [u.to_dict() for u in users]

@router.post('/users', status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = User(username=payload.username, email=payload.email)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user.to_dict()

@router.get('/users/{user_id}')
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return user.to_dict()

@router.put('/users/{user_id}')
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    if payload.username is not None:
        user.username = payload.username
    if payload.email is not None:
        user.email = payload.email
    db.commit()
    return user.to_dict()

@router.delete('/users/{user_id}', status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    db.delete(user)
    db.commit()
    return None
