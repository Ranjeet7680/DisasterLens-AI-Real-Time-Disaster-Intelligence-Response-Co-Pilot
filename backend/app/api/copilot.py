from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from ..services.llm_service import ask_disaster_copilot
from ..database.db import get_connection

router = APIRouter(prefix="/api/copilot", tags=["copilot"])

class CopilotQueryRequest(BaseModel):
    query: str
    incident_id: Optional[str] = None
    lang: str = "en"

@router.post("/query")
async def copilot_query_endpoint(payload: CopilotQueryRequest):
    conn = get_connection()
    cursor = conn.cursor()

    incident_context = None
    if payload.incident_id:
        cursor.execute("SELECT * FROM incidents WHERE incident_id = ?", (payload.incident_id,))
        inc_row = cursor.fetchone()
        if inc_row:
            incident_context = {
                "incident_id": inc_row["incident_id"],
                "hazard_type": inc_row["hazard_type"],
                "description": inc_row["description"],
                "region": inc_row["region"]
            }

    cursor.execute("SELECT id, name, resource_type, capacity, available_capacity, status FROM resources")
    resources = [dict(r) for r in cursor.fetchall()]
    conn.close()

    result = await ask_disaster_copilot(
        query=payload.query,
        incident_context=incident_context,
        available_resources=resources,
        lang=payload.lang
    )

    return result
