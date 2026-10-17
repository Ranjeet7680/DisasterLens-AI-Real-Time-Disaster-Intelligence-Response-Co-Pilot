import os
import httpx
import json
import logging
from typing import Dict, Any, Tuple, Optional

logger = logging.getLogger("disasterlens.llm")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

async def generate_briefing(incident: Dict[str, Any], risk: Dict[str, Any], hazard: Dict[str, Any], recommendations: list) -> Tuple[str, str]:
    """
    Generates structured English and Hindi decision briefings.
    Uses Gemini API if key is available, or deterministic template engine otherwise.
    """
    if GEMINI_API_KEY:
        try:
            prompt = f"""
You are the DisasterLens AI Lead Disaster Decision Co-Pilot.
Generate a concise, professional, military/EOC-grade decision brief based on this disaster incident data:

INCIDENT:
- ID: {incident.get('incident_id')}
- Hazard: {incident.get('hazard_type')}
- Description: {incident.get('description')}
- Location: {incident.get('location')}

RISK ANALYSIS:
- Composite Score: {risk.get('composite_score')}/100 ({risk.get('severity_band')})
- Hazard: {risk.get('hazard_score')}, Exposure: {risk.get('exposure_score')}, Vulnerability: {risk.get('vulnerability_score')}, Data Freshness: {risk.get('data_freshness_score')}
- Safety Override: {risk.get('hard_safety_rule_triggered')} (Reason: {risk.get('safety_override_reason')})

HAZARD CONTEXT:
- Inundation/Indicators: {hazard.get('observed_indicators')}
- Forecast Window: {hazard.get('forecast_window')}

RECOMMENDATIONS:
{json.dumps(recommendations, indent=2)}

Format your response as valid JSON with two keys:
"summary_en": "Concise 3-sentence operational situation report in English with clear rationale and action.",
"summary_hi": "The exact equivalent operational situation report translated into formal Hindi (Devanagari script) suitable for state disaster control rooms."
"""
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"response_mime_type": "application/json"}
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(text)
                    return parsed.get("summary_en", ""), parsed.get("summary_hi", "")
        except Exception as e:
            logger.warning(f"LLM API call failed or timed out ({e}). Falling back to deterministic briefing engine.")

    # High-quality deterministic fallback engine
    hazard_type = incident.get("hazard_type", "flood").replace("_", " ").title()
    loc = incident.get("location", {})
    region = loc.get("region", "Ranchi District") if isinstance(loc, dict) else "Affected District"
    score = risk.get("composite_score", 50)
    band = risk.get("severity_band", "MEDIUM")
    override = risk.get("hard_safety_rule_triggered", False)
    override_reason = risk.get("safety_override_reason", "")

    en_brief = (
        f"OPERATIONAL BRIEF: {hazard_type} alert in {region} assessed at {band} priority (Composite Risk Score: {score:.1f}/100). "
    )
    if override:
        en_brief += f"CRITICAL SAFETY OVERRIDE ACTIVATED: {override_reason}. "
    else:
        en_brief += f"Hazard severity is {risk.get('hazard_score', 0):.0f}/100 with exposure of {risk.get('exposure_score', 0):.0f}/100. "
    
    if recommendations:
        top_rec = recommendations[0].get("proposed_action", "Deploy response units.")
        en_brief += f"Recommended immediate action: {top_rec} Pending emergency incident commander approval."

    # High quality Hindi translation for multilingual support requirement
    hi_brief = (
        f"परिचालन संक्षिप्त रिपोर्ट: {region} में {hazard_type} चेतावनी {band} प्राथमिकता स्तर पर दर्ज की गई है (समग्र जोखिम स्कोर: {score:.1f}/100)। "
    )
    if override:
        hi_brief += f"तत्काल सुरक्षा नियम सक्रिय: {override_reason}। "
    else:
        hi_brief += f"आपदा तीव्रता {risk.get('hazard_score', 0):.0f}/100 तथा प्रभावित जनसंख्या प्रभाव {risk.get('exposure_score', 0):.0f}/100 है। "

    if recommendations:
        top_rec = recommendations[0].get("proposed_action", "राहत और बचाव दल तैनात करें।")
        hi_brief += f"प्रस्तावित त्वरित कार्रवाई: {top_rec} आपातकालीन कमांडर के अनुमोदन की प्रतीक्षा है।"

    return en_brief, hi_brief
