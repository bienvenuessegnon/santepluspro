from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict
from models import MedicalDocument
import uuid
from data_mock import DOCUMENTS_DB, XOF_TO_SATS

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.get("", response_model=List[MedicalDocument])
def get_documents():
    return DOCUMENTS_DB

@router.get("/{doc_id}", response_model=MedicalDocument)
def get_document(doc_id: str):
    for doc in DOCUMENTS_DB:
        if doc["id"] == doc_id:
            return doc
    raise HTTPException(status_code=404, detail="Document non trouvé")

@router.post("", response_model=MedicalDocument)
def create_document(
    title: str = Body(...),
    type: str = Body(...),
    items: List[Dict] = Body(...),
    priceXOF: int = Body(...)
):
    if type not in ["analyses", "prescription", "devis"]:
        raise HTTPException(status_code=400, detail="Type de document invalide")
        
    price_sats = int(priceXOF * XOF_TO_SATS)
    
    new_doc = {
        "id": f"doc-{str(uuid.uuid4())[:8]}",
        "title": title,
        "type": type,
        "items": items,
        "priceXOF": priceXOF,
        "priceSats": price_sats
    }
    
    DOCUMENTS_DB.append(new_doc)
    return new_doc
