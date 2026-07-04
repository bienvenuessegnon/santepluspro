from fastapi import APIRouter, HTTPException, Body
from typing import List
from models import Appointment
import uuid
from data_mock import APPOINTMENTS_DB

router = APIRouter(prefix="/api/appointments", tags=["appointments"])

@router.get("", response_model=List[Appointment])
def get_appointments():
    return APPOINTMENTS_DB

@router.post("", response_model=Appointment)
def create_appointment(
    hospitalId: str = Body(...),
    hospitalName: str = Body(...),
    date: str = Body(...),
    timeSlot: str = Body(...),
    patientName: str = Body(...)
):
    new_appointment = {
        "id": f"appt-{str(uuid.uuid4())[:8]}",
        "hospitalId": hospitalId,
        "hospitalName": hospitalName,
        "date": date,
        "timeSlot": timeSlot,
        "patientName": patientName,
        "status": "pending"
    }
    APPOINTMENTS_DB.append(new_appointment)
    return new_appointment

@router.patch("/{appt_id}/status", response_model=Appointment)
def update_status(appt_id: str, status: str = Body(..., embed=True)):
    if status not in ["confirmed", "pending"]:
        raise HTTPException(status_code=400, detail="Statut invalide")
        
    for appt in APPOINTMENTS_DB:
        if appt["id"] == appt_id:
            appt["status"] = status
            return appt
            
    raise HTTPException(status_code=404, detail="Rendez-vous non trouvé")
