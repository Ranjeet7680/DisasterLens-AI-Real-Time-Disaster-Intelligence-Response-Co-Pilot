import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import logging

from .database.db import init_db, seed_initial_resources
from .services.websocket_manager import ws_manager
from .api.incidents import router as incidents_router
from .api.alerts import router as alerts_router
from .api.resources import router as resources_router
from .api.recommendations import router as recommendations_router
from .api.audit import router as audit_router
from .api.simulator import router as simulator_router
from .api.weather import router as weather_router
from .api.metrics import router as metrics_router
from .api.copilot import router as copilot_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("disasterlens.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing DisasterLens AI Database & Seed Resources...")
    init_db()
    seed_initial_resources()
    logger.info("DisasterLens AI backend ready for critical decision support.")
    yield
    logger.info("Shutting down DisasterLens AI backend.")

app = FastAPI(
    title="DisasterLens AI — Real-Time Disaster Intelligence & Response Co-Pilot",
    description="Multi-agent disaster response platform integrating live ingestion, risk scoring, evidence-backed recommendations, and human approval.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API routers
app.include_router(incidents_router)
app.include_router(alerts_router)
app.include_router(resources_router)
app.include_router(recommendations_router)
app.include_router(audit_router)
app.include_router(simulator_router)
app.include_router(weather_router)
app.include_router(metrics_router)
app.include_router(copilot_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "DisasterLens AI Decision Engine",
        "version": "1.0.0",
        "agents": [
            "Hazard Intelligence Agent",
            "Report Validation Agent",
            "Risk Assessment Agent",
            "Response Planning Agent",
            "Decision Orchestrator"
        ]
    }

@app.websocket("/ws/incidents")
async def websocket_incidents_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; accept any ping/pong or client messages
            data = await websocket.receive_text()
            logger.debug(f"Received client WS message: {data}")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket connection error: {e}")
        ws_manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
