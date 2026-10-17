import time
import uuid
from typing import Dict, Any, List
from datetime import datetime, timezone
from ..database.db import get_connection
from .validation import haversine_distance

class ResponsePlanningAgent:
    name: str = "Response Planning Agent"

    async def run(
        self,
        incident: Dict[str, Any],
        hazard_intel: Dict[str, Any],
        validation_intel: Dict[str, Any],
        risk_intel: Dict[str, Any]
    ) -> Dict[str, Any]:
        start_time = time.time()
        incident_id = incident.get("incident_id")
        loc = incident.get("location", {})
        lat = loc.get("latitude", 23.3441)
        lon = loc.get("longitude", 85.3096)
        sev_band = risk_intel.get("severity_band", "MEDIUM")
        hard_override = risk_intel.get("hard_safety_rule_triggered", False)
        desc = incident.get("description", "").lower()

        # Query available resources from DB
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM resources WHERE status = 'available'")
        available_resources = cursor.fetchall()
        conn.close()

        # Sort resources by proximity
        res_list = []
        for r in available_resources:
            dist = haversine_distance(lat, lon, r["latitude"], r["longitude"])
            res_list.append({
                "id": r["id"],
                "name": r["name"],
                "type": r["resource_type"],
                "capacity": r["capacity"],
                "available_capacity": r["available_capacity"],
                "distance_km": round(dist, 2),
                "address": r["address"],
                "contact": r["contact"]
            })
        res_list.sort(key=lambda x: x["distance_km"])

        recommendations: List[Dict[str, Any]] = []

        # Find closest rescue boat or platoon
        rescue_units = [r for r in res_list if r["type"] in ["rescue_boat", "ndrf_platoon"]]
        shelters = [r for r in res_list if r["type"] == "evacuation_shelter"]
        pumps = [r for r in res_list if r["type"] == "water_pump"]
        medical = [r for r in res_list if r["type"] == "medical_team"]
        drones = [r for r in res_list if r["type"] == "emergency_drone"]

        # Option 1: Immediate Life Safety & Evacuation
        if sev_band in ["CRITICAL", "HIGH"] or hard_override or "trapped" in desc or "water rising" in desc:
            assigned_unit = rescue_units[0] if rescue_units else {"name": "Regional SDRF Quick Response Unit", "distance_km": 3.2}
            rec1_id = f"REC-{uuid.uuid4().hex[:6].upper()}"
            recommendations.append({
                "id": rec1_id,
                "incident_id": incident_id,
                "action_type": "dispatch_rescue",
                "proposed_action": f"Deploy {assigned_unit['name']} ({assigned_unit.get('distance_km', 3.0)} km away) for emergency water rescue and perimeter evacuation.",
                "priority": "IMMEDIATE" if hard_override or sev_band == "CRITICAL" else "HIGH",
                "required_resources": [
                    {"resource_type": "rescue_boat", "quantity": 2, "notes": f"Staged from {assigned_unit.get('address', 'Depot')}"},
                    {"resource_type": "life_jackets", "quantity": 50, "notes": "Rapid civilian distribution"}
                ],
                "evidence_references": [
                    f"Hazard Stage: {hazard_intel.get('flood_stage')}",
                    f"Risk Band: {sev_band} (Score: {risk_intel.get('composite_score')}/100)"
                ] + ([risk_intel.get("safety_override_reason")] if hard_override else []),
                "required_approvals": "EOC Incident Commander sign-off required",
                "status": "pending_review"
            })

        # Option 2: Shelter Activation & Medical Standby
        if shelters:
            nearest_shelter = shelters[0]
            rec2_id = f"REC-{uuid.uuid4().hex[:6].upper()}"
            recommendations.append({
                "id": rec2_id,
                "incident_id": incident_id,
                "action_type": "evacuate_area",
                "proposed_action": f"Issue Stage-2 Relocation Notice and prepare {nearest_shelter['name']} (Available capacity: {nearest_shelter['available_capacity']} evacuees).",
                "priority": "HIGH" if sev_band in ["CRITICAL", "HIGH"] else "STANDARD",
                "required_resources": [
                    {"resource_type": "evacuation_shelter", "quantity": 1, "notes": f"{nearest_shelter['name']} at {nearest_shelter['address']}"},
                    {"resource_type": "medical_team", "quantity": 1, "notes": "Mobile triage kit standby"}
                ],
                "evidence_references": [
                    f"Affected radius: {hazard_intel.get('affected_area_radius_km')} km",
                    f"Forecast window: {hazard_intel.get('forecast_window')}"
                ],
                "required_approvals": "District Disaster Management Authority (DDMA) concurrence",
                "status": "pending_review"
            })

        # Option 3: Mitigation / Dewatering & Aerial Recon
        if pumps:
            nearest_pump = pumps[0]
            rec3_id = f"REC-{uuid.uuid4().hex[:6].upper()}"
            recommendations.append({
                "id": rec3_id,
                "incident_id": incident_id,
                "action_type": "deploy_pumps",
                "proposed_action": f"Position {nearest_pump['name']} to alleviate inundated culverts and preserve emergency egress routes.",
                "priority": "STANDARD",
                "required_resources": [
                    {"resource_type": "water_pump", "quantity": 2, "notes": "Submersible diesel pump 5000L/min"}
                ],
                "evidence_references": [
                    f"Precipitation reading: {hazard_intel.get('weather_context', {}).get('precipitation_mm', 20.0)} mm/hr"
                ],
                "required_approvals": "Municipal Engineering Duty Officer",
                "status": "pending_review"
            })

        # Drone Recon option if available
        if drones:
            rec4_id = f"REC-{uuid.uuid4().hex[:6].upper()}"
            recommendations.append({
                "id": rec4_id,
                "incident_id": incident_id,
                "action_type": "inspect_levee",
                "proposed_action": f"Launch {drones[0]['name']} for real-time aerial infrared mapping of flood breach and impassable roads.",
                "priority": "STANDARD",
                "required_resources": [
                    {"resource_type": "emergency_drone", "quantity": 1, "notes": "Thermal sensor payload"}
                ],
                "evidence_references": [
                    "Need visual verification of inundated access routes prior to vehicle convoy dispatch"
                ],
                "required_approvals": "EOC Operations Officer",
                "status": "pending_review"
            })

        unresolved_information = [
            "Real-time road surface passability unconfirmed by local highway patrol.",
            "Cellular base station backup battery duration remaining estimated at 4.5 hours."
        ]

        latency_ms = int((time.time() - start_time) * 1000)

        return {
            "agent_name": self.name,
            "status": "success",
            "latency_ms": latency_ms,
            "recommended_options": recommendations,
            "matched_nearby_resources": res_list[:4],
            "unresolved_information": unresolved_information,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
