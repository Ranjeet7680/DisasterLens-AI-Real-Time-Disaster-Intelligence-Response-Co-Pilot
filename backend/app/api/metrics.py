from fastapi import APIRouter
from typing import Dict, Any
from ..database.db import get_connection

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

@router.get("", response_model=Dict[str, Any])
def get_dashboard_metrics():
    conn = get_connection()
    cursor = conn.cursor()

    # Incidents stats
    cursor.execute("SELECT COUNT(*) as total FROM incidents WHERE is_active = 1")
    total_incidents = cursor.fetchone()["total"]

    # Critical / High count
    cursor.execute("SELECT COUNT(*) as cnt FROM risk_assessments WHERE severity_band = 'CRITICAL'")
    critical_count = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM risk_assessments WHERE severity_band = 'HIGH'")
    high_count = cursor.fetchone()["cnt"]

    # Hard safety overrides
    cursor.execute("SELECT COUNT(*) as cnt FROM risk_assessments WHERE hard_safety_rule_triggered = 1")
    safety_overrides = cursor.fetchone()["cnt"]

    # Alerts stats
    cursor.execute("SELECT COUNT(*) as cnt FROM alerts WHERE state = 'active'")
    active_alerts = cursor.fetchone()["cnt"]

    # Pending recommendations
    cursor.execute("SELECT COUNT(*) as cnt FROM recommendations WHERE status = 'pending_review'")
    pending_approvals = cursor.fetchone()["cnt"]

    # Resource capacity
    cursor.execute("SELECT SUM(capacity) as total_cap, SUM(available_capacity) as avail_cap FROM resources")
    res_stats = cursor.fetchone()
    total_cap = res_stats["total_cap"] or 0
    avail_cap = res_stats["avail_cap"] or 0

    # Agent latency average
    cursor.execute("SELECT AVG(latency_ms) as avg_lat FROM agent_runs")
    lat_row = cursor.fetchone()
    avg_latency = round(lat_row["avg_lat"] or 0, 1)

    conn.close()

    return {
        "total_active_incidents": total_incidents,
        "critical_incidents": critical_count,
        "high_incidents": high_count,
        "active_alerts": active_alerts,
        "pending_approvals": pending_approvals,
        "safety_overrides_triggered": safety_overrides,
        "resource_capacity": {
            "total": total_cap,
            "available": avail_cap,
            "deployed_pct": round(((total_cap - avail_cap) / total_cap * 100) if total_cap > 0 else 0, 1)
        },
        "average_agent_latency_ms": avg_latency
    }
