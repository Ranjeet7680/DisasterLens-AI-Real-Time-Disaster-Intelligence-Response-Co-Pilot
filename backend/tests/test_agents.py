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
    assert "translations" in decision_brief
    assert "en" in decision_brief["translations"]
    assert "hi" in decision_brief["translations"]
    assert "bn" in decision_brief["translations"]
    assert "ta" in decision_brief["translations"]
    assert "te" in decision_brief["translations"]
    assert "mr" in decision_brief["translations"]

@pytest.mark.asyncio
async def test_disaster_copilot_indian_languages():
    from backend.app.services.llm_service import ask_disaster_copilot
    
    # Test query in Hindi for shelters
    hi_result = await ask_disaster_copilot(
        query="निकटतम आश्रय स्थल कौन से हैं?",
        incident_context={"incident_id": "INC-1001", "hazard_type": "flood"},
        available_resources=[{"resource_type": "evacuation_shelter", "name": "Morabadi Shelter", "available_capacity": 480}],
        lang="hi"
    )
    assert "मोराबादी" in hi_result["answer"] or "आश्रय" in hi_result["answer"]
    assert len(hi_result["suggested_actions"]) > 0

    # Test query in Bengali
    bn_result = await ask_disaster_copilot(
        query="উদ্ধারকারী নৌকা কোথায় আছে?",
        incident_context={"incident_id": "INC-1001", "hazard_type": "flood"},
        lang="bn"
    )
    assert len(bn_result["answer"]) > 10

