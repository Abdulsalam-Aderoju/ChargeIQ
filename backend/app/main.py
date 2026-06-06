"""
ChargeIQ NG API — Main Application
FastAPI app with Mangum adapter for AWS Lambda deployment.
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.routes import stations, analytics, query

# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="ChargeIQ NG API",
    description="Nigeria's EV Charging Intelligence Platform — API backend",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS (allow all origins for hackathon)
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(stations.router)
app.include_router(analytics.router)
app.include_router(query.router)

# ---------------------------------------------------------------------------
# Root & Health
# ---------------------------------------------------------------------------


@app.get("/", tags=["Root"])
async def root():
    """Service identification endpoint."""
    return {
        "status": "ok",
        "service": "ChargeIQ NG API",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Simple liveness probe."""
    return {"status": "healthy"}


# ---------------------------------------------------------------------------
# AWS Lambda handler (Mangum)
# ---------------------------------------------------------------------------

handler = Mangum(app)

# ---------------------------------------------------------------------------
# Local development
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
