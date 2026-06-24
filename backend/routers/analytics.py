from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
from routers.auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])

@router.get("/dashboard")
def get_dashboard_data(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Productivity & Tasks
    total_tasks = db.query(models.WorkTask).filter_by(user_id=user.id).count()
    completed_tasks = db.query(models.WorkTask).filter(
        models.WorkTask.user_id == user.id, 
        models.WorkTask.status == "Completed"
    ).count()
    
    prod_score = 0
    if total_tasks > 0:
        prod_score = int((completed_tasks / total_tasks) * 100)

    # 2. Savings
    savings_total = sum([s.current_amount for s in db.query(models.SavingsGoal).filter_by(user_id=user.id).all()])

    # 3. Events Today
    today = datetime.utcnow().date()
    events_count = 0
    # Simple check for demo purposes
    for event in db.query(models.CalendarEvent).filter_by(user_id=user.id).all():
        if event.start_time and event.start_time.date() == today:
            events_count += 1

    # 4. Remaining Tasks & Reminders
    remaining = db.query(models.WorkTask).filter(
        models.WorkTask.user_id == user.id, 
        models.WorkTask.status != "Completed"
    ).all()
    
    remaining_list = []
    for r in remaining:
        due = r.deadline.strftime("%b %d") if r.deadline else "No date"
        remaining_list.append({
            "title": r.task_name,
            "category": r.project_name or "General",
            "due": due
        })

    reminders = db.query(models.Reminder).filter(models.Reminder.user_id == user.id).all()
    for rm in reminders:
        due = rm.due_date.strftime("%b %d") if rm.due_date else "No date"
        remaining_list.append({
            "title": rm.title,
            "category": "Reminder",
            "due": due
        })

    # 5. Expense Chart Data (Mock trend for now, but uses actual DB total to scale)
    expenses = db.query(models.Expense).filter_by(user_id=user.id).all()
    expense_total = sum([e.amount for e in expenses])
    # Give a simple flatline if empty, or a dynamic scale if they have expenses
    chart_data = [20, 30, 25, 45, 30, 50, 40] if expense_total == 0 else [expense_total*0.1, expense_total*0.3, expense_total*0.2, expense_total*0.4]

    return {
        "productivity_score": f"{prod_score}%",
        "tasks_completed": f"{completed_tasks}/{total_tasks}",
        "monthly_savings": f"${savings_total:,.0f}",
        "upcoming_events": f"{events_count} Today",
        "remaining_tasks": remaining_list,
        "chart_data": chart_data,
        "xp": user.xp or 0,
        "level": user.level or 1
    }

@router.get("/summary")
def get_analytics_summary(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    reminders_count = db.query(models.Reminder).filter_by(user_id=user.id).count()
    expenses_total = sum([e.amount for e in db.query(models.Expense).filter_by(user_id=user.id).all()])
    savings_total = sum([s.current_amount for s in db.query(models.SavingsGoal).filter_by(user_id=user.id).all()])
    study_time = sum([s.duration_minutes for s in db.query(models.StudySession).filter_by(user_id=user.id).all()])
    work_tasks = db.query(models.WorkTask).filter_by(user_id=user.id).count()
    goals_count = db.query(models.Goal).filter_by(user_id=user.id).count()
    notes_count = db.query(models.Note).filter_by(user_id=user.id).count()

    return {
        "reminders_count": reminders_count,
        "expenses_total": expenses_total,
        "savings_total": savings_total,
        "study_time_minutes": study_time,
        "work_tasks_count": work_tasks,
        "goals_count": goals_count,
        "notes_count": notes_count,
    }
