from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import models, schemas
from database import get_db
from routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/work", tags=["Work Planner"])

class TaskUpdate(BaseModel):
    status: str

@router.post("/", response_model=schemas.WorkTaskResponse)
def create_work_task(task: schemas.WorkTaskCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    db_task = models.WorkTask(**task.model_dump(), user_id=user.id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.get("/", response_model=List[schemas.WorkTaskResponse])
def get_work_tasks(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.WorkTask).filter(models.WorkTask.user_id == user.id).order_by(models.WorkTask.deadline.asc()).all()

@router.put("/{task_id}")
def update_task_status(task_id: UUID, update: TaskUpdate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    task = db.query(models.WorkTask).filter(models.WorkTask.id == task_id, models.WorkTask.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    old_status = task.status
    task.status = update.status
    
    xp_gained = 0
    level_up = False
    
    if update.status == "Completed" and old_status != "Completed":
        xp_gained = 50
        user.xp = (user.xp or 0) + xp_gained
        # Each level requires Level * 100 XP (so Lvl 1 requires 100, Lvl 2 requires 200, etc.)
        req_xp = user.level * 100
        if user.xp >= req_xp:
            user.xp -= req_xp
            user.level = (user.level or 1) + 1
            level_up = True
            
    db.commit()
    return {
        "status": "success",
        "xp_gained": xp_gained,
        "level_up": level_up,
        "current_xp": user.xp,
        "current_level": user.level
    }
