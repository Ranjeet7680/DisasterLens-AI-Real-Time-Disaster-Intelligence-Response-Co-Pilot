'use client';

import React, { useEffect, useRef } from 'react';
import { Incident, ResourceItem } from '../lib/types';

interface IncidentMapProps {
  incidents: Incident[];
  resources: ResourceItem[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
  lang: 'en' | 'hi';
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
  const layerGroupRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    // Dynamically import Leaflet on client side
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Fix default marker icon assets
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Default center around Ranchi emergency basin
      const defaultCenter: [number, number] = [23.35, 85.32];

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 12,
          zoomControl: true,
        });

        // Dark-themed tactical tiles from CartoDB or OpenStreetMap
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://carto.com/">CartoDB</a> &copy; OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        const layerGroup = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
        layerGroupRef.current = layerGroup;
      }

      // Re-draw markers when incidents or resources change
      const layerGroup = layerGroupRef.current;
      if (layerGroup) {
        layerGroup.clearLayers();

        // 1. Plot Resource Units (Shelters & Rescue Boats)
        resources.forEach((res) => {
          const lat = res.location.latitude;
          const lon = res.location.longitude;
          const isShelter = res.resource_type === 'evacuation_shelter';
          const iconHtml = isShelter
            ? `<div style="background:#7c3aed;color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.5);" title="${res.name}">🏠</div>`
            : `<div style="background:#0284c7;color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.5);" title="${res.name}">🚤</div>`;

          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-resource-marker',
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          });

          const resMarker = L.marker([lat, lon], { icon: customIcon });
          resMarker.bindPopup(`
            <div style="font-family:sans-serif;font-size:12px;min-width:180px;">
              <strong style="color:#a855f7;">${isShelter ? 'Evacuation Shelter' : 'Response Unit'}</strong>
              <div style="font-weight:bold;margin:2px 0;">${res.name}</div>
              <div>Available Capacity: <strong>${res.available_capacity} / ${res.capacity}</strong></div>
              <div>Status: <span style="color:#10b981;font-weight:bold;">${res.status}</span></div>
              <div style="font-size:10px;color:#94a3b8;margin-top:4px;">${res.location.address || ''}</div>
            </div>
          `);
          layerGroup.addLayer(resMarker);
        });

        // 2. Plot Incidents with Risk-weighted styles
        incidents.forEach((inc) => {
          const lat = inc.location.latitude;
          const lon = inc.location.longitude;
          const riskBand = inc.risk_assessment?.severity_band || inc.severity.toUpperCase();
          const score = inc.risk_assessment?.composite_score ?? 50;
          const isOverride = inc.risk_assessment?.hard_safety_rule_triggered;

          let color = '#3b82f6';
          if (riskBand === 'CRITICAL' || isOverride) color = '#ef4444';
          else if (riskBand === 'HIGH') color = '#f97316';
          else if (riskBand === 'MEDIUM') color = '#eab308';
          else color = '#10b981';

          // Pulsing hazard impact radius overlay
          const circleRadius = riskBand === 'CRITICAL' ? 1800 : riskBand === 'HIGH' ? 1200 : 700;
          const circle = L.circle([lat, lon], {
            color: color,
            fillColor: color,
            fillOpacity: 0.18,
            radius: circleRadius,
            weight: 1.5,
          });
          layerGroup.addLayer(circle);

          // Marker Pin
          const markerHtml = `
            <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
              ${isOverride ? '<div style="position:absolute;width:42px;height:42px;border-radius:50%;border:2px solid #ef4444;animation:pulse-ring 1.8s infinite;"></div>' : ''}
              <div style="background:${color};color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:11px;border:2px solid #ffffff;box-shadow:0 3px 8px rgba(0,0,0,0.6);">
                ${score > 0 ? Math.round(score) : '!'}
              </div>
            </div>
          `;

          const pinIcon = L.divIcon({
            html: markerHtml,
            className: 'custom-incident-pin',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const marker = L.marker([lat, lon], { icon: pinIcon });

          const popupContent = document.createElement('div');
          popupContent.style.fontFamily = 'sans-serif';
          popupContent.style.fontSize = '12px';
          popupContent.style.minWidth = '220px';
          popupContent.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
              <span style="font-weight:bold;color:${color};font-size:11px;text-transform:uppercase;">
                ${inc.hazard_type.replace('_', ' ')}
              </span>
              <span style="background:${color};color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;">
                ${score.toFixed(0)}/100
              </span>
            </div>
            <div style="font-weight:bold;color:#1e293b;margin-bottom:4px;">${inc.incident_id}</div>
            <div style="color:#475569;margin-bottom:6px;max-height:60px;overflow-y:auto;">${inc.description}</div>
            <div style="font-size:10px;color:#64748b;margin-bottom:8px;">${inc.location.address || 'Coordinates verified'}</div>
          `;

          const btn = document.createElement('button');
          btn.innerText = lang === 'en' ? 'Inspect Incident & AI Brief' : 'जांच करें और AI रिपोर्ट देखें';
          btn.style.width = '100%';
          btn.style.padding = '6px';
          btn.style.background = '#2563eb';
          btn.style.color = '#fff';
          btn.style.border = 'none';
          btn.style.borderRadius = '4px';
          btn.style.fontWeight = 'bold';
          btn.style.cursor = 'pointer';
          btn.onclick = () => onSelectIncident(inc);

          popupContent.appendChild(btn);
          marker.bindPopup(popupContent);
          layerGroup.addLayer(marker);
        });
      }

      // If an incident is selected, pan the map to it
      if (selectedIncident && mapInstanceRef.current) {
        mapInstanceRef.current.setView(
          [selectedIncident.location.latitude, selectedIncident.location.longitude],
          14,
          { animate: true }
        );
      }
    });

    return () => {
      isMounted = false;
    };
  }, [incidents, resources, selectedIncident, onSelectIncident, lang]);

  return (
    <div className="relative w-full h-[450px] lg:h-[520px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Tactical Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex flex-wrap items-center gap-3 shadow-lg">
        <span className="font-semibold text-slate-400">
          {lang === 'en' ? 'Tactical Legend:' : 'संकेतक:'}
        </span>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>{lang === 'en' ? 'Critical (>=75)' : 'गंभीर'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span>{lang === 'en' ? 'High (55-74)' : 'उच्च'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span>{lang === 'en' ? 'Medium (35-54)' : 'मध्यम'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>{lang === 'en' ? 'Shelter' : 'राहत आश्रय'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <span>{lang === 'en' ? 'Rescue Team' : 'बचाव दल'}</span>
        </div>
      </div>
    </div>
  );
};
