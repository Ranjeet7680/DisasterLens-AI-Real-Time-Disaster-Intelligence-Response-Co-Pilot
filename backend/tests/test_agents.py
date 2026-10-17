import pytest
from backend.app.database.db import init_db, seed_initial_resources, get_connection
from backend.app.agents.orchestrator import orchestrator
from backend.app.services.simulator import generate_scenario_incident

@pytest.fixture(autouse=True)
def setup_environment():
    init_db()
    seed_initial_resources()

@pytest.mark.asyncio
async def test_full_orchestrator_pipeline():
    incident = generate_scenario_incident("flash_flood_subarnarekha")
    
    # Save incident to DB so agents can query it
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
    INSERT INTO incidents (incident_id, hazard_type, latitude, longitude, address, region, severity, reported_at, source, verification_status, description, duplicate_of, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    """, (
        incident["incident_id"], incident["hazard_type"],
        incident["location"]["latitude"], incident["location"]["longitude"],
        incident["location"]["address"], incident["location"]["region"],
        incident["severity"], incident["reported_at"], incident["source"],
        incident["verification_status"], incident["description"],
        incident["duplicate_of"], incident["created_at"], incident["updated_at"]
    ))
    conn.commit()
    conn.close()

    decision_brief = await orchestrator.execute_workflow(incident, actor="Pytest Automated Test")

    assert "incident" in decision_brief
    assert "risk_assessment" in decision_brief
    assert "recommendations" in decision_brief
    assert len(decision_brief["recommendations"]) > 0
    assert len(decision_brief["agent_runs"]) == 4  # Hazard, Validation, Risk, Response
    assert decision_brief["summary_text_en"] is not None
    assert decision_brief["summary_text_hi"] is not None
    assert decision_brief["risk_assessment"]["composite_score"] > 0
