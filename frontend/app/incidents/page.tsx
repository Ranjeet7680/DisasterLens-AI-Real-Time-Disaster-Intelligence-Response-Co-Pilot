'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { fetchIncidents, triggerAnalysis } from '../../lib/api';
import { Incident } from '../../lib/types';
import { DecisionModal } from '../../components/DecisionModal';
import { IncidentReportModal } from '../../components/IncidentReportModal';
import { SimulatorDrawer } from '../../components/SimulatorDrawer';
import { Search, Filter, AlertTriangle, Layers, MapPin, Sparkles, RefreshCw } from 'lucide-react';

import { SupportedLanguage } from '../../lib/languages';

export default function IncidentsPage() {
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filterHazard, setFilterHazard] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const loadIncidents = async () => {
    try {
      const data = await fetchIncidents();
      setIncidents(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleReanalyze = async (id: string) => {
    setAnalyzingId(id);
    try {
      await triggerAnalysis(id);
      await loadIncidents();
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingId(null);
    }
  };

  const filtered = incidents.filter((inc) => {
    if (filterHazard !== 'all' && inc.hazard_type !== filterHazard) return false;
    if (filterSeverity !== 'all' && inc.severity !== filterSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inc.incident_id.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        (inc.location.region || '').toLowerCase().includes(q)
      );
    }
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

      <main className="max-w-[1700px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <span>{lang === 'en' ? 'Disaster Incident Queue & Registry' : 'आपदा घटना कतार एवं रजिस्ट्री'}</span>
            </h1>
            <p className="text-xs text-slate-400">
              {lang === 'en' ? 'Monitor, filter and re-analyze multi-source reports' : 'रिपोर्ट्स की निगरानी व पुनः विश्लेषण करें'}
            </p>
          </div>

          <button
            onClick={loadIncidents}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 self-start sm:self-auto transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Refresh List' : 'रिफ्रेश'}</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={lang === 'en' ? 'Search ID, region, or keywords...' : 'खोजें...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterHazard}
              onChange={(e) => setFilterHazard(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
            >
              <option value="all">{lang === 'en' ? 'All Hazard Types' : 'सभी आपदाएं'}</option>
              <option value="flood">Flood</option>
              <option value="flash_flood">Flash Flood</option>
              <option value="extreme_weather">Extreme Weather</option>
              <option value="cyclone">Cyclone</option>
            </select>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
            >
              <option value="all">{lang === 'en' ? 'All Severities' : 'सभी गंभीरता स्तर'}</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Incidents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((inc) => {
            const score = inc.risk_assessment?.composite_score ?? 50;
            const band = inc.risk_assessment?.severity_band || inc.severity.toUpperCase();
            const isOverride = inc.risk_assessment?.hard_safety_rule_triggered;
            const isDuplicate = inc.verification_status === 'flagged_duplicate';

            return (
              <div
                key={inc.incident_id}
                className={`bg-slate-900 border rounded-xl p-4 shadow-lg flex flex-col justify-between transition-all ${
                  isOverride ? 'border-red-700 bg-red-950/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {inc.incident_id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      band === 'CRITICAL' ? 'bg-red-950 text-red-300 border-red-800' :
                      band === 'HIGH' ? 'bg-orange-950 text-orange-300 border-orange-800' :
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {score.toFixed(0)} • {band}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase text-[10px]">
                      {inc.hazard_type.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      via <strong className="text-slate-300">{inc.source}</strong>
                    </span>
                  </div>

                  {isOverride && (
                    <div className="mb-2 p-2 rounded bg-red-950/60 border border-red-800 text-red-200 text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="font-semibold">Safety Override Active</span>
                    </div>
                  )}

                  {isDuplicate && (
                    <div className="mb-2 p-1.5 rounded bg-purple-950/60 border border-purple-800 text-purple-300 text-[11px]">
                      Duplicate of <strong>{inc.duplicate_of}</strong>
                    </div>
                  )}

                  <p className="text-xs text-slate-300 leading-snug mb-3">
                    {inc.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1 text-slate-400 truncate max-w-[160px]">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{inc.location.region || inc.location.address}</span>
                  </div>

                  <button
                    onClick={() => handleReanalyze(inc.incident_id)}
                    disabled={analyzingId === inc.incident_id}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{analyzingId === inc.incident_id ? 'Analyzing...' : 'Re-run AI'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <IncidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitted={loadIncidents}
        lang={lang}
      />

      <SimulatorDrawer
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onScenarioTriggered={loadIncidents}
        lang={lang}
      />
    </div>
  );
}
