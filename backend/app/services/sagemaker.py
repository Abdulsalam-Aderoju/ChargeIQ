"""
ChargeIQ NG — SageMaker Service
Calls a SageMaker endpoint for wait-time predictions and provides a
deterministic fallback when the endpoint is unavailable.
"""

import json
import logging
import os

import boto3
from botocore.exceptions import BotoCoreError, ClientError

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
SAGEMAKER_ENDPOINT = os.environ.get("SAGEMAKER_ENDPOINT", "chargeiq-waittime-endpoint")

_sagemaker_client = None


def _get_sagemaker_client():
    """Lazy-init SageMaker Runtime client."""
    global _sagemaker_client
    if _sagemaker_client is None:
        _sagemaker_client = boto3.client("sagemaker-runtime", region_name=AWS_REGION)
    return _sagemaker_client


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def predict_wait_time(station_id: str, hour: int, day_of_week: int) -> int:
    """
    Predict the expected wait time (in minutes) for a station.

    Parameters
    ----------
    station_id : str
        Station identifier (used as a feature for the model).
    hour : int
        Hour of the day (0-23).
    day_of_week : int
        Day of the week (0 = Monday … 6 = Sunday).

    Returns
    -------
    int
        Predicted wait time in minutes (≥ 0).
    """
    try:
        return _invoke_sagemaker(station_id, hour, day_of_week)
    except Exception as exc:
        logger.warning("SageMaker prediction failed (%s); using fallback.", exc)
        return _fallback_wait_time(station_id, hour, day_of_week)


# ---------------------------------------------------------------------------
# SageMaker invocation
# ---------------------------------------------------------------------------

def _invoke_sagemaker(station_id: str, hour: int, day_of_week: int) -> int:
    """Call the SageMaker endpoint with a CSV payload and parse the result."""
    client = _get_sagemaker_client()

    # Encode station_id as a simple hash feature so the model gets a numeric input
    station_hash = abs(hash(station_id)) % 10000

    csv_payload = f"{station_hash},{hour},{day_of_week}"

    response = client.invoke_endpoint(
        EndpointName=SAGEMAKER_ENDPOINT,
        ContentType="text/csv",
        Accept="application/json",
        Body=csv_payload.encode("utf-8"),
    )

    result_body = response["Body"].read().decode("utf-8").strip()

    # The endpoint may return plain text (a single float) or JSON
    try:
        parsed = json.loads(result_body)
        if isinstance(parsed, (int, float)):
            value = parsed
        elif isinstance(parsed, dict):
            # Common SageMaker response shapes
            value = parsed.get("predictions", [parsed.get("prediction", 0)])[0] if "predictions" in parsed or "prediction" in parsed else float(list(parsed.values())[0])
        elif isinstance(parsed, list):
            value = parsed[0] if parsed else 0
        else:
            value = float(result_body)
    except (json.JSONDecodeError, ValueError, TypeError):
        value = float(result_body)

    return max(0, round(value))


# ---------------------------------------------------------------------------
# Deterministic fallback
# ---------------------------------------------------------------------------

def _fallback_wait_time(station_id: str, hour: int, day_of_week: int) -> int:
    """
    Return a plausible wait time without calling any external service.

    The result is deterministic for a given (station_id, hour, day_of_week)
    tuple so repeated calls return stable values.

    Heuristic:
      - Peak morning (7–10):  higher waits
      - Peak evening (17–20): higher waits
      - Weekdays:             slightly higher than weekends
      - Off-peak / night:     low or zero waits
      - Station hash adds some per-station variation
    """
    # Derive a small per-station "seed" (0–9)
    station_seed = abs(hash(station_id)) % 10

    # Base wait by time-of-day band
    if 7 <= hour <= 10:
        base = 12  # morning rush
    elif 17 <= hour <= 20:
        base = 15  # evening rush
    elif 11 <= hour <= 16:
        base = 6   # midday
    elif 21 <= hour <= 23:
        base = 4   # late evening
    else:
        base = 2   # night / early morning

    # Weekday multiplier (Mon-Fri = 0-4 → 1.0; Sat-Sun = 5-6 → 0.6)
    if day_of_week < 5:
        base = int(base * 1.0)
    else:
        base = int(base * 0.6)

    # Station-specific jitter (deterministic)
    jitter = (station_seed * 3 + hour) % 7  # 0–6 minutes

    return max(0, base + jitter)
