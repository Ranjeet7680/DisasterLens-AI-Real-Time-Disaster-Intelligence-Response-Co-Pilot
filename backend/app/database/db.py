import sqlite3
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pathlib import Path

DB_FILE = Path(__file__).resolve().parent.parent.parent / "disasterlens.db"

def get_connection():
    conn = sqlite3.connect(str(DB_FILE), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        incident_id TEXT PRIMARY KEY,
        hazard_type TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        address TEXT,
        region TEXT,
        severity TEXT NOT NULL,
        reported_at TEXT NOT NULL,
        source TEXT NOT NULL,
        verification_status TEXT NOT NULL,
        description TEXT NOT NULL,
        duplicate_of TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        metadata_json TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evidence (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        source TEXT NOT NULL,
        observed_at TEXT NOT NULL,
        indicator_name TEXT NOT NULL,
        indicator_value TEXT NOT NULL,
        confidence REAL DEFAULT 1.0,
        raw_payload_json TEXT,
        FOREIGN KEY (incident_id) REFERENCES incidents (incident_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS risk_assessments (
        incident_id TEXT PRIMARY KEY,
        composite_score REAL NOT NULL,
        severity_band TEXT NOT NULL,
        hazard_score REAL NOT NULL,
        exposure_score REAL NOT NULL,
        vulnerability_score REAL NOT NULL,
        data_freshness_score REAL NOT NULL,
        calculation_formula TEXT NOT NULL,
        contributing_factors_json TEXT NOT NULL,
        hard_safety_rule_triggered INTEGER DEFAULT 0,
        safety_override_reason TEXT,
        assessed_at TEXT NOT NULL,
        model_version TEXT NOT NULL,
        FOREIGN KEY (incident_id) REFERENCES incidents (incident_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recommendations (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        proposed_action TEXT NOT NULL,
        priority TEXT NOT NULL,
        required_resources_json TEXT NOT NULL,
        evidence_references_json TEXT NOT NULL,
        required_approvals TEXT NOT NULL,
        status TEXT NOT NULL,
        reviewed_by TEXT,
        reviewed_at TEXT,
        review_notes TEXT,
        FOREIGN KEY (incident_id) REFERENCES incidents (incident_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        severity TEXT NOT NULL,
        created_at TEXT NOT NULL,
        state TEXT NOT NULL,
        acknowledged_by TEXT,
        acknowledged_at TEXT,
        FOREIGN KEY (incident_id) REFERENCES incidents (incident_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        available_capacity INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        address TEXT,
        region TEXT,
        status TEXT NOT NULL,
        contact TEXT NOT NULL,
        last_updated TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS agent_runs (
        run_id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        status TEXT NOT NULL,
        latency_ms INTEGER NOT NULL,
        output_json TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        actor TEXT NOT NULL,
        event_type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        details_json TEXT NOT NULL,
        record_ids_json TEXT NOT NULL
    );
    """)

    conn.commit()
    conn.close()

# Database seed function to populate realistic initial resources and shelters
def seed_initial_resources():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM resources")
    row = cursor.fetchone()
    if row["count"] == 0:
        now = datetime.now(timezone.utc).isoformat()
        initial_resources = [
            ("RES-101", "NDRF 10th Battalion Unit Alpha", "ndrf_platoon", 45, 45, 23.3500, 85.3250, "Bariatu Relief Post, Ranchi", "Ranchi Central", "available", "+91-651-224411", now),
            ("RES-102", "SDRF Fast Boat Rescue Team 1", "rescue_boat", 12, 12, 23.3600, 85.3100, "Subarnarekha Riverfront Depot", "Subarnarekha Basin", "available", "+91-651-224412", now),
            ("RES-103", "Morabadi Community Relief Shelter", "evacuation_shelter", 500, 480, 23.3850, 85.3200, "Morabadi Indoor Stadium", "Ranchi North", "available", "+91-651-224413", now),
            ("RES-104", "RIMS Emergency Medical Mobile Unit", "medical_team", 25, 25, 23.3720, 85.3400, "RIMS Medical Campus", "Ranchi East", "available", "+91-651-224414", now),
            ("RES-105", "High-Capacity Dewatering Pump Unit A", "water_pump", 8, 8, 23.3400, 85.3050, "Municipal Works Yard, Doranda", "Ranchi South", "available", "+91-651-224415", now),
            ("RES-106", "Disaster Reconnaissance Drone Squad", "emergency_drone", 4, 4, 23.3440, 85.3090, "Civil Defense HQ", "Ranchi Central", "available", "+91-651-224416", now),
            ("RES-107", "Dhurwa Dam Emergency Evacuation Camp", "evacuation_shelter", 650, 650, 23.2950, 85.2750, "Sector 3 Community Hall, Dhurwa", "Ranchi South-West", "available", "+91-651-224417", now),
            ("RES-108", "SDRF Inflatable Flood Rafts Team 2", "rescue_boat", 10, 10, 23.3320, 85.3180, "Harmu River Crossing Post", "Harmu Catchment", "available", "+91-651-224418", now),
        ]
        cursor.executemany("""
        INSERT INTO resources (id, name, resource_type, capacity, available_capacity, latitude, longitude, address, region, status, contact, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_resources)
        conn.commit()
    conn.close()
