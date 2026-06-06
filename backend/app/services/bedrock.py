"""
ChargeIQ NG — Bedrock Service
Proxies natural-language queries to Amazon Bedrock (Claude) and provides
a keyword-based fallback that works entirely offline / without credentials.
"""

import json
import logging
import os
from typing import Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
AWS_REGION = os.environ.get("AWS_REGION", "eu-north-1")
# Bedrock is NOT available in eu-north-1 — use the nearest supported region.
# Override with BEDROCK_REGION env var if Abdulsalam enables Bedrock elsewhere.
BEDROCK_REGION = os.environ.get("BEDROCK_REGION", "eu-west-1")
BEDROCK_MODEL_ID = os.environ.get(
    "BEDROCK_MODEL_ID",
    "anthropic.claude-3-haiku-20240307-v1:0",
)

_bedrock_client = None


def _get_bedrock_client():
    """Lazy-init Bedrock Runtime client."""
    global _bedrock_client
    if _bedrock_client is None:
        _bedrock_client = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)
    return _bedrock_client


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def query_stations_nl(query: str, stations: list[dict]) -> dict:
    """
    Answer a natural-language question about EV charging stations.

    1. Attempts to call Amazon Bedrock (Claude) with a structured prompt.
    2. On *any* failure (network, credentials, throttle …) falls back to a
       deterministic keyword-matching algorithm that needs no AWS access.

    Returns ``{"stationId": ..., "name": ..., "message": ...}``.
    """
    try:
        return _bedrock_query(query, stations)
    except Exception as exc:
        logger.warning("Bedrock call failed (%s); falling back to keyword search.", exc)
        return _keyword_fallback(query, stations)


# ---------------------------------------------------------------------------
# Bedrock implementation
# ---------------------------------------------------------------------------

def _build_station_summary(stations: list[dict]) -> str:
    """Compact JSON summary of stations for the LLM context window."""
    summaries = []
    for s in stations:
        summaries.append({
            "id": s.get("stationId", ""),
            "name": s.get("name", ""),
            "area": s.get("area", ""),
            "city": s.get("city", ""),
            "status": s.get("status", ""),
            "connectors": [
                {"type": c.get("type", ""), "power": c.get("power", 0), "status": c.get("status", "")}
                for c in s.get("connectors", [])
            ],
            "waitMinutes": s.get("waitMinutes", 0),
            "availablePorts": s.get("availablePorts", 0),
            "totalPorts": s.get("totalPorts", 0),
            "rating": s.get("rating", 0),
        })
    return json.dumps(summaries, separators=(",", ":"))


def _bedrock_query(query: str, stations: list[dict]) -> dict:
    """Call Bedrock with the Anthropic Messages API."""
    client = _get_bedrock_client()

    system_prompt = (
        "You are ChargeIQ, an intelligent EV charging assistant for Nigeria. "
        "You have access to the following charging station data:\n\n"
        f"{_build_station_summary(stations)}\n\n"
        "Answer the user's question by recommending the best station. "
        "Always respond with valid JSON containing exactly these keys: "
        '"stationId", "name", "message". '
        "The message should be a helpful, concise recommendation in natural language. "
        "If you cannot determine a match, pick the best available station and explain why."
    )

    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 512,
        "system": system_prompt,
        "messages": [
            {"role": "user", "content": query},
        ],
    })

    response = client.invoke_model(
        modelId=BEDROCK_MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=body,
    )

    response_body = json.loads(response["body"].read())

    # Claude messages API returns content as a list of blocks
    raw_text = ""
    for block in response_body.get("content", []):
        if block.get("type") == "text":
            raw_text += block["text"]

    # Try to extract JSON from the response
    parsed = _extract_json(raw_text)
    if parsed and "stationId" in parsed and "name" in parsed:
        return {
            "stationId": parsed["stationId"],
            "name": parsed["name"],
            "message": parsed.get("message", "Recommended station."),
        }

    # If Claude didn't return structured JSON, wrap the raw text
    # and try to find the best matching station from the response
    best = _match_station_from_text(raw_text, stations)
    return {
        "stationId": best.get("stationId", ""),
        "name": best.get("name", ""),
        "message": raw_text.strip()[:500],
    }


