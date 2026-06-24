from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import models, schemas
from database import get_db
from routers.auth import get_current_user

router = APIRouter(prefix="/api/v1/savings", tags=["Savings"])


@router.post("/", response_model=schemas.SavingsGoalResponse)
def create_savings_goal(goal: schemas.SavingsGoalCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    db_goal = models.SavingsGoal(**goal.model_dump(), user_id=user.id)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

@router.get("/", response_model=List[schemas.SavingsGoalResponse])
def get_savings_goals(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.SavingsGoal).filter(models.SavingsGoal.user_id == user.id).all()
