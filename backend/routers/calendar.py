from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import models, schemas
from database import get_db
from routers.auth import get_current_user

router = APIRouter(prefix="/api/v1/calendar", tags=["Calendar"])


@router.post("/", response_model=schemas.CalendarEventResponse)
def create_event(event: schemas.CalendarEventCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    db_event = models.CalendarEvent(**event.model_dump(), user_id=user.id)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.get("/", response_model=List[schemas.CalendarEventResponse])
def get_events(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.CalendarEvent).filter(models.CalendarEvent.user_id == user.id).all()
