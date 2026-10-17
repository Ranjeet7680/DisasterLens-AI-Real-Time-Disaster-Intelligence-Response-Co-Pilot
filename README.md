# DisasterLens AI — Real-Time Disaster Intelligence & Response Co-Pilot
> **Hackathon MVP**: Real-Time AI for Critical Decisions in Disaster Response & Flood Management

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016%20(App%20Router)-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?logo=typescript)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Language-Python%203.11-3776AB?logo=python)](https://python.org)
[![Tests](https://img.shields.io/badge/Tests-Pytest%206%2F6%20Passed-brightgreen)](backend/tests)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)

---

## 📌 Executive Overview
During floods, cyclones, landslides, and extreme weather emergencies, decision-makers are inundated with incomplete reports, conflicting civilian calls, and stale sensors. **DisasterLens AI** acts as a real-time decision-support co-pilot for disaster response.

Instead of forcing officials to manually parse disjointed feeds, DisasterLens AI:
1. **Aggregates fragmented data** (citizen reports, automated river gauges, weather radars, and operator feeds).
2. **Orchestrates 4 specialized AI agents** to classify hazards, deduplicate claims, calculate explainable composite risk, and propose SOP-aligned response plans.
3. **Applies hard safety override rules** so that credible imminent-danger reports (e.g., trapped citizens or dam sluice surges) are immediately escalated and never masked by low data completeness.
4. **Enforces human-in-the-loop approvals** with an immutable audit log before any high-consequence response resources are dispatched.
5. **Streams live situational updates** via WebSockets across an interactive geospatial map in English and Hindi.

---

## ⚡ Answers to the 5 Critical Disaster Response Questions

| Question | DisasterLens AI Solution |
| :--- | :--- |
| **1. Where is the disaster happening?** | Leaflet OpenStreetMap with localized geofencing, pulsing hazard radius circles, and nearest emergency shelter/depot overlays. |
| **2. Which communities are at greatest risk?** | Multi-factor risk engine accounting for population exposure (E: 30%) and community vulnerability (V: 20%). |
| **3. How urgently must each incident be addressed?** | Explainable composite score ($R = 0.40H + 0.30E + 0.20V + 0.10D$) with automated `CRITICAL` safety override for life-safety threats. |
| **4. Which emergency resources may be required?** | Response Planning Agent automatically matches nearby available rescue boats, NDRF platoons, dewatering pumps, and shelters. |
| **5. What should responders investigate or do next?** | Evidence-linked Standard Operating Procedure (SOP) recommendations presented for Incident Commander review and one-click dispatch. |

---

## 🧠 Multi-Agent Architecture

```
                      ┌────────────────────────────────────────┐
                      │ Ingestion: Citizen / Sensor / Operator │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
   ┌───────────────────────────────────────────────────────────────────────────┐
   │                     DECISION ORCHESTRATOR AGENT                           │
   │                                                                           │
   │  ┌─────────────────────────┐           ┌───────────────────────────────┐  │
   │  │ 1. Hazard Intelligence  │           │ 2. Report Validation Agent    │  │
   │  │    Agent                │           │    • Geodistance deduplication│  │
   │  │    • River gauge sensors├──────────►│    • Source credibility checks│  │
   │  │    • Precipitation radar│           │    • Missing field quarantine │  │
   │  │    • Flood stage window │           └───────────────┬───────────────┘  │
   │  └─────────────────────────┘                           │                  │
   │                                                        ▼                  │
   │  ┌─────────────────────────┐           ┌───────────────────────────────┐  │
   │  │ 4. Response Planning    │           │ 3. Risk Assessment Agent      │  │
   │  │    Agent                │           │    • R=0.4H+0.3E+0.2V+0.1D    │  │
   │  │    • Nearby resource fit│◄──────────┤    • Hard Safety Overrides    │  │
   │  │    • Evidence linking   │           │    • Auditable factor breakdown│ │
   │  │    • Action options     │           └───────────────────────────────┘  │
   │  └───────────┬─────────────┘                                              │
   └──────────────┼────────────────────────────────────────────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────┐          ┌────────────────────────────────┐
   │ Human-in-the-Loop Review EOC │─────────►│ Immutable Audit Log & Broadcast│
   │ (Approve / Edit / Reject)    │          │ (WebSocket Stream to Dashboard)│
   └──────────────────────────────┘          └────────────────────────────────┘
```

### Specialized Agents:
1. **Agent 1 — Hazard Intelligence Agent** (`backend/app/agents/hazard.py`):
   - Queries live Open-Meteo weather APIs and river level sensors.
   - Detects flood stage (*Extreme Danger, Danger Threshold, Warning*), forecast surge window, and affected radius in km.
2. **Agent 2 — Report Validation Agent** (`backend/app/agents/validation.py`):
   - Spatial-temporal deduplication using the Haversine formula ($\le 2.5\text{ km}$ and time window).
   - Validates coordinate bounds, filters unverified claims, and computes weighted source credibility.
3. **Agent 3 — Risk Assessment Agent** (`backend/app/agents/risk.py`):
   - Computes transparent composite score:
     $$R = 0.40H + 0.30E + 0.20V + 0.10D$$
   - **Hard Safety Escalation Rule**: Evaluates critical life-safety indicators (e.g. *"trapped on rooftops"*, *"dam overflow"*, *"submerged hospital ICU"*). Automatically escalates score and assigns `CRITICAL` priority with auditable rationale.
4. **Agent 4 — Response Planning Agent** (`backend/app/agents/response.py`):
   - Evaluates active regional inventory: shelters, rescue boats, NDRF platoons, and dewatering pumps.
   - Generates priority-staged actionable options linked to verified evidence.
5. **Agent 5 — Orchestrator & Briefing Synthesizer** (`backend/app/agents/orchestrator.py`):
   - Enforces sequential execution, fallback resilience, persistence, and bilingual decision briefings in English and Hindi.

---

## 📐 Mathematical Risk Scoring Logic

$$\text{Composite Risk } (R) = 0.40 \times H + 0.30 \times E + 0.20 \times V + 0.10 \times D$$

- **Hazard Severity ($H$, 40%)**: Derived from river stage, gauge delta, and localized precipitation (0–100).
- **Population Exposure ($E$, 30%)**: Accounts for urban density, presence of hospitals, schools, and dense settlements (0–100).
- **Community Vulnerability ($V$, 20%)**: Accounts for terrain elevation, mud/kutcha dwellings, and power outages (0–100).
- **Data Quality & Freshness ($D$, 10%)**: Product of source credibility factor and time recency (0–100).

> **Production Safeguard**: A low score must never suppress a credible emergency alert solely because data is incomplete. The built-in hard safety override guarantees immediate escalation when life-threatening conditions are detected.

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Start Backend (FastAPI)
```bash
# From repository root
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend API documentation available at: `http://localhost:8000/docs`*

### 2. Run Tests
```bash
.\backend\venv\Scripts\pytest.exe -v
```

### 3. Start Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
*Frontend application available at: `http://localhost:3000`*

### 4. Or Run via Docker Compose
```bash
docker-compose up --build
```

---

## 🎬 7-Step Hackathon Demonstration Walkthrough

1. **Open the Dashboard**: Navigate to `http://localhost:3000`. Observe live geospatial markers, regional alerts, and real-time metrics.
2. **Open the Demo Simulator**: Click **"Demo Simulator"** in the top navigation.
3. **Trigger Scenario 1 (Primary Flood)**: Click *"Inject Scenario Live"* for **Subarnarekha River Flash Inundation**.
   - Notice the instant WebSocket broadcast.
   - The map animates to Subarnarekha Basin with an impact radius zone.
   - The Hazard and Risk cards reveal $R=88$ (`CRITICAL`), showing the exact formula calculation.
4. **Trigger Scenario 2 (Validation & Deduplication)**: Click *"Harmu River Crossing (Duplicate Test)"*.
   - Watch the Validation Agent flag the report with a `DUP` badge linked to the parent event.
5. **Trigger Scenario 3 (Safety Override Test)**: Click *"Dhurwa Dam Sluice Warning"*.
   - Notice the glowing red **"SAFETY OVERRIDE ACTIVATED"** banner explaining that imminent life threats override composite suppression.
6. **Demonstrate Human Approval**:
   - Click **"Review & Approve Recommendations"**.
   - Inspect the SOP-backed actions, matched rescue boats, and evidence citations.
   - Edit or approve the deployment under the Commander call-sign.
   - Notice how the shelter capacity and boat status update immediately.
7. **Inspect the Immutable Audit Trail**:
   - Click **"Audit Trail"** in the top header.
   - Verify every agent run, safety override reason, and human approval signature.

---

## 🛡️ Safeguards & Production Hardening

| Risk | DisasterLens AI Safeguard |
| :--- | :--- |
| **LLM Hallucinations** | Numerical scoring is computed strictly by deterministic Python algorithms; LLMs are confined to narrative synthesis and constrained schemas. |
| **Provider/API Outage** | Dual-tier fallback engine: if Gemini or Open-Meteo times out, localized deterministic calibrated algorithms guarantee 100% uptime. |
| **Unauthorized Deployment** | Role-based Human-in-the-Loop review gates all consequential actions; autonomous public evacuation dispatch is strictly prohibited without authorized sign-off. |
| **False / Malicious Reports** | Multi-source credibility weighting and spatial-temporal clustering flag suspicious citizen claims. |

---

## 👥 Contributors & Hackathon Team
Developed for **Real-Time AI for Critical Decisions — Disaster Management Hackathon MVP**.
DisasterLens AI — *Turning fragmented disaster chaos into clear, explainable, and decisive action.*
