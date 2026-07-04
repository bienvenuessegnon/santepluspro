from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict
from models import Hospital, Review
import uuid
from datetime import datetime
from data_mock import HOSPITALS_DB

router = APIRouter(prefix="/api/hospitals", tags=["hospitals"])

@router.get("", response_model=List[Hospital])
def get_hospitals():
    return HOSPITALS_DB

@router.get("/{hospital_id}", response_model=Hospital)
def get_hospital(hospital_id: str):
    for h in HOSPITALS_DB:
        if h["id"] == hospital_id:
            return h
    raise HTTPException(status_code=404, detail="Hôpital non trouvé")

@router.post("/{hospital_id}/reviews", response_model=Review)
def add_review(hospital_id: str, author: str = Body(...), rating: int = Body(...), comment: str = Body(...)):
    hospital = None
    for h in HOSPITALS_DB:
        if h["id"] == hospital_id:
            hospital = h
            break
            
    if not hospital:
        raise HTTPException(status_code=404, detail="Hôpital non trouvé")
        
    new_review = {
        "id": f"rev-{str(uuid.uuid4())[:8]}",
        "author": author,
        "rating": rating,
        "date": datetime.now().strftime("%d %B %Y"),
        "comment": comment
    }
    
    hospital["reviews"].append(new_review)
    
    # Recalculate average rating
    total_rating = sum(r["rating"] for r in hospital["reviews"])
    hospital["rating"] = round(total_rating / len(hospital["reviews"]), 1)
    hospital["reviewsCount"] = len(hospital["reviews"])
    
    return new_review
