from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from datetime import datetime, timezone
import json
import uuid

from ..database.db import get_connection
from ..schemas.models import RecommendationReview
from ..services.websocket_manager import ws_manager

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

@router.post("/{recommendation_id}/review")
async def review_recommendation(recommendation_id: str, review: RecommendationReview):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM recommendations WHERE id = ?", (recommendation_id,))
    rec = cursor.fetchone()
    if not rec:
        conn.close()
        raise HTTPException(status_code=404, detail="Recommendation not found")

    decision = review.decision.lower()
    if decision not in ["approved", "rejected", "modified"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Decision must be 'approved', 'rejected', or 'modified'")

    now = datetime.now(timezone.utc).isoformat()
    proposed_action = rec["proposed_action"]
    if decision == "modified" and review.modified_action:
        proposed_action = review.modified_action

    cursor.execute("""
    UPDATE recommendations
    SET status = ?, reviewed_by = ?, reviewed_at = ?, review_notes = ?, proposed_action = ?
    WHERE id = ?
    """, (decision, review.reviewed_by, now, review.review_notes, proposed_action, recommendation_id))

    # Log to audit trail
    audit_id = f"AUD-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
    INSERT INTO audit_events (id, actor, event_type, timestamp, details_json, record_ids_json)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (
        audit_id,
        review.reviewed_by,
        f"recommendation_{decision}",
        now,
        json.dumps({
            "recommendation_id": recommendation_id,
            "incident_id": rec["incident_id"],
            "decision": decision,
            "action_type": rec["action_type"],
            "notes": review.review_notes,
            "original_action": rec["proposed_action"],
            "final_action": proposed_action
        }),
        json.dumps([recommendation_id, rec["incident_id"], audit_id])
    ))

    # If approved and resources were required, update resource status
    if decision == "approved":
        required_res = json.loads(rec["required_resources_json"])
        for req in required_res:
            res_type = req.get("resource_type")
            qty = req.get("quantity", 1)
            cursor.execute("""
            UPDATE resources
            SET available_capacity = MAX(0, available_capacity - ?),
                status = CASE WHEN available_capacity - ? <= 0 THEN 'deployed' ELSE status END
            WHERE resource_type = ? AND status = 'available'
            LIMIT 1
            """, (qty, qty, res_type))

    conn.commit()
    conn.close()

    event_payload = {
        "recommendation_id": recommendation_id,
        "incident_id": rec["incident_id"],
        "status": decision,
        "reviewed_by": review.reviewed_by,
        "reviewed_at": now,
        "action": proposed_action
    }
    await ws_manager.broadcast("recommendation_reviewed", event_payload)

    return {
        "status": "success",
        "recommendation_id": recommendation_id,
        "decision": decision,
        "reviewed_by": review.reviewed_by,
        "timestamp": now
    }
