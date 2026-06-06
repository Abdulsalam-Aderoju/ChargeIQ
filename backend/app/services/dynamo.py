"""
ChargeIQ NG — DynamoDB Service
Provides all data-access methods for stations, availability logs, and user sessions.
"""

import math
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

STATIONS_TABLE = os.environ.get("DYNAMODB_STATIONS_TABLE", "chargeiq-stations")
AVAILABILITY_LOG_TABLE = os.environ.get("DYNAMODB_AVAILABILITY_TABLE", "chargeiq-availability")
USER_SESSIONS_TABLE = os.environ.get("USER_SESSIONS_TABLE", "chargeiq-sessions")

# Lazy-initialised DynamoDB resource (keeps Lambda warm-start friendly)
_dynamodb_resource = None


def _get_dynamodb():
    """Return a cached DynamoDB resource."""
    global _dynamodb_resource
    if _dynamodb_resource is None:
        _dynamodb_resource = boto3.resource("dynamodb", region_name=AWS_REGION)
    return _dynamodb_resource


def _stations_table():
    return _get_dynamodb().Table(STATIONS_TABLE)


def _availability_log_table():
    return _get_dynamodb().Table(AVAILABILITY_LOG_TABLE)


def _user_sessions_table():
    return _get_dynamodb().Table(USER_SESSIONS_TABLE)


# ---------------------------------------------------------------------------
# Haversine helper
# ---------------------------------------------------------------------------

