from pydantic import BaseModel, EmailStr
from typing import List, Optional, Literal, Dict

class Review(BaseModel):
    id: str
    author: str
    rating: int
    date: str
    comment: str

class ServicePrice(BaseModel):
    name: str
    priceXOF: int
    priceSats: int

class Coords(BaseModel):
    x: float
    y: float

class Hospital(BaseModel):
    id: str
    name: str
    type: Literal['public', 'private', 'clinic']
    image: str
    rating: float
    reviewsCount: int
    distance: str
    address: str
    phone: str
    hours: str
    isVerified: bool
    services: List[str]
    priceList: List[ServicePrice]
    reviews: List[Review]
    coords: Coords
    lat: Optional[float] = None
    lng: Optional[float] = None

class MedicalDocumentItem(BaseModel):
    name: str
    quantity: Optional[int] = None
    priceXOF: int

class MedicalDocument(BaseModel):
    id: str
    title: str
    type: Literal['analyses', 'prescription', 'devis']
    items: List[MedicalDocumentItem]
    priceXOF: int
    priceSats: int

class Appointment(BaseModel):
    id: str
    hospitalId: str
    hospitalName: str
    date: str
    timeSlot: str
    patientName: str
    status: Literal['confirmed', 'pending']

class InvoiceItem(BaseModel):
    name: str
    priceXOF: int

class Invoice(BaseModel):
    id: str
    patientName: str
    hospitalName: str
    hospitalAddress: str
    date: str
    items: List[InvoiceItem]
    totalXOF: int
    totalSats: int
    paymentMethod: Literal['Wallet', 'Lightning', 'FamilyHelp']
    txHash: str
    isPaid: bool
    doctorName: Optional[str] = None

class Patient(BaseModel):
    name: str
    email: EmailStr
    phone: str
    walletBalance: int
    npi: Optional[str] = None
    avatar: Optional[str] = None

class HospitalUser(BaseModel):
    email: EmailStr
    hospitalId: str
    role: Literal['doctor', 'admin', 'nurse']
    name: Optional[str] = None

class AccessRequest(BaseModel):
    id: str
    npi: str
    doctorEmail: EmailStr
    hospitalName: str
    status: Literal['pending', 'approved', 'rejected']
    requestedAt: str
    confirmedAt: Optional[str] = None
    blockchainTxHash: Optional[str] = None
