import math
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from ..database.db import get_connection

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two lat/lon points."""
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def compute_word_overlap_similarity(s1: str, s2: str) -> float:
    words1 = set(s1.lower().split())
    words2 = set(s2.lower().split())
    if not words1 or not words2:
        return 0.0
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / len(union)

class ReportValidationAgent:
    name: str = "Report Validation Agent"

    async def run(self, incident: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.time()
        incident_id = incident.get("incident_id")
        loc = incident.get("location", {})
        lat = loc.get("latitude")
        lon = loc.get("longitude")
        desc = incident.get("description", "")
        source = incident.get("source", "citizen_report")
        hazard_type = incident.get("hazard_type", "flood")

        unresolved_conflicts: List[str] = []
        evidence_references: List[str] = []
        duplicate_group: Optional[str] = None
        is_duplicate = False

        # 1. Location and Schema checks
        if lat is None or lon is None:
            unresolved_conflicts.append("FATAL: Missing geographical coordinates.")
        elif not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
            unresolved_conflicts.append(f"Inconsistent coordinate range: lat={lat}, lon={lon}")
        else:
            evidence_references.append(f"Validated GPS coordinates: ({lat:.4f}, {lon:.4f})")

        if len(desc.strip()) < 8:
            unresolved_conflicts.append("Incident description is sparsely populated (< 8 chars).")
        else:
            evidence_references.append("Textual incident report narrative supplied.")

        # 2. Source Credibility Check
        source_weights = {
            "sensor_stream": 0.95,
            "operator": 0.90,
            "weather_alert": 0.92,
            "demo_simulator": 0.85,
            "citizen_report": 0.65
        }
        credibility_score = source_weights.get(source, 0.60)
        if source == "citizen_report":
            unresolved_conflicts.append("Report originates from unverified civilian channel; cross-referencing required.")
        else:
            evidence_references.append(f"Originates from verified channel ({source}) with reliability factor {credibility_score}")

        # 3. Deduplication Check against existing active incidents in DB
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT incident_id, hazard_type, latitude, longitude, description, reported_at FROM incidents WHERE incident_id != ? AND is_active = 1", (incident_id,))
        existing_incidents = cursor.fetchall()
        conn.close()

        closest_dist = 9999.0
        for existing in existing_incidents:
            e_id = existing["incident_id"]
            e_lat = existing["latitude"]
            e_lon = existing["longitude"]
            e_desc = existing["description"]
            
            if lat is not None and lon is not None and e_lat is not None and e_lon is not None:
                dist_km = haversine_distance(lat, lon, e_lat, e_lon)
                if dist_km < closest_dist:
                    closest_dist = dist_km
                
                # Check spatial distance (< 2.0 km) and text similarity
                text_sim = compute_word_overlap_similarity(desc, e_desc)
                if dist_km <= 2.5 and (text_sim > 0.35 or existing["hazard_type"] == hazard_type):
                    is_duplicate = True
                    duplicate_group = e_id
                    unresolved_conflicts.append(f"Potential spatial-temporal duplicate of active incident {e_id} (Distance: {dist_km:.2f} km).")
                    break

        if is_duplicate:
            validation_status = "flagged_duplicate"
        elif unresolved_conflicts and credibility_score < 0.70:
            validation_status = "unverified_provisional"
        else:
            validation_status = "verified"

        latency_ms = int((time.time() - start_time) * 1000)

        return {
            "agent_name": self.name,
            "status": "success",
            "latency_ms": latency_ms,
            "validation_status": validation_status,
            "is_duplicate": is_duplicate,
            "duplicate_of": duplicate_group,
            "credibility_score": round(credibility_score, 2),
            "evidence_references": evidence_references,
            "unresolved_conflicts": unresolved_conflicts,
            "closest_incident_distance_km": round(closest_dist, 2) if closest_dist != 9999.0 else None,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
