from fastapi import APIRouter, Query
from typing import Dict, Any
from ..services.weather import get_live_weather

router = APIRouter(prefix="/api/weather", tags=["weather"])

@router.get("", response_model=Dict[str, Any])
async def fetch_weather(
    latitude: float = Query(23.3441, ge=-90.0, le=90.0),
    longitude: float = Query(85.3096, ge=-180.0, le=180.0)
):
    weather_info = await get_live_weather(latitude, longitude)
    return weather_info
