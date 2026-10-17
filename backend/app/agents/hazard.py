import time
from typing import Dict, Any, List
from datetime import datetime, timezone
from ..services.weather import get_live_weather

class HazardIntelligenceAgent:
    name: str = "Hazard Intelligence Agent"

    async def run(self, incident: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.time()
        loc = incident.get("location", {})
        lat = loc.get("latitude", 23.3441)
        lon = loc.get("longitude", 85.3096)
        hazard_type = incident.get("hazard_type", "flood")
        desc = (incident.get("description", "")).lower()

        # Fetch live/calibrated meteorological data
        weather_data = await get_live_weather(lat, lon)
        precip = weather_data.get("precipitation_mm", 15.0)
        wind = weather_data.get("wind_speed_kmh", 25.0)

        # Detect hazard intensity and indicators from description & weather
        indicators: List[str] = []
        severity_factor = 50.0  # default baseline

        if "water level" in desc or "water rising" in desc or "river" in desc or "submerged" in desc:
            indicators.append("River channel breach / surface water inundation reported")
            severity_factor += 20.0
        
        if "trapped" in desc or "stranded" in desc or "swept" in desc:
            indicators.append("Civilians reported trapped or cut off by rising waters")
            severity_factor += 25.0

        if "dam" in desc or "spillway" in desc or "sluice" in desc:
            indicators.append("Reservoir / Dam spillway alert status in catchment")
            severity_factor += 20.0

        if precip > 35.0:
            indicators.append(f"Extreme localized precipitation ({precip} mm/hr) recorded by atmospheric radar")
            severity_factor += 15.0
        elif precip > 15.0:
            indicators.append(f"Heavy sustained rainfall ({precip} mm/hr)")
            severity_factor += 10.0

        if wind > 40.0:
            indicators.append(f"Gale-force surface winds ({wind} km/h) impeding localized drainage")
            severity_factor += 5.0

        if not indicators:
            indicators.append("Preliminary field report with standard seasonal hydrologic threshold")

        severity_factor = min(100.0, max(15.0, severity_factor))

        # Determine flood stage
        if severity_factor >= 80:
            flood_stage = "Extreme Danger / Inundation Active"
            forecast_window = "+2 to +6 hours critical surge"
            affected_radius_km = 4.5
        elif severity_factor >= 60:
            flood_stage = "Danger Threshold Exceeded"
            forecast_window = "+6 to +12 hours sustained high water"
            affected_radius_km = 2.5
        elif severity_factor >= 40:
            flood_stage = "Warning Stage"
            forecast_window = "+12 to +24 hours monitoring window"
            affected_radius_km = 1.2
        else:
            flood_stage = "Advisory Alert"
            forecast_window = "+24 hours forecast"
            affected_radius_km = 0.5

        latency_ms = int((time.time() - start_time) * 1000)

        return {
            "agent_name": self.name,
            "status": "success",
            "latency_ms": latency_ms,
            "hazard_type": hazard_type,
            "flood_stage": flood_stage,
            "hazard_severity_score": round(severity_factor, 1),
            "affected_area_radius_km": affected_radius_km,
            "observed_indicators": indicators,
            "forecast_window": forecast_window,
            "weather_context": weather_data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
