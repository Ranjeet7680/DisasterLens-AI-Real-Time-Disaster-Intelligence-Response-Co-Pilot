import time
from typing import Dict, Any, List, Tuple
from datetime import datetime, timezone

class RiskAssessmentAgent:
    name: str = "Risk Assessment Agent"

    async def run(self, incident: Dict[str, Any], hazard_intel: Dict[str, Any], validation_intel: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.time()
        desc = incident.get("description", "").lower()
        reported_sev = incident.get("severity", "medium").lower()

        # 1. Hazard Severity Component (H: 40%) [0-100]
        hazard_score = float(hazard_intel.get("hazard_severity_score", 50.0))
        if reported_sev == "critical":
            hazard_score = max(hazard_score, 85.0)
        elif reported_sev == "high":
            hazard_score = max(hazard_score, 70.0)

        # 2. Population Exposure Component (E: 30%) [0-100]
        exposure_score = 55.0  # default baseline
        loc = incident.get("location", {})
        region = str(loc.get("region", "")).lower()
        address = str(loc.get("address", "")).lower()

        if any(w in desc or w in address for w in ["hospital", "rims", "clinic", "icu", "patients"]):
            exposure_score = 92.0
        elif any(w in desc or w in address for w in ["residential", "colony", "slum", "basti", "market", "school", "station"]):
            exposure_score = 80.0
        elif "dense" in desc or "apartments" in desc or "hundreds" in desc or "families" in desc:
            exposure_score = 85.0
        elif "rural" in desc or "farmland" in desc or "highway" in desc:
            exposure_score = 38.0

        # 3. Community Vulnerability Component (V: 20%) [0-100]
        vulnerability_score = 50.0
        if any(w in desc for w in ["elderly", "children", "disabled", "power outage", "darkness", "cut off", "no boats"]):
            vulnerability_score = 88.0
        elif any(w in desc for w in ["low-lying", "kutcha", "mud houses", "riverbank", "slum", "drainage blocked"]):
            vulnerability_score = 78.0
        elif any(w in desc for w in ["pucca", "elevated", "concrete levee"]):
            vulnerability_score = 35.0

        # 4. Data Reliability & Freshness Component (D: 10%) [0-100]
        credibility = float(validation_intel.get("credibility_score", 0.70))
        # Evaluate freshness
        freshness_score = 90.0  # default fresh within current hour
        data_score = round(credibility * freshness_score, 1)

        # Composite Calculation: R = 0.40*H + 0.30*E + 0.20*V + 0.10*D
        raw_composite = (0.40 * hazard_score) + (0.30 * exposure_score) + (0.20 * vulnerability_score) + (0.10 * data_score)
        raw_composite = round(min(100.0, max(0.0, raw_composite)), 1)

        # Contributing factors breakdown
        contributing_factors: List[str] = [
            f"Hazard Severity (40% weight): {hazard_score:.1f}/100 based on observed indicators and flood stage",
            f"Population Exposure (30% weight): {exposure_score:.1f}/100 considering urban density and vulnerable facilities",
            f"Community Vulnerability (20% weight): {vulnerability_score:.1f}/100 factoring terrain elevation and community resilience",
            f"Evidence Quality & Freshness (10% weight): {data_score:.1f}/100 calculated from source credibility ({credibility}) and freshness ({freshness_score:.1f})"
        ]

        # 5. Hard Safety Escalation Rules (Imminent Danger Override)
        imminent_threat_keywords = [
            "trapped", "stranded", "swept away", "drowning", "dam breach", 
            "spillway open", "submerged hospital", "levee collapse", 
            "life threatening", "evacuate immediately"
        ]
        hard_safety_triggered = False
        override_reason = None

        matched_keywords = [kw for kw in imminent_threat_keywords if kw in desc]
        if matched_keywords:
            hard_safety_triggered = True
            override_reason = f"Imminent danger phrase detected ('{matched_keywords[0]}'): Safety policy strictly overrides composite score to prevent suppression."
        elif hazard_score >= 88.0 and exposure_score >= 75.0:
            hard_safety_triggered = True
            override_reason = "Compound high hazard severity and high population exposure trigger mandatory critical review."

        # Severity Band classification
        if hard_safety_triggered:
            severity_band = "CRITICAL"
            effective_score = max(raw_composite, 85.0)
        elif raw_composite >= 75.0:
            severity_band = "CRITICAL"
            effective_score = raw_composite
        elif raw_composite >= 55.0:
            severity_band = "HIGH"
            effective_score = raw_composite
        elif raw_composite >= 35.0:
            severity_band = "MEDIUM"
            effective_score = raw_composite
        else:
            severity_band = "LOW"
            effective_score = raw_composite

        latency_ms = int((time.time() - start_time) * 1000)

        return {
            "agent_name": self.name,
            "status": "success",
            "latency_ms": latency_ms,
            "composite_score": effective_score,
            "raw_composite_score": raw_composite,
            "severity_band": severity_band,
            "hazard_score": hazard_score,
            "exposure_score": exposure_score,
            "vulnerability_score": vulnerability_score,
            "data_freshness_score": data_score,
            "calculation_formula": "R = 0.40 * H + 0.30 * E + 0.20 * V + 0.10 * D",
            "contributing_factors": contributing_factors,
            "hard_safety_rule_triggered": hard_safety_triggered,
            "safety_override_reason": override_reason,
            "assessed_at": datetime.now(timezone.utc).isoformat(),
            "model_version": "v1.0-deterministic-hybrid"
        }
