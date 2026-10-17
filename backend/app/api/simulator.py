from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timezone
import json
import uuid

from ..services.simulator import PRESET_SCENARIOS, generate_scenario_incident
from ..database.db import get_connection
from ..agents.orchestrator import orchestrator
from ..services.websocket_manager import ws_manager

router = APIRouter(prefix="/api/simulator", tags=["simulator"])

@router.get("/scenarios")
def list_scenarios():
    scenarios = []
    for key, data in PRESET_SCENARIOS.items():
        scenarios.append({
            "key": key,
            "title": data["title"],
            "hazard_type": data["hazard_type"],
            "severity": data["severity"],
            "source": data["source"],
            "description": data["description"],
            "location": data["location"]
        })
    return scenarios

@router.post("/trigger")
async def trigger_scenario(payload: Dict[str, Any]):
    scenario_key = payload.get("scenario_key", "flash_flood_subarnarekha")
    incident_dict = generate_scenario_incident(scenario_key)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO incidents (
        incident_id, hazard_type, latitude, longitude, address, region,
        severity, reported_at, source, verification_status, description,
        duplicate_of, is_active, created_at, updated_at, metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        incident_dict["incident_id"],
        incident_dict["hazard_type"],
        incident_dict["location"]["latitude"],
        incident_dict["location"]["longitude"],
        incident_dict["location"]["address"],
        incident_dict["location"]["region"],
        incident_dict["severity"],
        incident_dict["reported_at"],
        incident_dict["source"],
        incident_dict["verification_status"],
        incident_dict["description"],
        incident_dict["duplicate_of"],
        incident_dict["is_active"],
        incident_dict["created_at"],
        incident_dict["updated_at"],
        json.dumps(incident_dict["metadata"])
    ))

    # Audit event for simulator trigger
    cursor.execute("""
    INSERT INTO audit_events (id, actor, event_type, timestamp, details_json, record_ids_json)
    VALUES (?, 'Hackathon Demo Simulator', 'incident_simulated', ?, ?, ?)
    """, (
        f"AUD-SIM-{incident_dict['incident_id']}",
        datetime.now(timezone.utc).isoformat(),
        json.dumps({"scenario_key": scenario_key, "incident_id": incident_dict["incident_id"]}),
        json.dumps([incident_dict["incident_id"]])
    ))
    conn.commit()
    conn.close()

    await ws_manager.broadcast("incident_created", incident_dict)

    # Automatically run the multi-agent decision workflow
    analysis = await orchestrator.execute_workflow(incident_dict, actor=f"Simulator [{scenario_key}]")

    return {
        "status": "triggered",
        "scenario": scenario_key,
        "incident": incident_dict,
        "analysis": analysis
    }
