'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../../components/Header';
import { fetchResources } from '../../lib/api';
import { ResourceItem } from '../../lib/types';
import { IncidentReportModal } from '../../components/IncidentReportModal';
import { SimulatorDrawer } from '../../components/SimulatorDrawer';
import {
  Shield,
  Home,
  Anchor,
  Zap,
  Users,
  MapPin,
  Phone,
  RefreshCw,
  CheckCircle2,
  Truck,
  Radio,
  Map,
  LayoutGrid,
  Activity,
  ArrowRight,
  Flame,
  AlertCircle
} from 'lucide-react';
import { SupportedLanguage } from '../../lib/languages';

export default function ResourcesPage() {
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [deployingId, setDeployingId] = useState<string | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const loadResources = async () => {
    try {
      const data = await fetchResources();
      setResources(data);
    } catch (e) {
      console.warn('Failed to load resources:', e);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  // Handle interactive deploy / recall
  const handleToggleDeploy = (id: string) => {
    setDeployingId(id);
    setTimeout(() => {
      setResources((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const isAvailable = r.status === 'available';
          const newStatus = isAvailable ? 'deployed' : 'available';
          const newAvailableCapacity = isAvailable
            ? Math.max(0, r.available_capacity - Math.ceil(r.capacity * 0.4))
            : r.capacity;
          return {
            ...r,
            status: newStatus,
            available_capacity: newAvailableCapacity,
            last_updated: new Date().toISOString()
          };
        })
      );
      setDeployingId(null);
    }, 400);
  };

  const totalCapacity = resources.reduce((acc, r) => acc + r.capacity, 0);
  const totalAvailable = resources.reduce((acc, r) => acc + r.available_capacity, 0);
  const deployedCount = resources.filter((r) => r.status === 'deployed').length;
  const availableCount = resources.filter((r) => r.status === 'available').length;

  const filtered = resources.filter((r) => {
    if (filterType !== 'all' && r.resource_type !== filterType) return false;
    return true;
  });

  // Initialize Depot Map if in map mode
  useEffect(() => {
    if (viewMode !== 'map' || typeof window === 'undefined' || !mapContainerRef.current) return;

    import('leaflet').then((L) => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [23.35, 85.32],
          zoom: 12,
          zoomControl: false
        });
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
          attribution: '&copy; Esri, HERE, Garmin, USGS',
          maxZoom: 19
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      map.invalidateSize();

      // Clear existing markers and redraw
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
          map.removeLayer(layer);
        }
      });

      resources.forEach((res) => {
        const lat = res.location.latitude;
        const lon = res.location.longitude;
        const isShelter = res.resource_type === 'evacuation_shelter';
        const isBoat = res.resource_type === 'rescue_boat';
        const color = isShelter ? '#8b5cf6' : isBoat ? '#0284c7' : '#10b981';
        const emoji = isShelter ? '🏠' : isBoat ? '🚤' : '⚙️';

        const customIcon = L.divIcon({
          html: `
            <div style="background:${color};color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:15px;border:2px solid #ffffff;box-shadow:0 0 12px ${color};">
              ${emoji}
            </div>
          `,
          className: 'resource-depot-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family:sans-serif;font-size:12px;min-width:200px;">
            <strong style="color:${color};text-transform:uppercase;font-size:11px;">${res.resource_type.replace('_', ' ')}</strong>
            <div style="font-weight:bold;font-size:13px;margin:3px 0;color:#f8fafc;">${res.name}</div>
            <div style="color:#cbd5e1;margin-bottom:3px;">Available: <strong style="color:#38bdf8;">${res.available_capacity} / ${res.capacity}</strong> units</div>
            <div style="font-size:11px;color:#94a3b8;">📍 ${res.location.address || ''}</div>
            <div style="font-size:11px;color:#cbd5e1;margin-top:4px;">📞 ${res.contact}</div>
          </div>
        `);

        // Coverage radius circle
        L.circle([lat, lon], {
          radius: 2000,
          color: color,
          fillColor: color,
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: '4, 4'
        }).addTo(map);
      });
    });
  }, [viewMode, resources]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans tactical-grid">
      <Header
        lang={lang}
        setLang={setLang}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
      />

      <main className="max-w-[1700px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1 pt-8 sm:pt-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-800 text-indigo-400 shadow-md">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                  <span>{lang === 'en' ? 'Disaster Response Resource Board' : 'आपदा राहत संसाधन बोर्ड'}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    STAGING INVENTORY
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  {lang === 'en'
                    ? 'Track real-time capacity and trigger simulated dispatches for rescue boats, shelters, and platoons'
                    : 'आश्रय स्थल, नौकाएं, एनडीआरएफ प्लाटून एवं पंप क्षमता की वास्तविक समय निगरानी व परिनियोजन'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={loadResources}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'en' ? 'Refresh Inventory' : 'रिफ्रेश'}</span>
            </button>
          </div>
        </div>

        {/* Fleet Readiness KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Capacity
              </span>
              <span className="text-2xl font-black font-mono text-white mt-0.5 block">
                {totalCapacity} <span className="text-xs font-normal text-slate-400">units</span>
              </span>
            </div>
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-900/80 p-3.5 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                Available Capacity
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400 mt-0.5 block">
                {totalAvailable} <span className="text-xs font-normal text-emerald-300/80">souls / units</span>
              </span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-sky-950/40 border border-sky-900/80 p-3.5 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
                Active Depots
              </span>
              <span className="text-2xl font-black font-mono text-sky-300 mt-0.5 block">
                {resources.length}
              </span>
            </div>
            <Home className="w-5 h-5 text-sky-400" />
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-amber-950/40 border border-amber-900/80 p-3.5 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Deployed Units
              </span>
              <span className="text-2xl font-black font-mono text-amber-400 mt-0.5 block">
                {deployedCount} <span className="text-xs font-normal text-amber-300">dispatched</span>
              </span>
            </div>
            <Truck className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
        </div>

        {/* Filters and View Switcher */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-xl backdrop-blur-md">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {[
              { id: 'all', label: lang === 'en' ? 'All Resources' : 'सभी संसाधन', count: resources.length },
              { id: 'evacuation_shelter', label: lang === 'en' ? 'Shelters' : 'राहत शिविर', count: resources.filter(r => r.resource_type === 'evacuation_shelter').length },
              { id: 'rescue_boat', label: lang === 'en' ? 'Rescue Boats' : 'बचाव नावें', count: resources.filter(r => r.resource_type === 'rescue_boat').length },
              { id: 'ndrf_platoon', label: lang === 'en' ? 'NDRF / SDRF' : 'एनडीआरएफ', count: resources.filter(r => r.resource_type === 'ndrf_platoon').length },
              { id: 'water_pump', label: lang === 'en' ? 'Pumps' : 'डीवाटरिंग पंप', count: resources.filter(r => r.resource_type === 'water_pump').length },
              { id: 'medical_team', label: lang === 'en' ? 'Medical' : 'चिकित्सा दल', count: resources.filter(r => r.resource_type === 'medical_team').length },
              { id: 'emergency_drone', label: lang === 'en' ? 'Drones' : 'ड्रोन स्क्वाड', count: resources.filter(r => r.resource_type === 'emergency_drone').length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  filterType === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] font-mono">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Grid vs Depot Map */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md transition-all font-semibold flex items-center gap-1.5 ${
                viewMode === 'grid' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-md transition-all font-semibold flex items-center gap-1.5 ${
                viewMode === 'map' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Depot Map</span>
            </button>
          </div>
        </div>

        {/* Content: Grid Cards vs Depot Map */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((res) => {
              const isAvailable = res.status === 'available';
              const pct = Math.round((res.available_capacity / res.capacity) * 100);
              const isShelter = res.resource_type === 'evacuation_shelter';
              const isBoat = res.resource_type === 'rescue_boat';
              const isDeploying = deployingId === res.id;

              return (
                <div
                  key={res.id}
                  className={`bg-slate-900 border rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all hover:-translate-y-0.5 ${
                    isAvailable
                      ? 'border-slate-800 hover:border-slate-700'
                      : 'border-amber-700/80 bg-amber-950/10'
                  }`}
                >
                  <div>
                    {/* Top Row: ID & Status Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-slate-400 font-bold">
                        {res.id}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                          isAvailable
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}
                      >
                        ● {res.status}
                      </span>
                    </div>

                    {/* Name & Type */}
                    <h3 className="font-bold text-sm text-white mb-1">
                      {res.name}
                    </h3>
                    <div className="text-xs text-cyan-400 font-medium capitalize mb-3 flex items-center gap-1">
                      <span>{isShelter ? '🏠' : isBoat ? '🚤' : '⚙️'}</span>
                      <span>{res.resource_type.replace('_', ' ')}</span>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-400">Available Capacity:</span>
                        <span className="font-mono text-white font-bold">
                          {res.available_capacity} / {res.capacity}{' '}
                          <span className="text-slate-400 text-[10px]">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct > 50
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : pct > 20
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                              : 'bg-gradient-to-r from-red-500 to-orange-400'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Depot Location & Contact */}
                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{res.location.address || 'Ranchi Basin Depot'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-mono text-[11px]">{res.contact}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deploy Action Button */}
                  <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Updated {new Date(res.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <button
                      onClick={() => handleToggleDeploy(res.id)}
                      disabled={isDeploying}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                        isAvailable
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/60'
                          : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
                      }`}
                    >
                      <Truck className={`w-3.5 h-3.5 ${isDeploying ? 'animate-spin' : ''}`} />
                      <span>{isAvailable ? 'Deploy Unit' : 'Return Standby'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Depot Map View */
          <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#080d1a]">
            <div ref={mapContainerRef} className="w-full h-full" />
            <div className="absolute top-3 left-3 z-[1000] bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-xs text-slate-200 shadow-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Ranchi Basin Emergency Staging &amp; Shelters Map</span>
            </div>
          </div>
        )}
      </main>

      <IncidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitted={loadResources}
        lang={lang}
      />

      <SimulatorDrawer
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onScenarioTriggered={loadResources}
        lang={lang}
      />
    </div>
  );
}
