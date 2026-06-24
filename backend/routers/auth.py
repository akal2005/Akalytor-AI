from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
import jwt
from datetime import datetime, timedelta, timezone
from database import get_db
import models

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])
security = HTTPBearer()

JWT_SECRET = os.environ.get("JWT_SECRET", "super_secret_neon_key_123")
JWT_ALGORITHM = "HS256"

class LoginRequest(BaseModel):
    username: str
    password: str

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    user = db.query(models.User).filter(models.User.name == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    admin_user = os.environ.get("ADMIN_USERNAME", "Akalya")
    admin_pass = os.environ.get("ADMIN_PASSWORD", "90807")

    if req.username != admin_user or req.password != admin_pass:
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    # Ensure user exists in DB for foreign key constraints
    user = db.query(models.User).filter(models.User.name == admin_user).first()
    if not user:
        user = models.User(
            email=os.environ.get("ADMIN_EMAIL", "akalya2005@gmail.com"), 
            name=admin_user,
            xp=0,
            level=1
        )
        db.add(user)
        db.commit()

    payload = {
        "sub": req.username,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {"access_token": token, "token_type": "bearer"}
