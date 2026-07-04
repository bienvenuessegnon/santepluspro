import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import hospitals, appointments, wallet, documents, access

app = FastAPI(
    title="Santé+ Bénin Backend",
    description="API de gestion de santé sécurisée pour les hôpitaux d'Abomey-Calavi (Bénin)",
    version="1.0.0"
)

# Enable CORS for all local development origins (Vite on port 3000, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(hospitals.router)
app.include_router(appointments.router)
app.include_router(wallet.router)
app.include_router(documents.router)
app.include_router(access.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Santé+ Bénin API",
        "version": "1.0.0",
        "endpoints": [
            "/api/hospitals",
            "/api/appointments",
            "/api/wallet/patients/{email}",
            "/api/documents",
            "/api/access-requests"
        ]
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
