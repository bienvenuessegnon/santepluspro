from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Optional
from models import Invoice, Patient
import uuid
from datetime import datetime
from data_mock import PATIENTS_DB, INVOICES_DB, XOF_TO_SATS

router = APIRouter(prefix="/api/wallet", tags=["wallet"])

@router.get("/patients/{email}", response_model=Patient)
def get_patient(email: str):
    if email not in PATIENTS_DB:
        # Create virtual default patient profile if logging in
        PATIENTS_DB[email] = {
            "name": email.split("@")[0].replace(".", " ").title(),
            "email": email,
            "phone": "+229 97 00 00 00",
            "walletBalance": 10000,
            "npi": "1097000000000",
            "avatar": email[:2].upper()
        }
    return PATIENTS_DB[email]

@router.post("/patients/{email}/deposit", response_model=Patient)
def deposit(email: str, amount_xof: int = Body(..., embed=True)):
    if email not in PATIENTS_DB:
        raise HTTPException(status_code=404, detail="Citoyen non trouvé")
    
    if amount_xof <= 0:
        raise HTTPException(status_code=400, detail="Montant invalide")
        
    PATIENTS_DB[email]["walletBalance"] += amount_xof
    return PATIENTS_DB[email]

@router.get("/invoices", response_model=List[Invoice])
def get_invoices():
    return INVOICES_DB

@router.post("/invoices", response_model=Invoice)
def create_invoice(
    patientName: str = Body(...),
    hospitalName: str = Body(...),
    hospitalAddress: str = Body(...),
    items: List[Dict] = Body(...),
    totalXOF: int = Body(...),
    paymentMethod: str = Body(...),
    doctorName: Optional[str] = Body(None)
):
    total_sats = int(totalXOF * XOF_TO_SATS)
    tx_hash = f"tx_benin_{str(uuid.uuid4().hex)[:16]}"
    
    new_invoice = {
        "id": f"fac-{str(uuid.uuid4())[:8]}",
        "patientName": patientName,
        "hospitalName": hospitalName,
        "hospitalAddress": hospitalAddress,
        "date": datetime.now().strftime("%d %B %Y - %H:%M"),
        "items": items,
        "totalXOF": totalXOF,
        "totalSats": total_sats,
        "paymentMethod": paymentMethod,
        "txHash": tx_hash,
        "isPaid": False,
        "doctorName": doctorName
    }
    
    # If using Wallet payment directly, attempt to debit patient
    # In real application, we require Auth first
    INVOICES_DB.append(new_invoice)
    return new_invoice

@router.post("/invoices/{invoice_id}/pay", response_model=Invoice)
def pay_invoice(invoice_id: str, email: str = Body(..., embed=True)):
    invoice = None
    for inv in INVOICES_DB:
        if inv["id"] == invoice_id:
            invoice = inv
            break
            
    if not invoice:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
        
    if invoice["isPaid"]:
        raise HTTPException(status_code=400, detail="La facture est déjà réglée")
        
    if email not in PATIENTS_DB:
        raise HTTPException(status_code=404, detail="Patient non trouvé")
        
    patient = PATIENTS_DB[email]
    if patient["walletBalance"] < invoice["totalXOF"]:
        raise HTTPException(status_code=400, detail="Solde insuffisant dans votre portefeuille Santé+")
        
    patient["walletBalance"] -= invoice["totalXOF"]
    invoice["isPaid"] = True
    invoice["paymentMethod"] = "Wallet"
    invoice["txHash"] = f"tx_wallet_{str(uuid.uuid4().hex)[:16]}"
    
    return invoice

@router.post("/invoices/{invoice_id}/pay-lightning", response_model=Invoice)
def pay_invoice_lightning(invoice_id: str):
    invoice = None
    for inv in INVOICES_DB:
        if inv["id"] == invoice_id:
            invoice = inv
            break
            
    if not invoice:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
        
    invoice["isPaid"] = True
    invoice["paymentMethod"] = "Lightning"
    invoice["txHash"] = f"ln_tx_hash_{str(uuid.uuid4().hex)[:24]}"
    
    return invoice
