'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { fetchResources } from '../../lib/api';
import { ResourceItem } from '../../lib/types';
import { IncidentReportModal } from '../../components/IncidentReportModal';
import { SimulatorDrawer } from '../../components/SimulatorDrawer';
import { Shield, Home, Anchor, Zap, Users, MapPin, Phone, RefreshCw, CheckCircle2 } from 'lucide-react';

import { SupportedLanguage } from '../../lib/languages';

export default function ResourcesPage() {
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [filterType, setFilterType] = useState('all');

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const loadResources = async () => {
    try {
      const data = await fetchResources();
      setResources(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const filtered = resources.filter((r) => {
    if (filterType !== 'all' && r.resource_type !== filterType) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        lang={lang}
        setLang={setLang}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
      />

      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              <span>{lang === 'en' ? 'Disaster Response Resource Board' : 'आपदा राहत संसाधन बोर्ड'}</span>
            </h1>
            <p className="text-xs text-slate-400">
              {lang === 'en' ? 'Track real-time capacity of shelters, rescue boats, NDRF platoons and pumps' : 'आश्रय स्थल, नौकाएं एवं पंप क्षमता'}
            </p>
          </div>

          <button
            onClick={loadResources}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 self-start sm:self-auto transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Refresh Inventory' : 'रिफ्रेश'}</span>
          </button>
        </div>

        {/* Resource Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: lang === 'en' ? 'All Resources' : 'सभी संसाधन' },
            { id: 'evacuation_shelter', label: lang === 'en' ? 'Evacuation Shelters' : 'राहत शिविर' },
            { id: 'rescue_boat', label: lang === 'en' ? 'Rescue Boats' : 'बचाव नावें' },
            { id: 'ndrf_platoon', label: lang === 'en' ? 'NDRF / SDRF Platoons' : 'एनडीआरएफ प्लाटून' },
            { id: 'water_pump', label: lang === 'en' ? 'High-Volume Pumps' : 'डीवाटरिंग पंप' },
            { id: 'medical_team', label: lang === 'en' ? 'Mobile Medical Units' : 'चिकित्सा दल' },
            { id: 'emergency_drone', label: lang === 'en' ? 'Recon Drones' : 'ड्रोन स्क्वाड' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filterType === tab.id
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Resource Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((res) => {
            const isAvailable = res.status === 'available';
            const pct = Math.round((res.available_capacity / res.capacity) * 100);

            return (
              <div
                key={res.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-400">{res.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      isAvailable ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-red-950 text-red-300 border-red-800'
                    }`}>
                      {res.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white mb-1">{res.name}</h3>
                  <div className="text-xs text-indigo-400 font-medium mb-3 capitalize">
                    {res.resource_type.replace('_', ' ')}
                  </div>

                  {/* Capacity Bar */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 mb-3 text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span>Available Capacity:</span>
                      <strong className="text-white font-mono">{res.available_capacity} / {res.capacity}</strong>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${pct > 40 ? 'bg-emerald-500' : pct > 15 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer details */}
                <div className="pt-3 border-t border-slate-800 text-xs space-y-1.5 text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{res.location.address || 'Designated Base'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-mono text-slate-300">{res.contact}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
