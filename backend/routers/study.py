from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import models, schemas
from database import get_db
from routers.auth import get_current_user

router = APIRouter(prefix="/api/v1/study", tags=["Study Planner"])


@router.post("/", response_model=schemas.StudySessionResponse)
def create_study_session(session: schemas.StudySessionCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    db_session = models.StudySession(**session.model_dump(), user_id=user.id)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/", response_model=List[schemas.StudySessionResponse])
def get_study_sessions(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.StudySession).filter(models.StudySession.user_id == user.id).all()
