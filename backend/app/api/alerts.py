from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import json

from ..database.db import get_connection
from ..services.websocket_manager import ws_manager

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("", response_model=List[Dict[str, Any]])
def get_alerts(state: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()

    if state:
        cursor.execute("SELECT * FROM alerts WHERE state = ? ORDER BY created_at DESC", (state,))
    else:
        cursor.execute("SELECT * FROM alerts ORDER BY created_at DESC")
    
    rows = cursor.fetchall()
    alerts = []
    for r in rows:
        alerts.append({
            "id": r["id"],
            "incident_id": r["incident_id"],
            "title": r["title"],
            "message": r["message"],
            "severity": r["severity"],
            "created_at": r["created_at"],
            "state": r["state"],
            "acknowledged_by": r["acknowledged_by"],
            "acknowledged_at": r["acknowledged_at"]
        })
    conn.close()
    return alerts

@router.post("/{alert_id}/ack")
async def acknowledge_alert(alert_id: str, operator_name: str = "Duty Commander"):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    UPDATE alerts SET state = 'acknowledged', acknowledged_by = ?, acknowledged_at = ?
    WHERE id = ?
    """, (operator_name, now, alert_id))

    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Alert not found")

    # Audit event
    cursor.execute("""
    INSERT INTO audit_events (id, actor, event_type, timestamp, details_json, record_ids_json)
    VALUES (?, ?, 'alert_acknowledged', ?, ?, ?)
    """, (
        f"AUD-{alert_id}",
        operator_name,
        now,
        json.dumps({"alert_id": alert_id}),
        json.dumps([alert_id])
    ))

    conn.commit()
    conn.close()

    await ws_manager.broadcast("alert_updated", {"alert_id": alert_id, "state": "acknowledged", "acknowledged_by": operator_name})
    return {"status": "success", "alert_id": alert_id, "state": "acknowledged"}

@router.post("/{alert_id}/resolve")
async def resolve_alert(alert_id: str, operator_name: str = "Duty Commander"):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute("UPDATE alerts SET state = 'resolved' WHERE id = ?", (alert_id,))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Alert not found")

    conn.commit()
    conn.close()

    await ws_manager.broadcast("alert_updated", {"alert_id": alert_id, "state": "resolved"})
    return {"status": "success", "alert_id": alert_id, "state": "resolved"}
