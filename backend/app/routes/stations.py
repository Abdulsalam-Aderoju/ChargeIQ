"""
ChargeIQ NG — Stations Router
CRUD and status endpoints for EV charging stations.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import Station, StationCreate, StationStatusUpdate
from app.services import dynamo, sagemaker

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stations", tags=["Stations"])


# ---------------------------------------------------------------------------
# GET /stations/ — list with optional filters
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[Station])
async def list_stations(
    lat: Optional[float] = Query(None, description="Centre latitude for geo search"),
    lng: Optional[float] = Query(None, description="Centre longitude for geo search"),
    radius: Optional[float] = Query(None, description="Search radius in km"),
    city: Optional[str] = Query(None, description="Filter by city"),
    area: Optional[str] = Query(None, description="Filter by area"),
    status: Optional[str] = Query(None, description="Filter by status"),
    connectorType: Optional[str] = Query(None, description="Filter by connector type"),
):
    """Return all stations, optionally filtered by location, city, area, status, or connector type."""
    filters: dict = {}
    if lat is not None:
        filters["lat"] = lat
    if lng is not None:
        filters["lng"] = lng
    if radius is not None:
        filters["radius"] = radius
    if city:
        filters["city"] = city
    if area:
        filters["area"] = area
    if status:
        filters["status"] = status
    if connectorType:
        filters["connectorType"] = connectorType

    try:
        stations = dynamo.get_all_stations(filters)
    except Exception as exc:
        logger.error("Failed to fetch stations: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to retrieve stations from database.") from exc

    # Enrich each station with a predicted wait time (best-effort)
    now = datetime.now(timezone.utc)
    current_hour = now.hour
    current_dow = now.weekday()  # 0 = Monday

    for station in stations:
        try:
            predicted_wait = sagemaker.predict_wait_time(
                station_id=station.get("stationId", ""),
                hour=current_hour,
                day_of_week=current_dow,
            )
            station["waitMinutes"] = predicted_wait
        except Exception as exc:
            logger.debug("SageMaker enrichment skipped for %s: %s", station.get("stationId"), exc)
            # Keep whatever waitMinutes the station already has

    return stations


# ---------------------------------------------------------------------------
# GET /stations/{station_id} — single station detail
# ---------------------------------------------------------------------------

@router.get("/{station_id}", response_model=dict)
async def get_station(station_id: str):
    """Return a single station by ID, including recent availability log."""
    try:
        station = dynamo.get_station(station_id)
    except Exception as exc:
        logger.error("Failed to fetch station %s: %s", station_id, exc)
        raise HTTPException(status_code=500, detail="Database error while fetching station.") from exc

    if station is None:
        raise HTTPException(status_code=404, detail=f"Station {station_id} not found.")

    # Attach availability history (best-effort)
    availability_log = []
    try:
        availability_log = dynamo.get_availability_log(station_id, hours=24)
    except Exception as exc:
        logger.debug("Could not fetch availability log for %s: %s", station_id, exc)

    station["availabilityLog"] = availability_log
    return station


# ---------------------------------------------------------------------------
# POST /stations/ — create a new station
# ---------------------------------------------------------------------------

@router.post("/", response_model=Station, status_code=201)
async def create_station(body: StationCreate):
    """Create a new charging station."""
    station_dict = body.model_dump()

    try:
        created = dynamo.create_station(station_dict)
    except Exception as exc:
        logger.error("Failed to create station: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create station in database.") from exc

    return created


# ---------------------------------------------------------------------------
# PUT /stations/{station_id}/status — update status
# ---------------------------------------------------------------------------

@router.put("/{station_id}/status", response_model=Station)
async def update_station_status(station_id: str, body: StationStatusUpdate):
    """Update the status of a station or a specific connector."""
    try:
        updated = dynamo.update_station_status(
            station_id=station_id,
            status=body.status,
            connector_id=body.connectorId,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Failed to update station %s: %s", station_id, exc)
        raise HTTPException(status_code=500, detail="Failed to update station status.") from exc

    # Log the change to the availability log (best-effort)
    try:
        dynamo.log_availability(
            station_id=station_id,
            status=updated.get("status", body.status),
            available_ports=updated.get("availablePorts", 0),
            wait_minutes=updated.get("waitMinutes", 0),
        )
    except Exception as exc:
        logger.warning("Failed to log availability for %s: %s", station_id, exc)

    return updated
