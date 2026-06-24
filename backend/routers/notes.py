from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import uuid
import models, schemas
from database import get_db
from routers.auth import get_current_user
import os
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance

router = APIRouter(prefix="/api/v1/notes", tags=["Notes"])


# Initialize Qdrant Client
qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
try:
    qdrant = QdrantClient(url=qdrant_url, timeout=3.0)
    qdrant.recreate_collection(
        collection_name="notes",
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )
except Exception as e:
    print(f"Failed to connect to Qdrant: {e}")
    qdrant = None

@router.post("/", response_model=schemas.NoteResponse)
def create_note(note: schemas.NoteCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    note_id = str(uuid.uuid4())
    
    # Generate dummy embedding (in real app, use OpenAI or SentenceTransformers)
    dummy_embedding = [0.1] * 384 

    qdrant_id = None
    if qdrant:
        try:
            qdrant.upsert(
                collection_name="notes",
                points=[
                    PointStruct(
                        id=note_id,
                        vector=dummy_embedding,
                        payload={"title": note.title, "tags": note.tags, "user_id": str(user.id)}
                    )
                ]
            )
            qdrant_id = note_id
        except Exception as e:
            print(f"Qdrant upsert failed: {e}")

    db_note = models.Note(**note.model_dump(), id=note_id, user_id=user.id, qdrant_id=qdrant_id)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.get("/", response_model=List[schemas.NoteResponse])
def get_notes(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.Note).filter(models.Note.user_id == user.id).all()
