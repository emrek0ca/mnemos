from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import hashlib
import json
from pathlib import Path
from core.config.settings import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

USER_DB_PATH = settings.ARTIFACTS_DIR / "users.json"

class User(BaseModel):
    username: str
    password: str

class UserSession(BaseModel):
    username: str
    token: str

def _load_users():
    if not USER_DB_PATH.exists():
        return {}
    with open(USER_DB_PATH, "r") as f:
        return json.load(f)

def _save_users(users):
    USER_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(USER_DB_PATH, "w") as f:
        json.dump(users, f)

@router.post("/register")
async def register(user: User):
    users = _load_users()
    if user.username in users:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_pw = hashlib.sha256(user.password.encode()).hexdigest()
    users[user.username] = {"password": hashed_pw}
    _save_users(users)
    return {"status": "success", "message": "User registered"}

@router.post("/login")
async def login(user: User):
    users = _load_users()
    if user.username not in users:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    hashed_pw = hashlib.sha256(user.password.encode()).hexdigest()
    if users[user.username]["password"] != hashed_pw:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Simple token generation for demo purposes
    token = hashlib.sha256(f"{user.username}-session".encode()).hexdigest()
    return {"status": "success", "token": token, "username": user.username}
