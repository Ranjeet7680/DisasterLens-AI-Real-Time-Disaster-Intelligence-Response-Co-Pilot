'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../../components/Header';
import { IncidentReportModal } from '../../components/IncidentReportModal';
import { SimulatorDrawer } from '../../components/SimulatorDrawer';
import {
  Compass,
  MapPin,
  Volume2,
  VolumeX,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Users,
  Home,
  Waves,
  ArrowRight,
  Radio,
  FileCheck2,
  ExternalLink
} from 'lucide-react';
import { SupportedLanguage } from '../../lib/languages';
import { speakText, stopSpeaking } from '../../lib/voice';

export default function EvacuationPage() {
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedShelter, setSelectedShelter] = useState<string>('Morabadi');

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const broadcastEn =
    'OFFICIAL EVACUATION DIRECTIVE: All residents of Ward 14 Doranda Lowlands and Subarnarekha Riverbank are advised to proceed immediately via Main Road North Corridor toward Morabadi Indoor Stadium. Avoid Low-lying Riverbank Causeway which is submerged. Emergency transport boats are active at Bariatu Depot.';
  const broadcastHi =
    'आधिकारिक निकासी निर्देश: वार्ड 14 डोरंडा निचले इलाकों और सुवर्णरेखा नदी तट के सभी निवासियों को तुरंत मेन रोड नॉर्थ कॉरिडोर के माध्यम से मोरहाबादी इंडोर स्टेडियम की ओर बढ़ने की सलाह दी जाती है। निचले नदी तट कॉजवे से बचें क्योंकि वह जलमग्न है। बरियातू डिपो पर आपातकालीन नावें सक्रिय हैं।';

  const activeBroadcast = lang === 'hi' ? broadcastHi : broadcastEn;

  const handleToggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(activeBroadcast, lang, () => setIsSpeaking(false));
    }
  };

  const shelters = [
    {
      name: 'Morabadi Community Indoor Stadium',
      shortKey: 'Morabadi',
      capacity: 500,
      occupied: 480,
      status: 'Open & Active',
      foodDays: 5,
      cleanWaterLiters: 12000,
      medicalDoctor: 'Dr. S. K. Roy (RIMS)',
      powerBackup: '150 kVA Generator Online',
      coords: [23.385, 85.328] as [number, number]
    },
    {
      name: 'Dhurwa Dam High-Ground Relief Camp',
      shortKey: 'Dhurwa',
      capacity: 400,
      occupied: 310,
      status: 'Open & Active',
      foodDays: 4,
      cleanWaterLiters: 8500,
      medicalDoctor: 'Dr. Neha Verma',
      powerBackup: '100 kVA Generator Online',
      coords: [23.315, 85.285] as [number, number]
    },
    {
      name: 'Bariatu Multi-Purpose Shelter Hall',
      shortKey: 'Bariatu',
      capacity: 250,
      occupied: 180,
      status: 'Open & Active',
      foodDays: 3,
      cleanWaterLiters: 6000,
      medicalDoctor: 'SDRF Medical Team 2',
      powerBackup: '65 kVA Generator Online',
      coords: [23.372, 85.352] as [number, number]
    }
  ];

  // Initialize Evacuation Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

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

      // Clear layers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.Circle) {
          map.removeLayer(layer);
        }
      });

      // 1. Plot Safe Evacuation Corridors (Green)
      const safePath1: [number, number][] = [
        [23.335, 85.325],
        [23.350, 85.327],
        [23.370, 85.326],
        [23.385, 85.328]
      ];
      L.polyline(safePath1, {
        color: '#10b981',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        dashArray: '8, 8'
      }).addTo(map).bindPopup('<b>SAFE CORRIDOR A:</b> Main Road North to Morabadi Stadium');

      const safePath2: [number, number][] = [
        [23.325, 85.310],
        [23.320, 85.295],
        [23.315, 85.285]
      ];
      L.polyline(safePath2, {
        color: '#10b981',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        dashArray: '8, 8'
      }).addTo(map).bindPopup('<b>SAFE CORRIDOR B:</b> Ring Road West to Dhurwa Camp');

      // 2. Plot Submerged / Impassable Hazards (Red)
      const floodedRoad: [number, number][] = [
        [23.332, 85.335],
        [23.342, 85.345],
        [23.352, 85.355]
      ];
      L.polyline(floodedRoad, {
        color: '#ef4444',
        weight: 7,
        opacity: 0.95
      }).addTo(map).bindPopup('<b>IMPASSABLE / SUBMERGED:</b> Lowland Riverbank Causeway (1.8m Water Rise)');

      // 3. Plot Shelters
      shelters.forEach((s) => {
        const customIcon = L.divIcon({
          html: `
            <div style="background:#8b5cf6;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid #ffffff;box-shadow:0 0 15px #8b5cf6;">
              🏠
            </div>
          `,
          className: 'shelter-marker',
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        const marker = L.marker(s.coords, { icon: customIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family:sans-serif;font-size:12px;min-width:200px;">
            <strong style="color:#8b5cf6;text-transform:uppercase;font-size:11px;">Muster Station</strong>
            <div style="font-weight:bold;font-size:13px;margin:3px 0;color:#f8fafc;">${s.name}</div>
            <div style="color:#cbd5e1;margin-bottom:3px;">Occupancy: <strong style="color:#34d399;">${s.occupied} / ${s.capacity}</strong></div>
            <div style="font-size:11px;color:#94a3b8;">Clean Water: ${s.cleanWaterLiters.toLocaleString()}L | Food: ${s.foodDays} Days</div>
          </div>
        `);
      });
    });
  }, [lang]);

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
              <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-800 text-purple-400 shadow-md">
                <Compass className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                  <span>{lang === 'en' ? 'Tactical Evacuation Corridors & Shelters GIS' : 'सामरिक निकासी गलियारे एवं राहत शिविर'}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                    SAFE CORRIDORS
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  {lang === 'en'
                    ? 'Identified high-ground transit corridors, submerged hazard bypass routes, and real-time relief camp supply meters'
                    : 'जलमग्न मार्गों से बचाव, सुरक्षित ऊंचाई वाले निकासी गलियारे एवं राहत शिविरों में राशन व पानी की स्थिति'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleVoice}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
                isSpeaking
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSpeaking ? (lang === 'en' ? 'Stop Broadcast' : 'प्रसारण रोकें') : (lang === 'en' ? 'Listen Broadcast' : 'निकासी प्रसारण सुनें')}</span>
            </button>
          </div>
        </div>

        {/* Emergency Broadcast Directive Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-800/80 shadow-2xl flex items-start gap-3">
          <Radio className="w-5 h-5 text-purple-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Official Emergency Broadcast Directive
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-200 border border-purple-700">
                FREQUENCY: VHF 156.8 MHz (CH 16)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {activeBroadcast}
            </p>
          </div>
        </div>

        {/* Map & Corridor Legend Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Tactical Map (8 cols) */}
          <div className="lg:col-span-8 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Ranchi Basin — Dynamic Safe Transit Route Map</span>
              </span>
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Safe Corridor (Green)</span>
                </span>
                <span className="flex items-center gap-1 text-red-400">
                  <span className="w-2.5 h-1.5 rounded-full bg-red-500" />
                  <span>Submerged Road (Red)</span>
                </span>
              </div>
            </div>

            <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#080d1a]">
              <div ref={mapContainerRef} className="w-full h-full" />
            </div>
          </div>

          {/* Right: Shelter Readiness & Inventory Monitor (4 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Home className="w-4 h-4 text-purple-400" />
              <span>Designated Safe Shelters</span>
            </h3>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {shelters.map((s, idx) => {
                const pct = Math.round((s.occupied / s.capacity) * 100);
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-bold text-xs text-white">
                        {s.name}
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                        {s.status}
                      </span>
                    </div>

                    {/* Occupancy Bar */}
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 mb-2.5 text-xs">
                      <div className="flex items-center justify-between mb-1 text-[11px]">
                        <span className="text-slate-400">Shelter Occupancy:</span>
                        <span className="font-mono text-white font-bold">{s.occupied} / {s.capacity} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Logistics Meters */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Ration Supply</span>
                        <strong className="text-amber-300 font-mono">{s.foodDays} Days Reserve</strong>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Potable Water</span>
                        <strong className="text-cyan-300 font-mono">{s.cleanWaterLiters.toLocaleString()} L</strong>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-800 mt-2 text-[10px] font-mono text-slate-400 space-y-0.5">
                      <div>⚕️ Lead Doctor: {s.medicalDoctor}</div>
                      <div>⚡ Power: {s.powerBackup}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <IncidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitted={() => {}}
        lang={lang}
      />

      <SimulatorDrawer
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onScenarioTriggered={() => {}}
        lang={lang}
      />
    </div>
  );
}
