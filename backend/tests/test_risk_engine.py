import pytest
from backend.app.agents.risk import RiskAssessmentAgent

@pytest.mark.asyncio
async def test_risk_formula_calculation():
    agent = RiskAssessmentAgent()
    
    incident = {
        "incident_id": "TEST-001",
        "hazard_type": "flood",
        "description": "Standard seasonal waterlogging along arterial highway with moderate runoff.",
        "severity": "medium",
        "location": {"latitude": 23.35, "longitude": 85.32, "region": "Suburban", "address": "Highway 33"}
    }
    
    hazard_intel = {
        "hazard_severity_score": 85.0
    }
    
    validation_intel = {
        "credibility_score": 0.60
    }
    
    # In this incident:
    # H = 85.0
    # E = 38.0 (highway/farmland)
    # V = 50.0 (baseline)
    # D = 0.60 * 90.0 = 54.0
    # Expected R = 0.40*85.0 + 0.30*38.0 + 0.20*50.0 + 0.10*54.0
    #            = 34.0 + 11.4 + 10.0 + 5.4 = 60.8
    result = await agent.run(incident, hazard_intel, validation_intel)
    
    assert result["status"] == "success"
    assert result["hazard_score"] == 85.0
    assert result["data_freshness_score"] == 54.0
    assert abs(result["raw_composite_score"] - 60.8) < 0.1
    assert result["severity_band"] in ["HIGH", "CRITICAL"]

@pytest.mark.asyncio
async def test_hard_safety_rule_imminent_danger_override():
    """
    Test Section 5 Production Requirement:
    'Separate hard safety rules must override a low composite score when a credible imminent-danger report is received.'
    'A low score must never suppress a credible emergency alert solely because the data is incomplete.'
    """
    agent = RiskAssessmentAgent()
    
    # Unverified citizen report with sparse data, but mentioning trapped civilians
    incident = {
        "incident_id": "TEST-OVERRIDE",
        "hazard_type": "flash_flood",
        "description": "Civilians trapped in rooftop shelter surrounded by sudden torrent.",
        "severity": "low",
        "location": {"latitude": 23.34, "longitude": 85.30}
    }
    hazard_intel = {"hazard_severity_score": 30.0}
    validation_intel = {"credibility_score": 0.50}
    
    result = await agent.run(incident, hazard_intel, validation_intel)
    
    assert result["hard_safety_rule_triggered"] is True
    assert "trapped" in result["safety_override_reason"].lower()
    assert result["severity_band"] == "CRITICAL"
    assert result["composite_score"] >= 85.0
