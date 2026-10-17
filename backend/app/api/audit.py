from fastapi import APIRouter, Query
from typing import List, Dict, Any
import json

from ..database.db import get_connection

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("", response_model=List[Dict[str, Any]])
def get_audit_trail(limit: int = Query(50, ge=1, le=100)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    events = []
    for r in rows:
        events.append({
            "id": r["id"],
            "actor": r["actor"],
            "event_type": r["event_type"],
            "timestamp": r["timestamp"],
            "details": json.loads(r["details_json"]),
            "record_ids": json.loads(r["record_ids_json"])
        })
    conn.close()
    return events
