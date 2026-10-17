import time
import json
import uuid
from typing import Dict, Any, List
from datetime import datetime, timezone
import logging

from ..database.db import get_connection
from .hazard import HazardIntelligenceAgent
from .validation import ReportValidationAgent
from .risk import RiskAssessmentAgent
from .response import ResponsePlanningAgent
from ..services.llm_service import generate_briefing
from ..services.websocket_manager import ws_manager

logger = logging.getLogger("disasterlens.orchestrator")

class DecisionOrchestrator:
    def __init__(self):
        self.hazard_agent = HazardIntelligenceAgent()
        self.validation_agent = ReportValidationAgent()
        self.risk_agent = RiskAssessmentAgent()
        self.response_agent = ResponsePlanningAgent()

    async def execute_workflow(self, incident: Dict[str, Any], actor: str = "System Automated Pipeline") -> Dict[str, Any]:
        incident_id = incident.get("incident_id")
        total_start = time.time()
        agent_runs: List[Dict[str, Any]] = []

        conn = get_connection()
        cursor = conn.cursor()

        # Helper to log agent run
        def record_run(agent_name: str, status: str, latency: int, output_data: dict):
            run_id = f"RUN-{uuid.uuid4().hex[:8]}"
            now = datetime.now(timezone.utc).isoformat()
            cursor.execute("""
            INSERT INTO agent_runs (run_id, incident_id, agent_name, status, latency_ms, output_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (run_id, incident_id, agent_name, status, latency, json.dumps(output_data), now))
            agent_runs.append({
                "run_id": run_id,
                "incident_id": incident_id,
                "agent_name": agent_name,
                "status": status,
                "latency_ms": latency,
                "output": output_data,
                "created_at": now
            })

        # 1. Hazard Intelligence Agent
        h_start = time.time()
        try:
            hazard_output = await self.hazard_agent.run(incident)
            record_run(self.hazard_agent.name, "success", int((time.time() - h_start) * 1000), hazard_output)
        except Exception as e:
            logger.error(f"Hazard Agent failure: {e}")
            hazard_output = {"hazard_severity_score": 60.0, "observed_indicators": ["Sensor fallback threshold applied"], "flood_stage": "Warning Stage", "affected_area_radius_km": 2.0, "forecast_window": "+12 hours"}
            record_run(self.hazard_agent.name, "fallback", int((time.time() - h_start) * 1000), hazard_output)

        # 2. Report Validation Agent
        v_start = time.time()
        try:
            validation_output = await self.validation_agent.run(incident)
            record_run(self.validation_agent.name, "success", int((time.time() - v_start) * 1000), validation_output)
        except Exception as e:
            logger.error(f"Validation Agent failure: {e}")
            validation_output = {"validation_status": "provisional", "credibility_score": 0.70, "evidence_references": [], "unresolved_conflicts": [str(e)]}
            record_run(self.validation_agent.name, "fallback", int((time.time() - v_start) * 1000), validation_output)

        # Update incident duplicate status in DB if detected
        if validation_output.get("is_duplicate"):
            dup_target = validation_output.get("duplicate_of")
            cursor.execute("""
            UPDATE incidents SET verification_status = 'flagged_duplicate', duplicate_of = ?, updated_at = ?
            WHERE incident_id = ?
            """, (dup_target, datetime.now(timezone.utc).isoformat(), incident_id))

        # 3. Risk Assessment Agent
        r_start = time.time()
        try:
            risk_output = await self.risk_agent.run(incident, hazard_output, validation_output)
            record_run(self.risk_agent.name, "success", int((time.time() - r_start) * 1000), risk_output)
        except Exception as e:
            logger.error(f"Risk Agent failure: {e}")
            risk_output = {
                "composite_score": 65.0,
                "severity_band": "HIGH",
                "hazard_score": 60.0,
                "exposure_score": 60.0,
                "vulnerability_score": 50.0,
                "data_freshness_score": 70.0,
                "calculation_formula": "R = 0.40 * H + 0.30 * E + 0.20 * V + 0.10 * D",
                "contributing_factors": ["Fallback risk model applied"],
                "hard_safety_rule_triggered": False,
                "safety_override_reason": None,
                "assessed_at": datetime.now(timezone.utc).isoformat(),
                "model_version": "v1.0-fallback"
            }
            record_run(self.risk_agent.name, "fallback", int((time.time() - r_start) * 1000), risk_output)

        # Persist Risk Assessment in DB
        cursor.execute("""
        INSERT OR REPLACE INTO risk_assessments (
            incident_id, composite_score, severity_band, hazard_score, exposure_score,
            vulnerability_score, data_freshness_score, calculation_formula,
            contributing_factors_json, hard_safety_rule_triggered, safety_override_reason,
            assessed_at, model_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            incident_id,
            risk_output["composite_score"],
            risk_output["severity_band"],
            risk_output["hazard_score"],
            risk_output["exposure_score"],
            risk_output["vulnerability_score"],
            risk_output["data_freshness_score"],
            risk_output["calculation_formula"],
            json.dumps(risk_output["contributing_factors"]),
            1 if risk_output["hard_safety_rule_triggered"] else 0,
            risk_output["safety_override_reason"],
            risk_output["assessed_at"],
            risk_output["model_version"]
        ))

        # 4. Response Planning Agent
        resp_start = time.time()
        try:
            response_output = await self.response_agent.run(incident, hazard_output, validation_output, risk_output)
            record_run(self.response_agent.name, "success", int((time.time() - resp_start) * 1000), response_output)
        except Exception as e:
            logger.error(f"Response Agent failure: {e}")
            response_output = {"recommended_options": [], "unresolved_information": [str(e)]}
            record_run(self.response_agent.name, "fallback", int((time.time() - resp_start) * 1000), response_output)

        recommendations = response_output.get("recommended_options", [])

        # Persist Recommendations into DB
        for rec in recommendations:
            cursor.execute("""
            INSERT OR REPLACE INTO recommendations (
                id, incident_id, action_type, proposed_action, priority,
                required_resources_json, evidence_references_json, required_approvals,
                status, reviewed_by, reviewed_at, review_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                rec["id"],
                incident_id,
                rec["action_type"],
                rec["proposed_action"],
                rec["priority"],
                json.dumps(rec.get("required_resources", [])),
                json.dumps(rec.get("evidence_references", [])),
                rec.get("required_approvals", ""),
                rec.get("status", "pending_review"),
                None, None, None
            ))

        # 5. Alert Generation
        sev_band = risk_output["severity_band"]
        if sev_band in ["CRITICAL", "HIGH"] or risk_output["hard_safety_rule_triggered"]:
            alert_id = f"ALT-{uuid.uuid4().hex[:6].upper()}"
            title = f"{sev_band} DISASTER ALERT: {incident.get('hazard_type', 'Flood').title()}"
            if risk_output["hard_safety_rule_triggered"]:
                title = f"[EMERGENCY ESCALATION] {incident.get('hazard_type', 'Flood').title()}"
            
            message = (
                f"Incident {incident_id} at {incident.get('location', {}).get('region', 'Area')}: "
                f"Risk Score {risk_output['composite_score']:.1f}/100. "
                f"{recommendations[0]['proposed_action'] if recommendations else 'Immediate assessment required.'}"
            )
            now = datetime.now(timezone.utc).isoformat()
            cursor.execute("""
            INSERT INTO alerts (id, incident_id, title, message, severity, created_at, state)
            VALUES (?, ?, ?, ?, ?, ?, 'active')
            """, (alert_id, incident_id, title, message, sev_band.lower(), now))

        # 6. Synthesize Multilingual Briefing (English & Hindi)
        summary_en, summary_hi = await generate_briefing(incident, risk_output, hazard_output, recommendations)

        # 7. Record Audit Event
        audit_id = f"AUD-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute("""
        INSERT INTO audit_events (id, actor, event_type, timestamp, details_json, record_ids_json)
        VALUES (?, ?, 'agent_workflow_executed', ?, ?, ?)
        """, (
            audit_id,
            actor,
            now,
            json.dumps({
                "incident_id": incident_id,
                "composite_score": risk_output["composite_score"],
                "severity_band": risk_output["severity_band"],
                "hard_safety_triggered": risk_output["hard_safety_rule_triggered"],
                "recommendation_count": len(recommendations)
            }),
            json.dumps([incident_id, audit_id] + [r["id"] for r in recommendations])
        ))

        conn.commit()
        conn.close()

        total_latency = int((time.time() - total_start) * 1000)

        decision_brief = {
            "incident": incident,
            "risk_assessment": risk_output,
            "validation_status": validation_output,
            "hazard_intelligence": hazard_output,
            "recommendations": recommendations,
            "agent_runs": agent_runs,
            "total_latency_ms": total_latency,
            "summary_text_en": summary_en,
            "summary_text_hi": summary_hi,
            "workflow_completed_at": datetime.now(timezone.utc).isoformat()
        }

        # Broadcast real-time update to WebSocket clients
        await ws_manager.broadcast("incident_analyzed", decision_brief)

        return decision_brief

orchestrator = DecisionOrchestrator()
