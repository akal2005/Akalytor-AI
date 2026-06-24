from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import SQLALCHEMY_DATABASE_URL
import models

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

MOCK_USER_ID = "00000000-0000-0000-0000-000000000000"

try:
    # Get the real Manikandan user
    real_user = db.query(models.User).filter(models.User.name == "Manikandan").first()
    if not real_user:
        print("Real user not found!")
    else:
        real_id = real_user.id
        print(f"Found real user ID: {real_id}")
        
        # Tables to update
        tables = [
            models.Reminder, models.Expense, models.SavingsGoal,
            models.Note, models.StudySession, models.WorkTask,
            models.Goal, models.CalendarEvent
        ]
        
        for table in tables:
            updated = db.query(table).filter(table.user_id == MOCK_USER_ID).update({"user_id": real_id})
            print(f"Updated {updated} records in {table.__tablename__}")
            
        db.commit()
        print("Data migration completed successfully.")
except Exception as e:
    print(f"Migration error: {e}")
    db.rollback()
finally:
    db.close()
