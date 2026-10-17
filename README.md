<p align="center">
  <img src="docs/assets/header-banner.svg" alt="DisasterLens AI Header Banner" width="100%" />
</p>

# DisasterLens AI — Real-Time Disaster Intelligence & Response Co-Pilot

> **Hackathon MVP**: Real-Time AI for Critical Decisions in Extreme Weather, Flash Floods, and Multi-Hazard Response.

<p align="center">
  <a href="#-system-architecture--multi-agent-pipeline"><img src="https://img.shields.io/badge/Architecture-Multi--Agent%20State%20Machine-0284c7?style=for-the-badge&logo=probot" alt="Multi-Agent" /></a>
  <a href="#-mathematical-risk-scoring--hard-safety-rules"><img src="https://img.shields.io/badge/Risk%20Engine-R%20%3D%200.4H%2B0.3E%2B0.2V%2B0.1D-f59e0b?style=for-the-badge" alt="Risk Formula" /></a>
  <a href="#-voice-system--6-indian-local-languages"><img src="https://img.shields.io/badge/Voice%20AI-6%20Indian%20Languages-10b981?style=for-the-badge&logo=google-translate" alt="Indian Languages" /></a>
  <a href="#-human-in-the-loop-review-gate"><img src="https://img.shields.io/badge/Safety-Human--in--the--Loop%20EOC-ef4444?style=for-the-badge&logo=shield" alt="Human in the loop" /></a>
  <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" /></a>
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Frontend-Next.js%2016%20Turbopack-000000?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
</p>

---

## 📌 Executive Summary

During floods, cyclones, landslides, and extreme weather emergencies, critical disaster information arrives asynchronously from fragmented sources. Incident commanders and emergency managers are forced to manually parse conflicting civilian calls, lagging weather forecasts, and duplicate incident reports.

**DisasterLens AI** acts as a real-time decision-support co-pilot for disaster response. Instead of forcing officials to guess severity, DisasterLens AI:
1. **Ingests & Validates Data**: Real-time Open-Meteo weather APIs, river level sensors, citizen mobile SOS reports, and emergency simulator feeds.
2. **Orchestrates 4 Specialized AI Agents**: Hazard Intelligence, Spatial Deduplication, Deterministic Risk Scoring, and Approved SOP Response Planning.
3. **Applies Hard Safety Constraint Overrides**: Credible imminent-danger reports (e.g. citizens trapped on rooftops or submerged hospital ICUs) are immediately escalated to `CRITICAL` priority—guaranteeing that sparse data completeness never masks life-threatening emergencies.
4. **Enforces Human-in-the-Loop Authorization**: Every high-consequence resource dispatch (NDRF boats, pumps, shelters) requires explicit officer review and creates an immutable audit trail.
5. **Speaks in 6 Indian Local Languages**: Built-in voice dictation and speech synthesis across Hindi (हिंदी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), Marathi (मराठी), and English.

---

## ⚡ The 5 Critical Disaster Response Questions Answered

| Critical Question | DisasterLens AI Solution |
| :--- | :--- |
| **1. Where is the disaster happening?** | Tactical Leaflet GIS with CartoDB Dark/Voyager & Esri Satellite, pulsing hazard radius rings, and animated laser dispatch vectors. |
| **2. Which communities are at greatest risk?** | Multi-factor exposure and vulnerability modeling accounting for low elevation, kutcha dwellings, hospitals, and density. |
| **3. How urgently must each incident be addressed?** | Explainable composite score ($R = 0.40H + 0.30E + 0.20V + 0.10D$) with automated `CRITICAL` safety override for life hazards. |
| **4. Which emergency resources are required?** | Response Planning Agent automatically matches nearest available rescue boats, SDRF platoons, dewatering pumps, and shelters. |
| **5. What should responders investigate or do next?** | Evidence-linked Standard Operating Procedure (SOP) recommendations presented for Commander review and one-click dispatch. |

---

## 🧠 System Architecture & Multi-Agent Pipeline

DisasterLens AI employs a modular monolith architecture utilizing a specialized state machine where each agent has explicit deterministic responsibilities. Numerical risk calculations are computed with validated mathematical code, while LLMs (Gemini 2.5 Flash with deterministic fallback) interpret and summarize evidence.

<p align="center">
  <img src="docs/assets/multi-agent-pipeline.svg" alt="Multi-Agent AI Decision Pipeline Architecture" width="100%" />
</p>

