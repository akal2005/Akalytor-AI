from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class ReminderBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    priority: Optional[str] = "Medium"
    is_recurring: Optional[bool] = False

class ReminderCreate(ReminderBase):
    pass

class ReminderResponse(ReminderBase):
    id: UUID
    user_id: UUID

    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    amount: float
    category: Optional[str] = "General"
    description: str
    date: Optional[datetime] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: UUID
    user_id: UUID

    class Config:
        from_attributes = True

class SavingsGoalBase(BaseModel):
    title: str
    target_amount: float
    current_amount: Optional[float] = 0.0
    deadline: datetime

class SavingsGoalCreate(SavingsGoalBase):
    pass

class SavingsGoalResponse(SavingsGoalBase):
    id: UUID
    user_id: UUID

    class Config:
        from_attributes = True

class NoteBase(BaseModel):
    title: str
    content: str
    tags: Optional[str] = ""

class NoteCreate(NoteBase):
    pass

class NoteResponse(NoteBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    qdrant_id: Optional[str] = None

    class Config:
        from_attributes = True

class StudySessionBase(BaseModel):
    subject: str
    topic: str
    duration_minutes: float
    date: Optional[datetime] = None

class StudySessionCreate(StudySessionBase):
    pass

class StudySessionResponse(StudySessionBase):
    id: UUID
    user_id: UUID

    class Config:
        from_attributes = True

class WorkTaskBase(BaseModel):
    project_name: str
    task_name: str
    deadline: datetime
    status: Optional[str] = "To Do"

class WorkTaskCreate(WorkTaskBase):
    pass

class WorkTaskResponse(WorkTaskBase):
    id: UUID
    user_id: UUID

    class Config:
        from_attributes = True

class GoalBase(BaseModel):
    title: str
    type: str
    progress_percentage: Optional[float] = 0.0
    deadline: datetime

class GoalCreate(GoalBase):
    pass

class GoalResponse(GoalBase):
    id: UUID
    user_id: UUID

    class Config:
        from_attributes = True

class CalendarEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    event_type: str

class CalendarEventCreate(CalendarEventBase):
    pass

class CalendarEventResponse(CalendarEventBase):
    id: UUID
    user_id: UUID

    class Config:
        from_attributes = True
