import uuid
from typing import Dict, Any, List
from datetime import datetime, timezone
from ..database.db import get_connection

PRESET_SCENARIOS = {
    "flash_flood_subarnarekha": {
        "title": "Subarnarekha River Flash Surge",
        "description": "Rapid inundation along low-lying riverbank. Water level rose 1.8 meters in 45 minutes. Over 60 residential houses partially submerged; families stranded on rooftops.",
        "hazard_type": "flash_flood",
        "severity": "high",
        "source": "sensor_stream",
        "location": {
            "latitude": 23.3620,
            "longitude": 85.3120,
            "address": "Subarnarekha Low-Lying Riverfront, Namkum Basin",
            "region": "Subarnarekha Catchment"
        }
    },
    "duplicate_citizen_sos": {
        "title": "Harmu River Crossing Inundation (Duplicate Test)",
        "description": "Harmu river water overflowing over arterial bridge. Multiple vehicles stuck. Citizens requesting immediate rescue boats.",
        "hazard_type": "flood",
        "severity": "medium",
        "source": "citizen_report",
        "location": {
            "latitude": 23.3325,
            "longitude": 85.3175,
            "address": "Harmu Bypass Bridge Crossing",
            "region": "Harmu Catchment"
        }
    },
    "dam_safety_override": {
        "title": "Dhurwa Dam Emergency Spillway Warning (Hard Rule Safety Override)",
        "description": "Dam reservoir at 99.4% full capacity. Uncontrolled spillway discharge anticipated. Downstream settlements face life threatening surge with immediate evacuation needed.",
        "hazard_type": "flood",
        "severity": "critical",
        "source": "operator",
        "location": {
            "latitude": 23.2980,
            "longitude": 85.2780,
            "address": "Dhurwa Dam Spillway Channel & Sector 2",
            "region": "Dhurwa Basin"
        }
    },
    "hospital_power_threat": {
        "title": "RIMS Medical Campus Backup Substation Flooding",
        "description": "Severe storm water pooling around central hospital auxiliary diesel generators and ICU power backups. Over 400 inpatients at risk if power drops.",
        "hazard_type": "flood",
        "severity": "high",
        "source": "operator",
        "location": {
            "latitude": 23.3735,
            "longitude": 85.3415,
            "address": "RIMS Medical Complex & Trauma Center",
            "region": "Ranchi East"
        }
    },
    "cyclone_weather_surge": {
        "title": "Severe Cyclone Storm Surge & Gale Warning",
        "description": "Gale force winds exceeding 85 km/h with continuous torrential downpour. Widespread uprooted power poles and blocked drainage trunks.",
        "hazard_type": "extreme_weather",
        "severity": "high",
        "source": "weather_alert",
        "location": {
            "latitude": 23.3550,
            "longitude": 85.3300,
            "address": "Kanke Road Urban Corridor",
            "region": "Ranchi Central"
        }
    }
}

def generate_scenario_incident(scenario_key: str) -> Dict[str, Any]:
    preset = PRESET_SCENARIOS.get(scenario_key, PRESET_SCENARIOS["flash_flood_subarnarekha"])
    now = datetime.now(timezone.utc).isoformat()
    incident_id = f"INC-{uuid.uuid4().hex[:4].upper()}"

    incident_dict = {
        "incident_id": incident_id,
        "hazard_type": preset["hazard_type"],
        "location": preset["location"],
        "severity": preset["severity"],
        "reported_at": now,
        "source": preset["source"],
        "verification_status": "unverified",
        "description": preset["description"],
        "duplicate_of": None,
        "is_active": 1,
        "created_at": now,
        "updated_at": now,
        "metadata": {"scenario_key": scenario_key, "scenario_title": preset["title"]}
    }
    return incident_dict
