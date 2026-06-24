from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import models, schemas
from database import get_db
from routers.auth import get_current_user

router = APIRouter(prefix="/api/v1/reminders", tags=["Reminders"])

# Mock User ID for now until Clerk is fully verifying tokens on backend

@router.post("/", response_model=schemas.ReminderResponse)
def create_reminder(reminder: schemas.ReminderCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    db_reminder = models.Reminder(**reminder.model_dump(), user_id=user.id)
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@router.get("/", response_model=List[schemas.ReminderResponse])
def get_reminders(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.Reminder).filter(models.Reminder.user_id == user.id).all()
