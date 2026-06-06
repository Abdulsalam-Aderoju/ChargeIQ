"""
ChargeIQ NG — Pydantic Models & Schemas
Defines all request/response models for the API layer.
"""

from typing import Optional
from pydantic import BaseModel, Field


class Connector(BaseModel):
    """Individual charging connector on a station."""
    id: str = Field(..., description="Unique connector identifier")
    type: str = Field(..., description="Connector type: CCS2, CHAdeMO, or Type 2")
    power: int = Field(..., description="Power output in kW")
    status: str = Field(
        default="AVAILABLE",
        description="Connector status: AVAILABLE, IN_USE, OFFLINE, or MAINTENANCE",
    )


class Station(BaseModel):
    """Full station representation as stored in DynamoDB."""
    stationId: str = Field(..., description="Unique station identifier (UUID)")
    name: str = Field(..., description="Human-readable station name")
    address: str = Field(..., description="Full street address")
    lat: float = Field(..., description="Latitude")
    lng: float = Field(..., description="Longitude")
    city: str = Field(..., description="City name")
    area: str = Field(..., description="Area / neighbourhood within the city")
    operatorName: str = Field(..., description="Charging network operator")
    connectors: list[Connector] = Field(default_factory=list, description="List of connectors")
    status: str = Field(default="AVAILABLE", description="Overall station status")
    waitMinutes: int = Field(default=0, description="Estimated wait time in minutes")
    totalPorts: int = Field(default=0, description="Total number of charging ports")
    availablePorts: int = Field(default=0, description="Currently available ports")
    rating: float = Field(default=0.0, description="Average user rating (0-5)")
    lastUpdated: str = Field(default="", description="ISO-8601 timestamp of last update")
    totalSessions: int = Field(default=0, description="Lifetime charging sessions")
    utilizationPercent: float = Field(default=0.0, description="Current utilization percentage")


class StationCreate(BaseModel):
    """Request body for creating a new station (stationId is auto-generated)."""
    name: str = Field(..., description="Human-readable station name")
    address: str = Field(..., description="Full street address")
    lat: float = Field(..., description="Latitude")
    lng: float = Field(..., description="Longitude")
    city: str = Field(..., description="City name")
    area: str = Field(..., description="Area / neighbourhood within the city")
    operatorName: str = Field(..., description="Charging network operator")
    connectors: list[Connector] = Field(default_factory=list, description="List of connectors")
    status: str = Field(default="AVAILABLE", description="Overall station status")
    waitMinutes: int = Field(default=0, description="Estimated wait time in minutes")
    totalPorts: int = Field(default=0, description="Total number of charging ports")
    availablePorts: int = Field(default=0, description="Currently available ports")
    rating: float = Field(default=0.0, description="Average user rating (0-5)")


class StationStatusUpdate(BaseModel):
    """Request body for updating a station or connector status."""
    status: str = Field(..., description="New status value")
    connectorId: Optional[str] = Field(
        default=None,
        description="If provided, update only this connector instead of the whole station",
    )


class NLQueryRequest(BaseModel):
    """Natural-language search request."""
    query: str = Field(..., description="Free-text query from the user")


class NLQueryResponse(BaseModel):
    """Response from the NL query engine."""
    stationId: str = Field(..., description="Best-matching station ID")
    name: str = Field(..., description="Station name")
    message: str = Field(..., description="Human-readable answer")
    confidence: Optional[float] = Field(
        default=None,
        description="Confidence score (0-1) if available",
    )


class HeatmapPoint(BaseModel):
    """Single weighted point for the usage heatmap."""
    lat: float
    lng: float
    weight: float


class HeatmapResponse(BaseModel):
    """Collection of heatmap data points."""
    points: list[HeatmapPoint] = Field(default_factory=list)
