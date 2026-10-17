from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from ..database.db import get_connection
from ..schemas.models import Resource
from ..services.websocket_manager import ws_manager

router = APIRouter(prefix="/api/resources", tags=["resources"])

@router.get("", response_model=List[Dict[str, Any]])
def list_resources(resource_type: Optional[str] = None, status: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM resources WHERE 1=1"
    params = []
    if resource_type:
        query += " AND resource_type = ?"
        params.append(resource_type)
    if status:
        query += " AND status = ?"
        params.append(status)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    resources = []
    for r in rows:
        resources.append({
            "id": r["id"],
            "name": r["name"],
            "resource_type": r["resource_type"],
            "capacity": r["capacity"],
            "available_capacity": r["available_capacity"],
            "location": {
                "latitude": r["latitude"],
                "longitude": r["longitude"],
                "address": r["address"],
                "region": r["region"]
            },
            "status": r["status"],
            "contact": r["contact"],
            "last_updated": r["last_updated"]
        })
    conn.close()
    return resources

@router.post("", response_model=Dict[str, Any])
async def register_resource(payload: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()

    res_id = payload.get("id") or f"RES-{uuid.uuid4().hex[:4].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    loc = payload.get("location", {})

    cursor.execute("""
    INSERT INTO resources (
        id, name, resource_type, capacity, available_capacity,
        latitude, longitude, address, region, status, contact, last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        res_id,
        payload.get("name", "Field Resource Unit"),
        payload.get("resource_type", "rescue_boat"),
        payload.get("capacity", 10),
        payload.get("available_capacity", 10),
        loc.get("latitude", 23.3441),
        loc.get("longitude", 85.3096),
        loc.get("address", "Emergency Post"),
        loc.get("region", "Ranchi"),
        payload.get("status", "available"),
        payload.get("contact", "+91-651-000000"),
        now
    ))
    conn.commit()
    conn.close()

    await ws_manager.broadcast("resource_updated", {"id": res_id, "action": "created"})
    return {"status": "success", "resource_id": res_id}