### Specialized Agents:
1. **Agent 1 — Hazard Intelligence Agent** (`backend/app/agents/hazard.py`):
   - Queries real-time Open-Meteo weather APIs and river gauge sensors.
   - Evaluates precipitation (mm/h), surface runoff, water rise speed (m/45min), and flood stage (*Warning, Danger, Extreme Danger*).
2. **Agent 2 — Report Validation Agent** (`backend/app/agents/validation.py`):
   - Spatial-temporal deduplication using the Haversine formula ($\le 2.5\text{ km}$ geofence) and Jaccard word-overlap similarity.
   - Clusters duplicate civilian reports into verified event groups and calculates weighted source credibility.
3. **Agent 3 — Risk Assessment Agent** (`backend/app/agents/risk.py`):
   - Computes transparent composite risk on a 0–100 scale: $R = 0.40H + 0.30E + 0.20V + 0.10D$.
   - Evaluates hard safety constraints (trapped citizens, dam breaches, hospital ICU risks) and forces priority escalation when triggered.
4. **Agent 4 — Response Planning Agent** (`backend/app/agents/response.py`):
   - Evaluates active regional inventory: shelters, rescue boats, NDRF platoons, and dewatering pumps.
   - Proposes SOP-aligned action alternatives with required approvals and logistics feasibility.
5. **Agent 5 — Orchestrator & Briefing Synthesizer** (`backend/app/agents/orchestrator.py`):
   - Coordinates execution order, logs telemetry latencies, and synthesizes bilingual decision briefs in English and Indian local languages.

---

## 📐 Mathematical Risk Scoring & Hard Safety Rules

<p align="center">
  <img src="docs/assets/risk-formula-diagram.svg" alt="Mathematical Risk Formula & Hard Safety Constraint Matrix" width="100%" />
</p>

### Composite Risk Formulation
The composite risk score $R$ is calculated deterministically on a 0 to 100 scale:

$$R = 0.40 \times H + 0.30 \times E + 0.20 \times V + 0.10 \times D$$

- **Hazard Severity ($H$, 40%)**: Derived from river stage, gauge delta, and localized precipitation (0–100).
- **Population Exposure ($E$, 30%)**: Accounts for urban population density, presence of hospitals, schools, and dense settlements (0–100).
- **Community Vulnerability ($V$, 20%)**: Accounts for terrain elevation, mud/kutcha dwellings, and power grid outages (0–100).
- **Data Quality & Freshness ($D$, 10%)**: Product of source credibility factor and exponential time decay recency (0–100).

### Hard Safety Constraint Override System
> **Core Safety Principle**: A low composite score must **never** delay an emergency response solely because data is sparse or incomplete.

When any of the following imminent-danger conditions are detected, the system overrides numerical weighting:
- **Human Life Imminently Threatened**: Reports describing families trapped on rooftops, submerged dwellings, or stranded infants automatically trigger `SAFETY_OVERRIDE = TRUE`.
- **Critical Infrastructure Failure**: Dam sluice gate overflow, hospital ICU flooding, or bridge collapse.
- **Enforced Action**: The incident score is forced to $\ge 85$, severity band is locked to `CRITICAL`, and audible EOC sirens are broadcasted immediately.

---

## 🔄 End-to-End Operational Lifecycle & Dispatch

<p align="center">
  <img src="docs/assets/eoc-workflow.svg" alt="End-to-End Emergency Response & Resource Orchestration Workflow" width="100%" />
</p>

1. **Ingestion**: Field civilian mobile reports, automated sensor streams, or simulator injects arrive via FastAPI REST / WebSockets.
2. **AI Analysis**: The 4 agents run in sequential synchronization (< 1,600 ms latency).
3. **EOC Visualization**: The incident appears on the Leaflet GIS Map with pulsing threat beacons and dynamic SVG radial dials.
4. **Multilingual Co-Pilot**: Commanders query evacuation corridors and resource triage via voice in their preferred local language.
5. **Human Authorization**: The Incident Commander reviews SOP recommendations, edits notes, and clicks **Approve**.
6. **Tactical Dispatch**: Laser dispatch vectors animate from resource depots (shelters, boats, pumps) to the disaster epicenter.

---

## 🎙️ Voice System & 6 Indian Local Languages

DisasterLens AI is built specifically for Indian Emergency Operations Centers (EOCs), supporting end-to-end multilingual workflows:

