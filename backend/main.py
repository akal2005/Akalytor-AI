from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import os
from routers import reminders, expenses, savings, notes, study, work, goals, calendar, ai, analytics, auth
from websockets_manager import manager
import models
from database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="MANITOR AI API", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reminders.router)
app.include_router(expenses.router)
app.include_router(savings.router)
app.include_router(notes.router)
app.include_router(study.router)
app.include_router(work.router)
app.include_router(goals.router)
app.include_router(calendar.router)
app.include_router(ai.router)
app.include_router(analytics.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to MANITOR AI API"}

@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy"}

@app.websocket("/api/v1/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
