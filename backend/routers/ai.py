from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
from dotenv import load_dotenv
load_dotenv()

import jwt
import google.generativeai as genai
from database import get_db
import models
import json
from datetime import datetime

router = APIRouter(prefix="/api/v1/ai", tags=["MONI AI"])

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

# Configure Gemini
api_key = os.environ.get("GEMINI_API_KEY", "")
genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('gemini-flash-latest')
except Exception as e:
    model = None

JWT_SECRET = os.environ.get("JWT_SECRET", "super_secret_neon_key_123")

@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket, token: str = Query(...), db: Session = Depends(get_db)):
    await websocket.accept()
    
    # Authenticate user via token
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        username = payload.get("sub")
        user = db.query(models.User).filter(models.User.name == username).first()
        if not user:
            await websocket.send_text("Authentication failed. Invalid user.")
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.send_text("Authentication failed. Invalid token.")
        await websocket.close(code=1008)
        return

    if not model:
        await websocket.send_text("Error initializing Gemini model. Please check your API key.")
        await websocket.send_text("[DONE]")
        return

    try:
        while True:
            data = await websocket.receive_text()
            
            # Fetch context
            notes_count = db.query(models.Note).filter_by(user_id=user.id).count()
            tasks_count = db.query(models.WorkTask).filter_by(user_id=user.id).count()
            expenses = sum([e.amount for e in db.query(models.Expense).filter_by(user_id=user.id).all()])
            today_str = datetime.utcnow().strftime('%A, %B %d, %Y')
            
            system_prompt = f"""
You are MONI AI, the omniscient Personal Life Assistant. 
The user's name is {user.name}. Today is {today_str}.
Context about their life:
- Notes: {notes_count}
- Active Tasks: {tasks_count}
- Recent Expenses: ${expenses:.2f}

Answer concisely, friendly, and intelligently based on this context. Keep the tone very futuristic and smart.

ACTION COMMANDS:
If the user explicitly asks you to create, add, schedule, or log an item, you MUST execute it by outputting a special command block at the VERY END of your response.
DO NOT use markdown formatting for the command block. It must start with ||CMD_ and end with ||.
- Task: ||CMD_ADD_TASK: {{"task_name": "...", "project_name": "General", "deadline": "2026-06-12 18:00:00"}}||
- Expense: ||CMD_ADD_EXPENSE: {{"amount": 10.50, "category": "Food", "description": "..."}}||
- Note: ||CMD_ADD_NOTE: {{"title": "...", "content": "..."}}||
- Reminder: ||CMD_ADD_REMINDER: {{"title": "...", "due_date": "2026-06-12 18:00:00"}}||

Always confirm to the user what you are doing in normal text BEFORE the command block. Do not mention the command block format to the user.
User's query: {data}
"""
            
            try:
                # Stream the response
                response = model.generate_content(system_prompt, stream=True)
                buffer = ""
                command_mode = False
                
                for chunk in response:
                    if chunk.text:
                        text = chunk.text
                        
                        # Command interception logic
                        if "||CMD_" in text or command_mode:
                            command_mode = True
                            buffer += text
                            continue
                            
                        if "||" in text:
                            parts = text.split("||", 1)
                            if parts[0]:
                                await websocket.send_text(parts[0])
                            buffer += "||" + parts[1]
                            command_mode = True
                            continue
                            
                        # INSTANT STREAMING: No artificial delay
                        await websocket.send_text(text)
                
                # Check buffer for intercepted commands after streaming completes
                if buffer and "||CMD_" in buffer:
                    try:
                        cmd_start = buffer.find("||CMD_")
                        cmd_end = buffer.find("||", cmd_start + 6)
                        if cmd_start != -1 and cmd_end != -1:
                            cmd_str = buffer[cmd_start:cmd_end+2]
                            
                            # Execute specific commands
                            if cmd_str.startswith("||CMD_ADD_TASK:"):
                                json_str = cmd_str.replace("||CMD_ADD_TASK:", "").replace("||", "").strip()
                                task_data = json.loads(json_str)
                                new_task = models.WorkTask(user_id=user.id, task_name=task_data.get("task_name"), project_name=task_data.get("project_name", "General"), status="To Do")
                                if task_data.get("deadline"):
                                    try: new_task.deadline = datetime.strptime(task_data.get("deadline"), "%Y-%m-%d %H:%M:%S")
                                    except: pass
                                db.add(new_task)
                                await websocket.send_text("\n\n✅ *Action Executed: Task securely injected into database.*")

                            elif cmd_str.startswith("||CMD_ADD_EXPENSE:"):
                                json_str = cmd_str.replace("||CMD_ADD_EXPENSE:", "").replace("||", "").strip()
                                exp_data = json.loads(json_str)
                                new_expense = models.Expense(user_id=user.id, amount=float(exp_data.get("amount", 0)), category=exp_data.get("category", "General"), description=exp_data.get("description", ""))
                                db.add(new_expense)
                                await websocket.send_text("\n\n✅ *Action Executed: Expense logged to financial records.*")

                            elif cmd_str.startswith("||CMD_ADD_NOTE:"):
                                json_str = cmd_str.replace("||CMD_ADD_NOTE:", "").replace("||", "").strip()
                                note_data = json.loads(json_str)
                                import uuid
                                new_note = models.Note(id=str(uuid.uuid4()), user_id=user.id, title=note_data.get("title", "Note"), content=note_data.get("content", ""))
                                db.add(new_note)
                                await websocket.send_text("\n\n✅ *Action Executed: Note saved to knowledge base.*")

                            elif cmd_str.startswith("||CMD_ADD_REMINDER:"):
                                json_str = cmd_str.replace("||CMD_ADD_REMINDER:", "").replace("||", "").strip()
                                rem_data = json.loads(json_str)
                                new_rem = models.Reminder(user_id=user.id, title=rem_data.get("title", ""))
                                if rem_data.get("due_date"):
                                    try: new_rem.due_date = datetime.strptime(rem_data.get("due_date"), "%Y-%m-%d %H:%M:%S")
                                    except: pass
                                db.add(new_rem)
                                await websocket.send_text("\n\n✅ *Action Executed: Reminder scheduled.*")

                            db.commit()
                            
                    except Exception as e:
                        print(f"Command execution error: {e}")
                        db.rollback()
                        await websocket.send_text(f"\n\n⚠️ *Action Failed: System encountered an error while injecting database records.*")

                await websocket.send_text("[DONE]")
            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "quota" in error_str.lower():
                    await websocket.send_text("⚠️ **Rate Limit Exceeded**\n\nWe've hit the Google Gemini API free-tier limit (5 requests per minute). Please wait about 30 seconds and try again!")
                else:
                    await websocket.send_text(f"API Error: {error_str}")
                await websocket.send_text("[DONE]")
                
    except WebSocketDisconnect:
        pass
