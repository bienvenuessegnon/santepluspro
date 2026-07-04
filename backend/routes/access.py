from fastapi import APIRouter, HTTPException, Body
from typing import List
from models import AccessRequest
import uuid
from datetime import datetime
from data_mock import ACCESS_REQUESTS_DB

router = APIRouter(prefix="/api/access-requests", tags=["access-requests"])

@router.get("", response_model=List[AccessRequest])
def get_access_requests():
    return ACCESS_REQUESTS_DB

@router.post("", response_model=AccessRequest)
def create_access_request(
    npi: str = Body(...),
    doctorEmail: str = Body(...),
    hospitalName: str = Body(...)
):
    new_request = {
        "id": f"req-{str(uuid.uuid4())[:8]}",
        "npi": npi,
        "doctorEmail": doctorEmail,
        "hospitalName": hospitalName,
        "status": "pending",
        "requestedAt": datetime.now().strftime("%d %B %Y à %H:%M")
    }
    ACCESS_REQUESTS_DB.append(new_request)
    return new_request

@router.patch("/{req_id}/status", response_model=AccessRequest)
def update_access_status(req_id: str, status: str = Body(..., embed=True)):
    if status not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Statut d'accès invalide")
        
    for req in ACCESS_REQUESTS_DB:
        if req["id"] == req_id:
            req["status"] = status
            if status == "approved":
                req["confirmedAt"] = datetime.now().strftime("%d %B %Y à %H:%M")
                req["blockchainTxHash"] = f"hash_access_approved_{str(uuid.uuid4().hex)[:16]}"
            return req
            
    raise HTTPException(status_code=404, detail="Demande d'accès non trouvée")