_EARTH_RADIUS_KM = 6371.0


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return the great-circle distance in **kilometres** between two points."""
    lat1_r, lng1_r = math.radians(lat1), math.radians(lng1)
    lat2_r, lng2_r = math.radians(lat2), math.radians(lng2)

    dlat = lat2_r - lat1_r
    dlng = lng2_r - lng1_r

    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlng / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return _EARTH_RADIUS_KM * c


# ---------------------------------------------------------------------------
# Decimal → float/int conversion (DynamoDB returns Decimal)
# ---------------------------------------------------------------------------

def _convert_decimals(obj):
    """Recursively convert Decimal instances to int/float."""
    from decimal import Decimal

    if isinstance(obj, list):
        return [_convert_decimals(i) for i in obj]
    if isinstance(obj, dict):
        return {k: _convert_decimals(v) for k, v in obj.items()}
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    return obj


# ---------------------------------------------------------------------------
# Station CRUD
# ---------------------------------------------------------------------------

def get_all_stations(filters: Optional[dict] = None) -> list[dict]:
    """
    Scan the stations table and apply optional filters.

    Supported filter keys:
      - city, area, status, connectorType  (exact match)
      - lat, lng, radius                   (geo-radius in km)
    """
    filters = filters or {}
    table = _stations_table()

    try:
        response = table.scan()
        items = response.get("Items", [])

        # Handle pagination
        while "LastEvaluatedKey" in response:
            response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
            items.extend(response.get("Items", []))
    except ClientError as exc:
        raise RuntimeError(f"DynamoDB scan failed: {exc}") from exc

    items = [_convert_decimals(item) for item in items]

    # -- Apply filters --
    filtered = items

    if filters.get("city"):
        city_lower = filters["city"].lower()
        filtered = [s for s in filtered if s.get("city", "").lower() == city_lower]

    if filters.get("area"):
        area_lower = filters["area"].lower()
        filtered = [s for s in filtered if s.get("area", "").lower() == area_lower]

    if filters.get("status"):
        status_upper = filters["status"].upper()
        filtered = [s for s in filtered if s.get("status", "").upper() == status_upper]

    if filters.get("connectorType"):
        conn_type = filters["connectorType"].upper()
        filtered = [
            s for s in filtered
            if any(
                c.get("type", "").upper() == conn_type
                for c in s.get("connectors", [])
            )
        ]

    # Geo-radius filter
    if filters.get("lat") is not None and filters.get("lng") is not None and filters.get("radius") is not None:
        centre_lat = float(filters["lat"])
        centre_lng = float(filters["lng"])
        radius_km = float(filters["radius"])
        filtered = [
            s for s in filtered
            if haversine_distance(centre_lat, centre_lng, float(s.get("lat", 0)), float(s.get("lng", 0))) <= radius_km
        ]

    return filtered


def get_station(station_id: str) -> Optional[dict]:
    """Get a single station by its stationId."""
    table = _stations_table()
    try:
        response = table.get_item(Key={"stationId": station_id})
        item = response.get("Item")
        if item:
            return _convert_decimals(item)
        return None
    except ClientError as exc:
        raise RuntimeError(f"DynamoDB GetItem failed: {exc}") from exc


def create_station(station: dict) -> dict:
    """Create a new station. Auto-generates stationId and sets lastUpdated."""
    table = _stations_table()
    station["stationId"] = str(uuid.uuid4())
    station["lastUpdated"] = datetime.now(timezone.utc).isoformat()
    station.setdefault("totalSessions", 0)
    station.setdefault("utilizationPercent", 0)

    # Ensure numeric fields are stored as numbers (not strings)
    from decimal import Decimal

    def _to_dynamo(obj):
        if isinstance(obj, float):
            return Decimal(str(obj))
        if isinstance(obj, list):
            return [_to_dynamo(i) for i in obj]
        if isinstance(obj, dict):
            return {k: _to_dynamo(v) for k, v in obj.items()}
        return obj

    dynamo_item = _to_dynamo(station)

    try:
        table.put_item(Item=dynamo_item)
    except ClientError as exc:
        raise RuntimeError(f"DynamoDB PutItem failed: {exc}") from exc

    return station  # Return the original (non-Decimal) dict


def update_station_status(station_id: str, status: str, connector_id: Optional[str] = None) -> dict:
    """
    Update a station's status.  If *connector_id* is provided, update only that
    connector's status within the connectors list.  Always recalculates
    availablePorts and sets lastUpdated.
    """
    table = _stations_table()

    # Fetch the current item first so we can manipulate connectors
    current = get_station(station_id)
    if current is None:
        raise ValueError(f"Station {station_id} not found")

    now_iso = datetime.now(timezone.utc).isoformat()

    if connector_id:
        # Update a specific connector
        connectors = current.get("connectors", [])
        found = False
        for conn in connectors:
            if conn.get("id") == connector_id:
                conn["status"] = status
                found = True
                break
        if not found:
            raise ValueError(f"Connector {connector_id} not found on station {station_id}")

        # Recalculate availablePorts
        available = sum(1 for c in connectors if c.get("status", "").upper() == "AVAILABLE")

        # Determine overall station status from connectors
        statuses = [c.get("status", "").upper() for c in connectors]
        if all(s == "OFFLINE" for s in statuses):
            overall_status = "OFFLINE"
        elif all(s == "MAINTENANCE" for s in statuses):
            overall_status = "MAINTENANCE"
        elif any(s == "AVAILABLE" for s in statuses):
            overall_status = "AVAILABLE"
        else:
            overall_status = "IN_USE"

        from decimal import Decimal

        def _to_dynamo(obj):
            if isinstance(obj, float):
                return Decimal(str(obj))
            if isinstance(obj, list):
                return [_to_dynamo(i) for i in obj]
            if isinstance(obj, dict):
                return {k: _to_dynamo(v) for k, v in obj.items()}
            return obj

        try:
            table.update_item(
                Key={"stationId": station_id},
                UpdateExpression="SET connectors = :c, availablePorts = :ap, #st = :s, lastUpdated = :lu",
                ExpressionAttributeNames={"#st": "status"},
                ExpressionAttributeValues={
                    ":c": _to_dynamo(connectors),
                    ":ap": available,
                    ":s": overall_status,
                    ":lu": now_iso,
                },
            )
        except ClientError as exc:
            raise RuntimeError(f"DynamoDB UpdateItem failed: {exc}") from exc

        current["connectors"] = connectors
        current["availablePorts"] = available
        current["status"] = overall_status
        current["lastUpdated"] = now_iso
    else:
        # Update the whole station status
        connectors = current.get("connectors", [])
        available = sum(1 for c in connectors if c.get("status", "").upper() == "AVAILABLE")

        try:
            table.update_item(
                Key={"stationId": station_id},
                UpdateExpression="SET #st = :s, availablePorts = :ap, lastUpdated = :lu",
                ExpressionAttributeNames={"#st": "status"},
                ExpressionAttributeValues={
                    ":s": status,
                    ":ap": available,
                    ":lu": now_iso,
                },
            )
        except ClientError as exc:
            raise RuntimeError(f"DynamoDB UpdateItem failed: {exc}") from exc

        current["status"] = status
        current["availablePorts"] = available
        current["lastUpdated"] = now_iso

    return current


# ---------------------------------------------------------------------------
# Availability Log
# ---------------------------------------------------------------------------

def get_availability_log(station_id: str, hours: int = 24) -> list[dict]:
    """
    Query the availability log for a station over the last *hours* hours.
    Expects the table to have a partition key of 'stationId' and a sort key of
    'timestamp' (ISO-8601 string).
    """
    table = _availability_log_table()
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()

    try:
        response = table.query(
            KeyConditionExpression=Key("stationId").eq(station_id) & Key("timestamp").gte(cutoff),
            ScanIndexForward=True,
        )
        items = response.get("Items", [])

        while "LastEvaluatedKey" in response:
            response = table.query(
                KeyConditionExpression=Key("stationId").eq(station_id) & Key("timestamp").gte(cutoff),
                ScanIndexForward=True,
                ExclusiveStartKey=response["LastEvaluatedKey"],
            )
            items.extend(response.get("Items", []))

        return [_convert_decimals(item) for item in items]
    except ClientError as exc:
        raise RuntimeError(f"DynamoDB availability log query failed: {exc}") from exc


def log_availability(station_id: str, status: str, available_ports: int, wait_minutes: int) -> None:
    """Write a point-in-time availability record to the log table."""
    table = _availability_log_table()
    now_iso = datetime.now(timezone.utc).isoformat()

    item = {
        "stationId": station_id,
        "timestamp": now_iso,
        "status": status,
        "availablePorts": available_ports,
        "waitMinutes": wait_minutes,
    }

    try:
        table.put_item(Item=item)
    except ClientError as exc:
        raise RuntimeError(f"DynamoDB log_availability PutItem failed: {exc}") from exc


# ---------------------------------------------------------------------------
# Session aggregation (for heatmap)
# ---------------------------------------------------------------------------

def get_session_counts() -> list[dict]:
    """
    Scan the user sessions table and aggregate session counts per stationId.
    Returns a list of dicts: [{"stationId": "...", "count": N}, ...].
    """
    table = _user_sessions_table()

    try:
        response = table.scan()
        items = response.get("Items", [])

        while "LastEvaluatedKey" in response:
            response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
            items.extend(response.get("Items", []))
    except ClientError as exc:
        raise RuntimeError(f"DynamoDB session scan failed: {exc}") from exc

    # Aggregate by stationId
    counts: dict[str, int] = {}
    for item in items:
        sid = item.get("stationId", "unknown")
        counts[sid] = counts.get(sid, 0) + 1

    return [{"stationId": sid, "count": cnt} for sid, cnt in counts.items()]
