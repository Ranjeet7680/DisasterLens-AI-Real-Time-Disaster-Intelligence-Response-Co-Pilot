import pytest
from backend.app.agents.validation import ReportValidationAgent, haversine_distance, compute_word_overlap_similarity
from backend.app.database.db import init_db, get_connection

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

def test_haversine_distance():
    # Distance between Ranchi Morabadi (23.385, 85.320) and Bariatu (23.372, 85.340) ~ 2.5 km
    dist = haversine_distance(23.385, 85.320, 23.372, 85.340)
    assert 2.0 < dist < 3.5

def test_word_overlap_similarity():
    s1 = "Severe flash flood rising near main bridge"
    s2 = "Rising flash flood water near the bridge"
    sim = compute_word_overlap_similarity(s1, s2)
    assert sim > 0.40

@pytest.mark.asyncio
async def test_validation_schema_and_coordinates():
    agent = ReportValidationAgent()
    
    # Valid incident
    valid_incident = {
        "incident_id": "TEST-VAL-1",
        "hazard_type": "flood",
        "description": "Rising river channel with overflow onto bypass road.",
        "source": "sensor_stream",
        "location": {"latitude": 23.34, "longitude": 85.30}
    }
    res = await agent.run(valid_incident)
    assert res["status"] == "success"
    assert res["credibility_score"] == 0.95
    assert not any("FATAL" in c for c in res["unresolved_conflicts"])

    # Invalid coordinates
    invalid_incident = {
        "incident_id": "TEST-VAL-2",
        "hazard_type": "flood",
        "description": "Rising river channel.",
        "source": "citizen_report",
        "location": {"latitude": 125.0, "longitude": 85.30}  # 125 is out of [-90, 90]
    }
    res_inv = await agent.run(invalid_incident)
    assert any("Inconsistent coordinate" in c for c in res_inv["unresolved_conflicts"])
