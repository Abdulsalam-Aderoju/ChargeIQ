"""
ChargeIQ NG — Analytics Router
Endpoints for usage analytics and heatmap visualisation.
"""

import logging

from fastapi import APIRouter

from app.models.schemas import HeatmapResponse, HeatmapPoint
from app.services import dynamo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/heatmap", response_model=HeatmapResponse)
async def get_heatmap():
    """
    Return weighted geo-points for a usage heatmap.

    Each point represents a station's coordinates weighted by its total
    session count.  The frontend can feed these directly into a heatmap layer.
    """
    try:
        # 1. Get session counts per station
        session_counts = dynamo.get_session_counts()

        # 2. Get all stations so we can look up lat/lng
        all_stations = dynamo.get_all_stations()

        # Build a lookup: stationId → station dict
        station_map: dict[str, dict] = {
            s["stationId"]: s for s in all_stations if "stationId" in s
        }

        # 3. Join: for each session-count entry, find the station coords
        points: list[HeatmapPoint] = []
        for entry in session_counts:
            sid = entry.get("stationId", "")
            count = entry.get("count", 0)
            station = station_map.get(sid)
            if station is None:
                continue
            lat = station.get("lat")
            lng = station.get("lng")
            if lat is None or lng is None:
                continue
            points.append(HeatmapPoint(lat=float(lat), lng=float(lng), weight=float(count)))

        return HeatmapResponse(points=points)

    except Exception as exc:
        logger.error("Heatmap generation failed: %s", exc)
        # Graceful degradation — return an empty heatmap instead of a 500
        return HeatmapResponse(points=[])
