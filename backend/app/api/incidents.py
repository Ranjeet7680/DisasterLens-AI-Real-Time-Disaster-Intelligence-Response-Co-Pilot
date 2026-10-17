from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import json
import uuid

from ..database.db import get_connection
from ..schemas.models import IncidentCreate, Incident
from ..agents.orchestrator import orchestrator
from ..services.websocket_manager import ws_manager

router = APIRouter(prefix="/api/incidents", tags=["incidents"])

@router.get("", response_model=List[Dict[str, Any]])
def list_incidents(
    hazard_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100)
):
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM incidents WHERE is_active = 1"
    params = []

    if hazard_type:
        query += " AND hazard_type = ?"
        params.append(hazard_type)
    if severity:
        query += " AND severity = ?"
        params.append(severity)
    if status:
        query += " AND verification_status = ?"
        params.append(status)

    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()

    # Also join latest risk assessment if available
    incidents = []
    for r in rows:
        inc_id = r["incident_id"]
        cursor.execute("SELECT * FROM risk_assessments WHERE incident_id = ?", (inc_id,))
        risk = cursor.fetchone()
        
        inc_dict = {
            "incident_id": inc_id,
            "hazard_type": r["hazard_type"],
            "location": {
                "latitude": r["latitude"],
                "longitude": r["longitude"],
                "address": r["address"],
                "region": r["region"]
            },
            "severity": r["severity"],
            "reported_at": r["reported_at"],
            "source": r["source"],
            "verification_status": r["verification_status"],
            "description": r["description"],
            "duplicate_of": r["duplicate_of"],
            "is_active": bool(r["is_active"]),
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
            "risk_assessment": {
                "composite_score": risk["composite_score"],
                "severity_band": risk["severity_band"],
                "hard_safety_rule_triggered": bool(risk["hard_safety_rule_triggered"]),
                "safety_override_reason": risk["safety_override_reason"]
            } if risk else None
        }
        incidents.append(inc_dict)

    conn.close()
    return incidents

@router.post("", response_model=Dict[str, Any])
async def submit_incident(payload: IncidentCreate, auto_analyze: bool = True):
    conn = get_connection()
    cursor = conn.cursor()

    incident_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    reported_at = payload.reported_at or now

    cursor.execute("""
    INSERT INTO incidents (
        incident_id, hazard_type, latitude, longitude, address, region,
        severity, reported_at, source, verification_status, description,
        duplicate_of, is_active, created_at, updated_at, metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        incident_id,
        payload.hazard_type,
        payload.location.latitude,
        payload.location.longitude,
        payload.location.address or "Identified Sector",
        payload.location.region or "District Command",
        payload.severity,
        reported_at,
        payload.source,
        payload.verification_status or "unverified",
        payload.description,
        None,
        1,
        now,
        now,
        json.dumps(payload.metadata or {})
    ))

    # Audit event
    audit_id = f"AUD-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
    INSERT INTO audit_events (id, actor, event_type, timestamp, details_json, record_ids_json)
    VALUES (?, ?, 'incident_received', ?, ?, ?)
    """, (
        audit_id,
        payload.source,
        now,
        json.dumps({"incident_id": incident_id, "hazard_type": payload.hazard_type, "severity": payload.severity}),
        json.dumps([incident_id])
    ))

    conn.commit()
    conn.close()

    incident_dict = {
        "incident_id": incident_id,
        "hazard_type": payload.hazard_type,
        "location": payload.location.model_dump(),
        "severity": payload.severity,
        "reported_at": reported_at,
        "source": payload.source,
        "verification_status": payload.verification_status or "unverified",
        "description": payload.description,
        "duplicate_of": None,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }

    await ws_manager.broadcast("incident_created", incident_dict)

    if auto_analyze:
        analysis_result = await orchestrator.execute_workflow(incident_dict, actor="Automated Ingestion Pipeline")
        return {"incident": incident_dict, "analysis": analysis_result}

    return {"incident": incident_dict, "analysis": None}

@router.get("/{incident_id}", response_model=Dict[str, Any])
def get_incident_detail(incident_id: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM incidents WHERE incident_id = ?", (incident_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found")

    cursor.execute("SELECT * FROM risk_assessments WHERE incident_id = ?", (incident_id,))
    risk_row = cursor.fetchone()
    risk_data = None
    if risk_row:
        risk_data = {
            "composite_score": risk_row["composite_score"],
            "severity_band": risk_row["severity_band"],
            "hazard_score": risk_row["hazard_score"],
            "exposure_score": risk_row["exposure_score"],
            "vulnerability_score": risk_row["vulnerability_score"],
            "data_freshness_score": risk_row["data_freshness_score"],
            "calculation_formula": risk_row["calculation_formula"],
            "contributing_factors": json.loads(risk_row["contributing_factors_json"]),
            "hard_safety_rule_triggered": bool(risk_row["hard_safety_rule_triggered"]),
            "safety_override_reason": risk_row["safety_override_reason"],
            "assessed_at": risk_row["assessed_at"],
            "model_version": risk_row["model_version"]
        }

    cursor.execute("SELECT * FROM recommendations WHERE incident_id = ?", (incident_id,))
    recs = []
    for r in cursor.fetchall():
        recs.append({
            "id": r["id"],
            "incident_id": r["incident_id"],
            "action_type": r["action_type"],
            "proposed_action": r["proposed_action"],
            "priority": r["priority"],
            "required_resources": json.loads(r["required_resources_json"]),
            "evidence_references": json.loads(r["evidence_references_json"]),
            "required_approvals": r["required_approvals"],
            "status": r["status"],
            "reviewed_by": r["reviewed_by"],
            "reviewed_at": r["reviewed_at"],
            "review_notes": r["review_notes"]
        })

    cursor.execute("SELECT * FROM agent_runs WHERE incident_id = ? ORDER BY created_at ASC", (incident_id,))
    runs = []
    for run in cursor.fetchall():
        runs.append({
            "run_id": run["run_id"],
            "incident_id": run["incident_id"],
            "agent_name": run["agent_name"],
            "status": run["status"],
            "latency_ms": run["latency_ms"],
            "output": json.loads(run["output_json"]),
            "created_at": run["created_at"]
        })

    conn.close()

    return {
        "incident": {
            "incident_id": row["incident_id"],
            "hazard_type": row["hazard_type"],
            "location": {
                "latitude": row["latitude"],
                "longitude": row["longitude"],
                "address": row["address"],
                "region": row["region"]
            },
            "severity": row["severity"],
            "reported_at": row["reported_at"],
            "source": row["source"],
            "verification_status": row["verification_status"],
            "description": row["description"],
            "duplicate_of": row["duplicate_of"],
            "is_active": bool(row["is_active"]),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"]
        },
        "risk_assessment": risk_data,
        "recommendations": recs,
        "agent_runs": runs
    }

@router.post("/{incident_id}/analyze")
async def trigger_analysis(incident_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents WHERE incident_id = ?", (incident_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident_dict = {
        "incident_id": row["incident_id"],
        "hazard_type": row["hazard_type"],
        "location": {
            "latitude": row["latitude"],
            "longitude": row["longitude"],
            "address": row["address"],
            "region": row["region"]
        },
        "severity": row["severity"],
        "reported_at": row["reported_at"],
        "source": row["source"],
        "verification_status": row["verification_status"],
        "description": row["description"],
        "duplicate_of": row["duplicate_of"],
        "is_active": bool(row["is_active"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"]
    }

    brief = await orchestrator.execute_workflow(incident_dict, actor="Operator Manual Trigger")
    return brief