| Language | Native Script | Voice Synthesis | SOS Dictation | Co-Pilot Briefings |
| :--- | :--- | :---: | :---: | :---: |
| **English** | English | ✅ Supported | ✅ Supported | ✅ Complete |
| **Hindi** | हिन्दी | ✅ Supported | ✅ Supported | ✅ Complete |
| **Bengali** | বাংলা | ✅ Supported | ✅ Supported | ✅ Complete |
| **Tamil** | தமிழ் | ✅ Supported | ✅ Supported | ✅ Complete |
| **Telugu** | తెలుగు | ✅ Supported | ✅ Supported | ✅ Complete |
| **Marathi** | मराठी | ✅ Supported | ✅ Supported | ✅ Complete |

### Voice Features:
- **Speech-to-Text SOS Intake**: Field reporters or operators can click the microphone button to dictate emergency reports hands-free.
- **Audio Equalizer Waveform**: Speech playback displays a 5-bar live equalizer waveform synced to browser audio output.
- **Auto-Readout Mode**: Toggle `Audio ON` in the top navigation bar to have the co-pilot speak all critical incident briefings upon arrival.

---

## 🎮 Interactive Disaster Scenario Simulator

A built-in simulator allows hackathon judges and evaluators to trigger realistic disaster scenarios with zero external API dependencies:

1. **Subarnarekha River Basin Flash Flood (High-Yield Trigger)**: Water rise 1.8m in 45 minutes; over 60 residential houses submerged; families stranded on rooftops.
2. **Heavy Urban Inundation & Embankment Breach**: River breached near Doranda lowlands; 120+ households waterlogged; electrical substation failure.
3. **Cyclone Storm Surge & Waterlogging**: 75 km/h surface wind gusts, coastal shelter staging required.
4. **Dam Sluice Gate Overflow Crisis**: Upstream reservoir water at 98% capacity; emergency spillway discharge initiated.
5. **Hospital ICU Power & Inundation Failure**: Critical emergency medical facility triage requiring backup generators and boat evacuation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| **UI & Styling** | Tailwind CSS v4, Lucide Icons, Custom Glowing Radial Gauge SVGs |
| **GIS Mapping** | Leaflet with CartoDB Dark Matter, CartoDB Voyager, and Esri Satellite CDN tiles |
| **Backend API** | Python 3.11, FastAPI, Uvicorn, Pydantic v2 |
| **Agent Orchestration** | Custom Python State Machine / LangGraph pattern |
| **AI Models & LLM** | Google Gemini 2.5 Flash with deterministic offline regex/NLP fallback |
| **Real-Time Streaming** | FastAPI WebSockets (`/ws/incidents`) & HTML5 Web Audio API |
| **Testing** | Pytest (7/7 unit & integration tests passing) |

---

## 🚀 Quickstart & Local Installation

### Prerequisites
- **Node.js** 18+ & **npm**
- **Python** 3.11+
- *(Optional)* `GEMINI_API_KEY` for live generative responses (runs seamlessly in offline simulated mode without a key).

### 1. Clone the Repository
```bash
git clone https://github.com/Ranjeet7680/DisasterLens-AI-Real-Time-Disaster-Intelligence-Response-Co-Pilot.git
cd DisasterLens-AI-Real-Time-Disaster-Intelligence-Response-Co-Pilot
```

### 2. Backend Setup
```bash
# Navigate to project root
python -m venv backend/venv

# Activate virtual environment (Windows PowerShell)
.\backend\venv\Scripts\Activate.ps1
# Or on Linux/macOS: source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Start backend server (binds to 0.0.0.0:8000)
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
# In a new terminal, navigate to frontend/
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```
Dashboard will be live at: `http://localhost:3000`

---

## 🧪 Automated Test Suite

Run the full automated test suite covering deterministic mathematical scoring, hard safety override rules, Haversine deduplication, and multilingual co-pilot services:

```bash
.\backend\venv\Scripts\pytest.exe -v
```

```text
============================= test session starts =============================
backend/tests/test_agents.py::test_full_orchestrator_pipeline PASSED     [ 14%]
backend/tests/test_agents.py::test_disaster_copilot_indian_languages PASSED [ 28%]
backend/tests/test_risk_engine.py::test_risk_formula_calculation PASSED  [ 42%]
backend/tests/test_risk_engine.py::test_hard_safety_rule_imminent_danger_override PASSED [ 57%]
backend/tests/test_validation.py::test_haversine_distance PASSED         [ 71%]
backend/tests/test_validation.py::test_word_overlap_similarity PASSED    [ 85%]
backend/tests/test_validation.py::test_validation_schema_and_coordinates PASSED [100%]
============================== 7 passed in 3.74s ==============================
```

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
