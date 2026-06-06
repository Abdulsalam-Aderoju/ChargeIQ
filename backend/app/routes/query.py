"""
ChargeIQ NG — Query Router
Natural-language search endpoint backed by Amazon Bedrock with keyword fallback.
"""

import logging

from fastapi import APIRouter, HTTPException

from app.models.schemas import NLQueryRequest, NLQueryResponse
from app.services import bedrock, dynamo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/query", tags=["Query"])


@router.post("/nl", response_model=NLQueryResponse)
async def natural_language_query(body: NLQueryRequest):
    """
    Accept a free-text query and return the best-matching station with a
    human-readable recommendation.

    Pipeline:
      1. Fetch all stations from DynamoDB.
      2. Pass stations + query to Bedrock (Claude).
      3. On Bedrock failure, fall back to keyword matching.
    """
    query = body.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query must not be empty.")

    # 1. Fetch stations
    try:
        stations = dynamo.get_all_stations()
    except Exception as exc:
        logger.error("Failed to fetch stations for NL query: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve station data. Please try again later.",
        ) from exc

    if not stations:
        return NLQueryResponse(
            stationId="",
            name="",
            message="No charging stations are currently registered in the system.",
            confidence=0.0,
        )

    # 2. Run through Bedrock (with automatic keyword fallback inside the service)
    try:
        result = bedrock.query_stations_nl(query, stations)
    except Exception as exc:
        logger.error("NL query processing failed entirely: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Unable to process your query at this time.",
        ) from exc

    return NLQueryResponse(
        stationId=result.get("stationId", ""),
        name=result.get("name", ""),
        message=result.get("message", "No recommendation available."),
        confidence=result.get("confidence"),
    )
