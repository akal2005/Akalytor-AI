from sqlalchemy import Column, String, Boolean, DateTime, Float, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from database import Base

# Helper to support UUID on SQLite and PostgreSQL
class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise CHAR(36), storing as string.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(pgUUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(value)
            return value

class User(Base):
    __tablename__ = "users"
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String, nullable=True)
    name = Column(String)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    reminders = relationship("Reminder", back_populates="user")
    expenses = relationship("Expense", back_populates="user")
    savings_goals = relationship("SavingsGoal", back_populates="user")
    notes = relationship("Note", back_populates="user")
    study_sessions = relationship("StudySession", back_populates="user")
    work_tasks = relationship("WorkTask", back_populates="user")
    goals = relationship("Goal", back_populates="user")
    calendar_events = relationship("CalendarEvent", back_populates="user")

class Reminder(Base):
    __tablename__ = "reminders"
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id"))
    title = Column(String, index=True)
    description = Column(String)
    due_date = Column(DateTime)
    priority = Column(String, default="Medium")
    is_recurring = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="reminders")

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id"))
    amount = Column(Float)
    category = Column(String, default="General")
    description = Column(String)
    date = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="expenses")

class SavingsGoal(Base):
    __tablename__ = "savings_goals"
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id"))
    title = Column(String)
    target_amount = Column(Float)
    current_amount = Column(Float, default=0.0)
    deadline = Column(DateTime)
    
    user = relationship("User", back_populates="savings_goals")

class Note(Base):
    __tablename__ = "notes"
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id"))
    title = Column(String)
    content = Column(String)
    tags = Column(String)
    qdrant_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="notes")

class StudySession(Base):
    __tablename__ = "study_sessions"
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id"))
    subject = Column(String)
    topic = Column(String)
    duration_minutes = Column(Float)
    date = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="study_sessions")

class WorkTask(Base):
    __tablename__ = "work_tasks"
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id"))
    project_name = Column(String)
    task_name = Column(String)
    deadline = Column(DateTime)
    status = Column(String, default="To Do")
    
    user = relationship("User", back_populates="work_tasks")

class Goal(Base):
    __tablename__ = "goals"
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id"))
    title = Column(String)
    type = Column(String)
    progress_percentage = Column(Float, default=0.0)
    deadline = Column(DateTime)
    
    user = relationship("User", back_populates="goals")

class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id"))
    title = Column(String)
    description = Column(String)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    event_type = Column(String)
    
    user = relationship("User", back_populates="calendar_events")