def _extract_json(text: str) -> Optional[dict]:
    """Try to parse a JSON object from *text*, tolerating surrounding prose."""
    # Look for the first { ... } block
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        return json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return None


def _match_station_from_text(text: str, stations: list[dict]) -> dict:
    """Find the station whose name appears most prominently in *text*."""
    text_lower = text.lower()
    best_station: dict = {}
    best_score = -1
    for s in stations:
        score = 0
        name = s.get("name", "").lower()
        if name and name in text_lower:
            score += 10
        sid = s.get("stationId", "")
        if sid and sid in text:
            score += 15
        if score > best_score:
            best_score = score
            best_station = s
    if not best_station and stations:
        # Default to first available
        for s in stations:
            if s.get("status", "").upper() == "AVAILABLE":
                return s
        return stations[0]
    return best_station


# ---------------------------------------------------------------------------
# Keyword fallback (no AWS credentials needed)
# ---------------------------------------------------------------------------

def _keyword_fallback(query: str, stations: list[dict]) -> dict:
    """
    Deterministic keyword-matching search.

    Scoring heuristic:
      - +3 for each query keyword found in the station name
      - +2 for each query keyword found in the area
      - +2 for each query keyword found in the city
      - +1 for each query keyword found in a connector type
      - +5 bonus if station status is AVAILABLE
      - +3 bonus if waitMinutes == 0
      - Small bonus for higher rating
    """
    if not stations:
        return {
            "stationId": "",
            "name": "",
            "message": "No stations are currently available in the system.",
        }

    # Normalise query into keywords (strip common stop-words)
    stop_words = {"a", "an", "the", "in", "at", "on", "for", "to", "is", "are", "i", "me", "my", "near", "find", "show", "where", "can", "get", "charge", "charging"}
    keywords = [w.lower() for w in query.split() if w.lower() not in stop_words and len(w) > 1]

    # If no meaningful keywords remain, just return the best available station
    if not keywords:
        available = [s for s in stations if s.get("status", "").upper() == "AVAILABLE"]
        best = max(available or stations, key=lambda s: s.get("rating", 0))
        return {
            "stationId": best.get("stationId", ""),
            "name": best.get("name", ""),
            "message": f"I recommend {best.get('name', 'this station')} — it's currently available with a rating of {best.get('rating', 'N/A')}.",
        }

    scored: list[tuple[float, dict]] = []
    for station in stations:
        score = 0.0
        name_lower = station.get("name", "").lower()
        area_lower = station.get("area", "").lower()
        city_lower = station.get("city", "").lower()
        connector_types = " ".join(c.get("type", "").lower() for c in station.get("connectors", []))

        for kw in keywords:
            if kw in name_lower:
                score += 3
            if kw in area_lower:
                score += 2
            if kw in city_lower:
                score += 2
            if kw in connector_types:
                score += 1

        # Prefer available stations
        if station.get("status", "").upper() == "AVAILABLE":
            score += 5
        # Prefer no-wait stations
        if station.get("waitMinutes", 99) == 0:
            score += 3
        # Small rating bump
        score += station.get("rating", 0) * 0.5

        scored.append((score, station))

    scored.sort(key=lambda x: x[0], reverse=True)
    best_score, best = scored[0]

    if best_score < 1:
        # No real match — just pick best available
        available = [s for s in stations if s.get("status", "").upper() == "AVAILABLE"]
        best = max(available or stations, key=lambda s: s.get("rating", 0))
        message = (
            f"I couldn't find an exact match for \"{query}\", but I'd suggest "
            f"{best.get('name', 'this station')} in {best.get('area', best.get('city', 'your area'))}."
        )
    else:
        wait_info = ""
        wait_mins = best.get("waitMinutes", 0)
        if wait_mins > 0:
            wait_info = f" Estimated wait: {wait_mins} minutes."
        avail = best.get("availablePorts", "?")
        total = best.get("totalPorts", "?")
        message = (
            f"Based on your query, I recommend {best.get('name', 'this station')} "
            f"in {best.get('area', best.get('city', ''))}. "
            f"Status: {best.get('status', 'UNKNOWN')}. "
            f"Available ports: {avail}/{total}.{wait_info}"
        )

    return {
        "stationId": best.get("stationId", ""),
        "name": best.get("name", ""),
        "message": message,
    }
