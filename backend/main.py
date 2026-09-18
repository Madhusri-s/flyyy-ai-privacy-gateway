import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config.settings import settings
from backend.models.database import (
    init_all_databases, SessionSource, SessionPolicy
)
from backend.services.policy import policy_service
from backend.api.router import router, seed_source_data

app = FastAPI(
    title="FLYYY.AI Privacy-Preserving Customer Data Platform",
    description=(
        "Production-grade Privacy Platform prototype implementing Format-Preserving Encryption (FF1), "
        "deterministic tokenization, secure vault mapping with AES-256-GCM, Privacy Gateway access control, "
        "and immutable zero-plaintext audit logging.\n\n"
        "Principle: PROTECTED BY DEFAULT. REVEAL OR USE PLAINTEXT ONLY BY EXCEPTION."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for local Vite development frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Main API Router
app.include_router(router, prefix="/api")

@app.on_event("startup")
def on_startup():
    """Initializes separate databases and seeds initial configuration."""
    init_all_databases()

    # Initialize default policies
    policy_db = SessionPolicy()
    try:
        policy_service.initialize_defaults(policy_db)
    finally:
        policy_db.close()

    # Seed initial source records if empty
    src_db = SessionSource()
    try:
        from backend.models.database import SourceCustomer
        if src_db.query(SourceCustomer).count() == 0:
            seed_source_data(src_db)
    finally:
        src_db.close()

@app.get("/health", summary="Health check endpoint")
def health():
    return {
        "status": "HEALTHY",
        "service": "FLYYY.AI Privacy Platform Backend",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
