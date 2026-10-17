'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Incident, ResourceItem } from '../lib/types';
import { Layers, Compass, Crosshair, Map, Globe } from 'lucide-react';
import { SupportedLanguage } from '../lib/languages';

interface IncidentMapProps {
  incidents: Incident[];
  resources: ResourceItem[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
  lang: SupportedLanguage;
}

export const IncidentMap: React.FC<IncidentMapProps> = ({
  incidents,
  resources,
  selectedIncident,
  onSelectIncident,
  lang
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const incidentLayerRef = useRef<any>(null);
  const resourceLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const hazardCircleLayerRef = useRef<any>(null);

  // Tactical layer toggle states
  const [baseMapStyle, setBaseMapStyle] = useState<'dark' | 'satellite' | 'street'>('dark');
  const [showRadar, setShowRadar] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [showHazardZones, setShowHazardZones] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const defaultCenter: [number, number] = [23.35, 85.32];

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 12,
          zoomControl: false,
        });

        // Add custom tactical zoom control at bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        hazardCircleLayerRef.current = L.layerGroup().addTo(map);
        routeLayerRef.current = L.layerGroup().addTo(map);
        resourceLayerRef.current = L.layerGroup().addTo(map);
        incidentLayerRef.current = L.layerGroup().addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Update Base Tile Layer cleanly without API keys or watermarks
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      let tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      let tileOptions: any = {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        className: 'tactical-dark-tiles'
      };

      if (baseMapStyle === 'satellite') {
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        tileOptions = {
          attribution: '&copy; Esri, Maxar, Earthstar Geographics',
          maxZoom: 18,
          className: 'tactical-satellite-tiles'
        };
      } else if (baseMapStyle === 'street') {
        tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
        tileOptions = {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
          className: ''
        };
      }

      tileLayerRef.current = L.tileLayer(tileUrl, tileOptions).addTo(map);

      const incGroup = incidentLayerRef.current;
      const resGroup = resourceLayerRef.current;
      const routeGroup = routeLayerRef.current;
      const hazardGroup = hazardCircleLayerRef.current;

      if (!incGroup || !resGroup || !routeGroup || !hazardGroup) return;

      incGroup.clearLayers();
      resGroup.clearLayers();
      routeGroup.clearLayers();
      hazardGroup.clearLayers();

