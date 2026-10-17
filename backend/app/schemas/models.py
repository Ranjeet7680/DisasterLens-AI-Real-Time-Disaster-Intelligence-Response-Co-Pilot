from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class Location(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    address: Optional[str] = None
    region: Optional[str] = "Default District"

class IncidentCreate(BaseModel):
    hazard_type: str = Field(default="flood", description="Hazard type (e.g. flood, flash_flood, cyclone, extreme_weather)")
    location: Location
    severity: str = Field(default="medium", description="Reported severity: low, medium, high, critical")
    reported_at: Optional[str] = None
    source: str = Field(default="operator", description="Source: citizen_report, sensor_stream, operator, demo_simulator, weather_alert")
    description: str
    verification_status: Optional[str] = "unverified"
    metadata: Optional[Dict[str, Any]] = None

class Incident(BaseModel):
    incident_id: str
    hazard_type: str
    location: Location
    severity: str
    reported_at: str
    source: str
    verification_status: str
    description: str
    duplicate_of: Optional[str] = None
    is_active: bool = True
    created_at: str
    updated_at: str
    metadata: Optional[Dict[str, Any]] = None

class EvidenceItem(BaseModel):
    id: str
    incident_id: str
    source: str
    observed_at: str
    indicator_name: str
    indicator_value: Any
    confidence: float = 1.0
    raw_payload: Optional[Dict[str, Any]] = None

class RiskAssessment(BaseModel):
    incident_id: str
    composite_score: float
    severity_band: str
    hazard_score: float
    exposure_score: float
    vulnerability_score: float
    data_freshness_score: float
    calculation_formula: str
    contributing_factors: List[str]
    hard_safety_rule_triggered: bool
    safety_override_reason: Optional[str] = None
    assessed_at: str
    model_version: str = "v1.0-deterministic-hybrid"

class RequiredResource(BaseModel):
    resource_type: str
    quantity: int
    notes: Optional[str] = None

class Recommendation(BaseModel):
    id: str
    incident_id: str
    action_type: str
    proposed_action: str
    priority: str
    required_resources: List[RequiredResource]
    evidence_references: List[str]
    required_approvals: str
    status: str = "pending_review"  # pending_review, approved, rejected, modified, dispatched
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    review_notes: Optional[str] = None

class RecommendationReview(BaseModel):
    decision: str = Field(..., description="approved, rejected, modified")
    reviewed_by: str = Field(default="EOC Commander")
    review_notes: Optional[str] = ""
    modified_action: Optional[str] = None

class Alert(BaseModel):
    id: str
    incident_id: str
    title: str
    message: str
    severity: str
    created_at: str
    state: str = "active"  # active, acknowledged, resolved
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[str] = None

class Resource(BaseModel):
    id: str
    name: str
    resource_type: str  # rescue_boat, medical_team, evacuation_shelter, water_pump, emergency_drone, ndrf_platoon
    capacity: int
    available_capacity: int
    location: Location
    status: str = "available"  # available, deployed, maintenance
    contact: str
    last_updated: str

class AgentRun(BaseModel):
    run_id: str
    incident_id: str
    agent_name: str
    status: str  # success, fallback, failed
    latency_ms: int
    output: Dict[str, Any]
    created_at: str

class AuditEvent(BaseModel):
    id: str
    actor: str
    event_type: str
    timestamp: str
    details: Dict[str, Any]
    record_ids: List[str]

class DecisionBrief(BaseModel):
    incident: Incident
    risk_assessment: Optional[RiskAssessment] = None
    validation_status: Dict[str, Any]
    hazard_intelligence: Dict[str, Any]
    recommendations: List[Recommendation] = []
    agent_runs: List[AgentRun] = []
    summary_text_en: str
    summary_text_hi: Optional[str] = None
