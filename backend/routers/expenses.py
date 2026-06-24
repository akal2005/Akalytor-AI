from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import models, schemas
from database import get_db
from routers.auth import get_current_user

router = APIRouter(prefix="/api/v1/expenses", tags=["Expenses"])


@router.post("/", response_model=schemas.ExpenseResponse)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    db_expense = models.Expense(**expense.model_dump(), user_id=user.id)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.get("/", response_model=List[schemas.ExpenseResponse])
def get_expenses(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.Expense).filter(models.Expense.user_id == user.id).all()