      // 1. Plot Emergency Resources (Shelters, Boats, Pumps)
      if (showResources) {
        resources.forEach((res) => {
          const lat = res.location.latitude;
          const lon = res.location.longitude;
          const isShelter = res.resource_type === 'evacuation_shelter';
          const iconColor = isShelter ? '#8b5cf6' : '#0284c7';
          const iconEmoji = isShelter ? '🏠' : res.resource_type === 'water_pump' ? '⚙️' : '🚤';

          const customIcon = L.divIcon({
            html: `
              <div style="background:${iconColor};color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid #ffffff;box-shadow:0 0 10px ${iconColor};" class="sonar-emitter-blue">
                ${iconEmoji}
              </div>
            `,
            className: 'custom-resource-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });

          const resMarker = L.marker([lat, lon], { icon: customIcon });
          resMarker.bindPopup(`
            <div style="font-family:sans-serif;font-size:12px;min-width:200px;padding:4px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                <strong style="color:${iconColor};text-transform:uppercase;font-size:11px;">${res.resource_type.replace('_', ' ')}</strong>
                <span style="background:${iconColor}22;color:${iconColor};border:1px solid ${iconColor}66;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;">${res.status}</span>
              </div>
              <div style="font-weight:bold;font-size:13px;margin:3px 0;color:#f8fafc;">${res.name}</div>
              <div style="color:#cbd5e1;margin-bottom:3px;">Available: <strong style="color:#38bdf8;">${res.available_capacity} / ${res.capacity}</strong> units</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:4px;">📍 ${res.location.address || ''}</div>
            </div>
          `);
          resGroup.addLayer(resMarker);
        });
      }

      // 2. Plot Incidents & Tactical Hazard Rings
      incidents.forEach((inc) => {
        const lat = inc.location.latitude;
        const lon = inc.location.longitude;
        const isSelected = selectedIncident?.incident_id === inc.incident_id;
        const riskBand = inc.risk_assessment?.severity_band || inc.severity.toUpperCase();
        const score = inc.risk_assessment?.composite_score ?? 50;
        const isOverride = inc.risk_assessment?.hard_safety_rule_triggered;

        let color = '#3b82f6';
        let sonarClass = 'sonar-emitter-blue';
        if (riskBand === 'CRITICAL' || isOverride) {
          color = '#ef4444';
          sonarClass = 'sonar-emitter';
        } else if (riskBand === 'HIGH') {
          color = '#f97316';
          sonarClass = 'sonar-emitter-amber';
        } else if (riskBand === 'MEDIUM') {
          color = '#eab308';
        } else {
          color = '#10b981';
        }

        // Calibrated Multi-Ring Tactical Hazard Perimeter (core danger + perimeter warning)
        if (showHazardZones) {
          const coreRadius = riskBand === 'CRITICAL' ? 550 : riskBand === 'HIGH' ? 380 : 200;
          const outerRadius = coreRadius * 1.5;

          // Outer evacuation perimeter warning circle
          const outerCircle = L.circle([lat, lon], {
            color: color,
            fillColor: color,
            fillOpacity: isSelected ? 0.08 : 0.04,
            radius: outerRadius,
            weight: isSelected ? 1.8 : 1,
            dashArray: '5, 5'
          });
          hazardGroup.addLayer(outerCircle);

          // Inner high-danger flood inundation core
          const innerCircle = L.circle([lat, lon], {
            color: color,
            fillColor: color,
            fillOpacity: isSelected ? 0.25 : 0.15,
            radius: coreRadius,
            weight: isSelected ? 2.5 : 1.5
          });
          hazardGroup.addLayer(innerCircle);
        }

        // Marker Pin with Glowing Radar Ping
        const pinHtml = `
          <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
            <div style="background:${color};color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:900;font-family:monospace;font-size:12px;border:${isSelected ? '3px solid #38bdf8' : '2px solid #ffffff'};box-shadow:0 0 14px ${color};" class="${sonarClass}">
              ${score > 0 ? Math.round(score) : '!'}
            </div>
          </div>
        `;

        const pinIcon = L.divIcon({
          html: pinHtml,
          className: 'tactical-incident-pin',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker([lat, lon], { icon: pinIcon });

        const popupDiv = document.createElement('div');
        popupDiv.style.fontFamily = 'sans-serif';
        popupDiv.style.fontSize = '12px';
        popupDiv.style.minWidth = '230px';
        popupDiv.style.padding = '4px';
        popupDiv.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <span style="font-weight:900;color:${color};font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">
              ${inc.hazard_type.replace('_', ' ')}
            </span>
            <span style="background:${color};color:#fff;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:bold;font-family:monospace;">
              ${score.toFixed(0)}/100 • ${riskBand}
            </span>
          </div>
          <div style="font-weight:bold;color:#f8fafc;font-size:13px;margin-bottom:4px;">${inc.incident_id}</div>
          <div style="color:#cbd5e1;margin-bottom:8px;max-height:70px;overflow-y:auto;line-height:1.4;">${inc.description}</div>
          <div style="font-size:11px;color:#94a3b8;margin-bottom:10px;">📍 ${inc.location.region || inc.location.address || 'Reported Sector'}</div>
        `;

        const btn = document.createElement('button');
        btn.innerText = lang === 'en' ? 'Select for AI Co-Pilot' : 'AI सह-पायलट हेतु चुनें';
        btn.style.width = '100%';
        btn.style.padding = '8px';
        btn.style.background = '#2563eb';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        btn.style.borderRadius = '6px';
        btn.style.fontWeight = 'bold';
        btn.style.cursor = 'pointer';
        btn.onclick = () => onSelectIncident(inc);

        popupDiv.appendChild(btn);
        marker.bindPopup(popupDiv);
        incGroup.addLayer(marker);

        // 3. Draw Tactical Dispatch Routes from Selected Incident to nearby units
        if (isSelected && showRoutes) {
          resources.slice(0, 3).forEach((r) => {
            const polyline = L.polyline(
              [
                [lat, lon],
                [r.location.latitude, r.location.longitude]
              ],
              {
                color: '#38bdf8',
                weight: 2.5,
                dashArray: '6, 8',
                opacity: 0.85
              }
            );

            // Haversine distance in km
            const R = 6371;
            const dLat = (r.location.latitude - lat) * (Math.PI / 180);
            const dLon = (r.location.longitude - lon) * (Math.PI / 180);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat * (Math.PI / 180)) * Math.cos(r.location.latitude * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distKm = (R * c).toFixed(1);

            polyline.bindTooltip(`⚡ Dispatch Vector: ${r.name} (${distKm} km)`, {
              sticky: true,
              className: 'tactical-tooltip'
            });
            routeGroup.addLayer(polyline);
          });
        }
      });

      // Pan smoothly to selected incident
      if (selectedIncident) {
        map.setView(
          [selectedIncident.location.latitude, selectedIncident.location.longitude],
          13,
          { animate: true }
        );
      }
    });

    return () => {
      isMounted = false;
    };
  }, [incidents, resources, selectedIncident, onSelectIncident, showResources, showHazardZones, showRoutes, baseMapStyle, lang]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([23.35, 85.32], 12, { animate: true });
    }
  };

  const handleFocusSelected = () => {
    if (mapInstanceRef.current && selectedIncident) {
      mapInstanceRef.current.setView(
        [selectedIncident.location.latitude, selectedIncident.location.longitude],
        13,
        { animate: true }
      );
    }
  };

  return (
    <div className="relative w-full h-[480px] lg:h-[540px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      {/* Tactical Radar Cone Animation Overlay */}
      {showRadar && <div className="radar-sweep-cone" />}

      {/* Leaflet Map DOM Node */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Left: Basemap Mode Switcher */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 flex items-center gap-1 shadow-2xl">
        <button
          onClick={() => setBaseMapStyle('dark')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            baseMapStyle === 'dark'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🌑</span>
          <span>Tactical Dark</span>
        </button>

        <button
          onClick={() => setBaseMapStyle('satellite')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            baseMapStyle === 'satellite'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Satellite</span>
        </button>

        <button
          onClick={() => setBaseMapStyle('street')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            baseMapStyle === 'street'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          <span>Street</span>
        </button>
      </div>

      {/* Top Right: Tactical Layer Controls */}
      <div className="absolute top-3 right-3 z-[1000] bg-slate-950/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5 text-xs text-slate-300 shadow-2xl">
        <button
          onClick={() => setShowRadar(!showRadar)}
          title="Toggle Radar Sweep Effect"
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
            showRadar ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="w-3 h-3 text-cyan-400" />
          <span className="hidden sm:inline">Radar</span>
        </button>

        <button
          onClick={() => setShowHazardZones(!showHazardZones)}
          title="Toggle Inundation Zones"
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
            showHazardZones ? 'bg-red-950 text-red-300 border border-red-800 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3 h-3 text-red-400" />
          <span className="hidden sm:inline">Zones</span>
        </button>

        <button
          onClick={() => setShowRoutes(!showRoutes)}
          title="Toggle Resource Dispatch Vector Lines"
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
            showRoutes ? 'bg-sky-950 text-sky-300 border border-sky-800 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>⚡</span>
          <span className="hidden sm:inline">Vectors</span>
        </button>

        <div className="h-4 w-px bg-slate-800 mx-0.5" />

        <button
          onClick={handleFocusSelected}
          disabled={!selectedIncident}
          title="Focus Selected Incident"
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition-colors"
        >
          <Crosshair className="w-4 h-4 text-amber-400" />
        </button>

        <button
          onClick={handleResetView}
          title="Reset View to EOC Basin"
          className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Tactical Legend at Bottom Left */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex flex-wrap items-center gap-3.5 shadow-2xl">
        <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
          {lang === 'en' ? 'EOC Legend:' : 'संकेतक:'}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500" />
          <span className="font-medium text-red-300">{lang === 'en' ? 'Critical (>=75)' : 'गंभीर'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span className="font-medium text-orange-300">{lang === 'en' ? 'High' : 'उच्च'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span className="font-medium text-yellow-300">{lang === 'en' ? 'Medium' : 'मध्यम'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span className="font-medium text-purple-300">{lang === 'en' ? 'Shelter' : 'आश्रय'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <span className="font-medium text-sky-300">{lang === 'en' ? 'Rescue Unit' : 'बचाव दल'}</span>
        </div>
      </div>
    </div>
  );
};
