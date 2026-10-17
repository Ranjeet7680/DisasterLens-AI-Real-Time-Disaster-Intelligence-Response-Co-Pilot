'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Incident, ResourceItem } from '../lib/types';
import { Eye, EyeOff, Navigation, Layers, Compass, Crosshair } from 'lucide-react';
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
  const incidentLayerRef = useRef<any>(null);
  const resourceLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const hazardCircleLayerRef = useRef<any>(null);

  // Tactical layer toggle states
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

        // Dark tactical CartoDB map tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; CartoDB &copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);

        hazardCircleLayerRef.current = L.layerGroup().addTo(map);
        routeLayerRef.current = L.layerGroup().addTo(map);
        resourceLayerRef.current = L.layerGroup().addTo(map);
        incidentLayerRef.current = L.layerGroup().addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      const incGroup = incidentLayerRef.current;
      const resGroup = resourceLayerRef.current;
      const routeGroup = routeLayerRef.current;
      const hazardGroup = hazardCircleLayerRef.current;

      if (!incGroup || !resGroup || !routeGroup || !hazardGroup) return;

      incGroup.clearLayers();
      resGroup.clearLayers();
      routeGroup.clearLayers();
      hazardGroup.clearLayers();

      // 1. Plot Resources if enabled
      if (showResources) {
        resources.forEach((res) => {
          const lat = res.location.latitude;
          const lon = res.location.longitude;
          const isShelter = res.resource_type === 'evacuation_shelter';
          const iconColor = isShelter ? '#7c3aed' : '#0284c7';
          const iconEmoji = isShelter ? '🏠' : res.resource_type === 'water_pump' ? '⚙️' : '🚤';

          const customIcon = L.divIcon({
            html: `
              <div style="background:${iconColor};color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid #ffffff;box-shadow:0 3px 8px rgba(0,0,0,0.6);" class="sonar-emitter-blue">
                ${iconEmoji}
              </div>
            `,
            className: 'custom-resource-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          const resMarker = L.marker([lat, lon], { icon: customIcon });
          resMarker.bindPopup(`
            <div style="font-family:sans-serif;font-size:12px;min-width:180px;">
              <strong style="color:${iconColor};text-transform:uppercase;">${res.resource_type.replace('_', ' ')}</strong>
              <div style="font-weight:bold;font-size:13px;margin:2px 0;">${res.name}</div>
              <div>Available Capacity: <strong>${res.available_capacity} / ${res.capacity}</strong></div>
              <div>Base Status: <span style="color:#10b981;font-weight:bold;">${res.status}</span></div>
              <div style="font-size:10px;color:#94a3b8;margin-top:4px;">${res.location.address || ''}</div>
            </div>
          `);
          resGroup.addLayer(resMarker);
        });
      }

      // 2. Plot Incidents & Pulsing Zones
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

        // Hazard Inundation Circle
        if (showHazardZones) {
          const radius = riskBand === 'CRITICAL' ? 1900 : riskBand === 'HIGH' ? 1200 : 700;
          const circle = L.circle([lat, lon], {
            color: color,
            fillColor: color,
            fillOpacity: isSelected ? 0.28 : 0.16,
            radius: radius,
            weight: isSelected ? 2.5 : 1.2,
            dashArray: isSelected ? '4, 4' : undefined
          });
          hazardGroup.addLayer(circle);
        }

        // Marker Pin
        const pinHtml = `
          <div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
            <div style="background:${color};color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:${isSelected ? '3px solid #38bdf8' : '2px solid #ffffff'};box-shadow:0 4px 12px rgba(0,0,0,0.7);" class="${sonarClass}">
              ${score > 0 ? Math.round(score) : '!'}
            </div>
          </div>
        `;

        const pinIcon = L.divIcon({
          html: pinHtml,
          className: 'tactical-incident-pin',
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        const marker = L.marker([lat, lon], { icon: pinIcon });

        const popupDiv = document.createElement('div');
        popupDiv.style.fontFamily = 'sans-serif';
        popupDiv.style.fontSize = '12px';
        popupDiv.style.minWidth = '220px';
        popupDiv.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <span style="font-weight:bold;color:${color};font-size:11px;text-transform:uppercase;">
              ${inc.hazard_type.replace('_', ' ')}
            </span>
            <span style="background:${color};color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;">
              ${score.toFixed(0)}/100
            </span>
          </div>
          <div style="font-weight:bold;color:#f8fafc;font-size:13px;margin-bottom:2px;">${inc.incident_id}</div>
          <div style="color:#cbd5e1;margin-bottom:6px;max-height:60px;overflow-y:auto;line-height:1.3;">${inc.description}</div>
          <div style="font-size:10px;color:#94a3b8;margin-bottom:8px;">${inc.location.region || inc.location.address || ''}</div>
        `;

        const btn = document.createElement('button');
        btn.innerText = lang === 'en' ? 'Select for AI Co-Pilot' : 'AI सह-पायलट हेतु चुनें';
        btn.style.width = '100%';
        btn.style.padding = '6px';
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
                weight: 2,
                dashArray: '6, 8',
                opacity: 0.75
              }
            );
            polyline.bindTooltip(`Route to ${r.name}`, { sticky: true });
            routeGroup.addLayer(polyline);
          });
        }
      });

      // Pan to selected incident
      if (selectedIncident) {
        map.setView(
          [selectedIncident.location.latitude, selectedIncident.location.longitude],
          14,
          { animate: true }
        );
      }
    });

    return () => {
      isMounted = false;
    };
  }, [incidents, resources, selectedIncident, onSelectIncident, showResources, showHazardZones, showRoutes, lang]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([23.35, 85.32], 12, { animate: true });
    }
  };

  const handleFocusSelected = () => {
    if (mapInstanceRef.current && selectedIncident) {
      mapInstanceRef.current.setView(
        [selectedIncident.location.latitude, selectedIncident.location.longitude],
        14,
        { animate: true }
      );
    }
  };

  return (
    <div className="relative w-full h-[460px] lg:h-[530px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      {/* Tactical Radar Cone Animation Overlay */}
      {showRadar && <div className="radar-sweep-cone" />}

      {/* The Leaflet Map DOM Node */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Map Layer Control Bar */}
      <div className="absolute top-3 right-3 z-[1000] bg-slate-950/85 backdrop-blur-md p-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5 text-xs text-slate-300 shadow-xl">
        <button
          onClick={() => setShowRadar(!showRadar)}
          title="Toggle Radar Sweep Effect"
          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
            showRadar ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="w-3 h-3 text-cyan-400" />
          <span className="hidden sm:inline">Radar</span>
        </button>

        <button
          onClick={() => setShowHazardZones(!showHazardZones)}
          title="Toggle Inundation Zones"
          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
            showHazardZones ? 'bg-red-950 text-red-300 border border-red-800' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3 h-3 text-red-400" />
          <span className="hidden sm:inline">Zones</span>
        </button>

        <button
          onClick={() => setShowRoutes(!showRoutes)}
          title="Toggle Resource Dispatch Vector Lines"
          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
            showRoutes ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Navigation className="w-3 h-3 text-sky-400" />
          <span className="hidden sm:inline">Vectors</span>
        </button>

        <button
          onClick={handleFocusSelected}
          disabled={!selectedIncident}
          title="Center Map on Selected Incident"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition-colors"
        >
          <Crosshair className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>

      {/* Tactical Legend at Bottom Left */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex flex-wrap items-center gap-3 shadow-2xl">
        <span className="font-semibold text-slate-400">
          {lang === 'en' ? 'Tactical Map Legend:' : 'संकेतक:'}
        </span>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span>{lang === 'en' ? 'Critical (>=75)' : 'गंभीर'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span>{lang === 'en' ? 'High' : 'उच्च'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span>{lang === 'en' ? 'Medium' : 'मध्यम'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>{lang === 'en' ? 'Shelter' : 'आश्रय'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <span>{lang === 'en' ? 'Rescue Unit' : 'बचाव दल'}</span>
        </div>
      </div>
    </div>
  );
};
