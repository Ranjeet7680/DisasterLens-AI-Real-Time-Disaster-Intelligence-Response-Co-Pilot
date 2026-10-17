'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { fetchIncidents, triggerAnalysis } from '../../lib/api';
import { Incident } from '../../lib/types';
import { DecisionModal } from '../../components/DecisionModal';
import { IncidentReportModal } from '../../components/IncidentReportModal';
import { SimulatorDrawer } from '../../components/SimulatorDrawer';
import {
  Search,
  Filter,
  AlertTriangle,
  Layers,
  MapPin,
  Sparkles,
  RefreshCw,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Copy,
  ExternalLink,
  Table as TableIcon,
  LayoutGrid,
  Activity,
  FileCheck,
  Clock
} from 'lucide-react';
import { SupportedLanguage } from '../../lib/languages';

export default function IncidentsPage() {
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filterHazard, setFilterHazard] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [reviewIncident, setReviewIncident] = useState<Incident | null>(null);

  const loadIncidents = async () => {
    try {
      const data = await fetchIncidents();
      setIncidents(data);
    } catch (e) {
      console.warn('Failed to load incidents in registry:', e);
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
      console.warn(e);
    } finally {
      setAnalyzingId(null);
    }
  };

  // Metrics
  const totalCount = incidents.length;
  const criticalCount = incidents.filter(
    (i) => i.severity === 'critical' || i.risk_assessment?.severity_band === 'CRITICAL'
  ).length;
  const overrideCount = incidents.filter(
    (i) => i.risk_assessment?.hard_safety_rule_triggered
  ).length;
  const duplicateCount = incidents.filter(
    (i) => i.verification_status === 'flagged_duplicate' || !!i.duplicate_of
  ).length;

  const filtered = incidents.filter((inc) => {
    if (filterHazard !== 'all' && inc.hazard_type !== filterHazard) return false;
    if (filterSeverity !== 'all' && inc.severity !== filterSeverity) return false;
    if (filterStatus === 'override' && !inc.risk_assessment?.hard_safety_rule_triggered) return false;
    if (filterStatus === 'duplicate' && inc.verification_status !== 'flagged_duplicate' && !inc.duplicate_of) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inc.incident_id.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        (inc.location.region || '').toLowerCase().includes(q) ||
        (inc.location.address || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans tactical-grid">
      <Header
        lang={lang}
        setLang={setLang}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
      />

      <main className="max-w-[1700px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1 pt-6">
        {/* Top Header & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-400 shadow-md">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                  <span>{lang === 'en' ? 'Disaster Incident Queue & Registry' : 'आपदा घटना कतार एवं रजिस्ट्री'}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    LIVE REPOSITORY
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  {lang === 'en'
                    ? 'Audit-verified multi-source emergency incident registry with deduplication clusters'
                    : 'सत्यापित बहु-स्रोत आपातकालीन घटना रजिस्ट्री एवं दोहरी रिपोर्ट समूहीकरण'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-950/50 transition-all active:scale-95"
            >
              <span>+</span>
              <span>{lang === 'en' ? 'Intake Report' : 'नई रिपोर्ट दर्ज करें'}</span>
            </button>

            <button
              onClick={loadIncidents}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Refresh' : 'रिफ्रेश'}</span>
            </button>
          </div>
        </div>

        {/* Tactical KPI Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Ingested
              </span>
              <span className="text-2xl font-black font-mono text-white mt-0.5 block">
                {totalCount}
              </span>
            </div>
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-red-950/40 border border-red-900/80 p-3.5 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block">
                Critical Severity
              </span>
              <span className="text-2xl font-black font-mono text-red-400 mt-0.5 block">
                {criticalCount}
              </span>
            </div>
            <Flame className="w-5 h-5 text-red-500 animate-pulse" />
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-amber-950/40 border border-amber-900/80 p-3.5 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Safety Overrides
              </span>
              <span className="text-2xl font-black font-mono text-amber-300 mt-0.5 block">
                {overrideCount}
              </span>
            </div>
            <ShieldAlert className="w-5 h-5 text-amber-400 animate-bounce" />
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-purple-950/40 border border-purple-900/80 p-3.5 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
                Duplicate Clusters
              </span>
              <span className="text-2xl font-black font-mono text-purple-300 mt-0.5 block">
                {duplicateCount}
              </span>
            </div>
            <Copy className="w-5 h-5 text-purple-400" />
          </div>
        </div>

        {/* Filter Controls & View Switcher */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col lg:flex-row gap-3 items-center justify-between shadow-xl backdrop-blur-md">
          {/* Search */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={lang === 'en' ? 'Search ID, region, or keywords...' : 'खोजें...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto text-xs">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />

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

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
            >
              <option value="all">{lang === 'en' ? 'All Status' : 'सभी स्थिति'}</option>
              <option value="override">Safety Override Only</option>
              <option value="duplicate">Duplicates Only</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 bg-slate-950 p-1 rounded-lg border border-slate-800 ml-auto lg:ml-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid Cards"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Data Table"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content: Grid View vs Table View */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                <Layers className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-semibold">No incidents found matching your query.</p>
                <p className="text-xs text-slate-500 mt-1">Try resetting the filters or trigger the scenario simulator.</p>
              </div>
            ) : (
              filtered.map((inc) => {
                const score = inc.risk_assessment?.composite_score ?? 50;
                const band = inc.risk_assessment?.severity_band || inc.severity.toUpperCase();
                const isOverride = inc.risk_assessment?.hard_safety_rule_triggered;
                const isDuplicate = inc.verification_status === 'flagged_duplicate' || !!inc.duplicate_of;

                let cardBorder = 'border-slate-800 hover:border-slate-700 bg-slate-900/80';
                let bandClass = 'bg-slate-800 text-slate-300 border-slate-700';

                if (band === 'CRITICAL' || isOverride) {
                  cardBorder = 'border-red-700/80 bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/30 shadow-red-950/30';
                  bandClass = 'bg-red-950 text-red-200 border-red-700 shadow-sm shadow-red-900/50';
                } else if (band === 'HIGH') {
                  cardBorder = 'border-orange-700/70 bg-slate-900/80';
                  bandClass = 'bg-orange-950 text-orange-200 border-orange-700';
                }

                return (
                  <div
                    key={inc.incident_id}
                    className={`border rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all hover:-translate-y-0.5 ${cardBorder}`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-amber-400 text-sm">
                            {inc.incident_id}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300 uppercase font-bold tracking-wider border border-slate-700">
                            {inc.hazard_type.replace('_', ' ')}
                          </span>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono border ${bandClass}`}>
                          {score.toFixed(0)} • {band}
                        </span>
                      </div>

                      {/* Source & Timestamp */}
                      <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
                        <span>via <strong className="text-slate-300">{inc.source}</strong></span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">
                          {new Date(inc.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Safety Override Alert */}
                      {isOverride && (
                        <div className="mb-2.5 p-2 rounded-lg bg-red-950/80 border border-red-700 text-red-200 text-[11px] flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 animate-bounce" />
                            <span className="font-extrabold uppercase tracking-wider text-red-300">
                              Safety Override Active
                            </span>
                          </div>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-900/90 text-red-100">
                            LIFE THREAT
                          </span>
                        </div>
                      )}

                      {/* Duplicate Cluster Badge */}
                      {isDuplicate && (
                        <div className="mb-2.5 p-1.5 rounded-lg bg-purple-950/70 border border-purple-800 text-purple-200 text-[11px] flex items-center gap-1.5">
                          <Copy className="w-3 h-3 text-purple-400 shrink-0" />
                          <span>
                            Clustered with Parent <strong className="text-white font-mono">{inc.duplicate_of || inc.incident_id}</strong>
                          </span>
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-xs text-slate-300 leading-relaxed mb-3">
                        {inc.description}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-800/80 text-xs flex flex-col gap-2">
                      <div className="flex items-center justify-between text-slate-400">
                        <div className="flex items-center gap-1 truncate max-w-[170px]">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate text-[11px]">{inc.location.region || inc.location.address}</span>
                        </div>

                        <span className="font-mono text-[10px] text-slate-500">
                          {inc.location.latitude.toFixed(3)}°N, {inc.location.longitude.toFixed(3)}°E
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          href={`/?incident=${inc.incident_id}`}
                          className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors border border-slate-700"
                        >
                          <ExternalLink className="w-3 h-3 text-cyan-400" />
                          <span>EOC Map View</span>
                        </Link>

                        <button
                          onClick={() => handleReanalyze(inc.incident_id)}
                          disabled={analyzingId === inc.incident_id}
                          className="px-3 py-1.5 rounded-lg bg-indigo-900/50 hover:bg-indigo-800 border border-indigo-700 text-indigo-200 font-semibold text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          <Sparkles className={`w-3 h-3 text-amber-400 ${analyzingId === inc.incident_id ? 'animate-spin' : ''}`} />
                          <span>{analyzingId === inc.incident_id ? 'Analyzing...' : 'Re-run AI'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Table View */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3.5">Incident ID</th>
                    <th className="p-3.5">Hazard Type</th>
                    <th className="p-3.5">Risk Score</th>
                    <th className="p-3.5">Severity</th>
                    <th className="p-3.5">Safety Override</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Reported</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.map((inc) => {
                    const score = inc.risk_assessment?.composite_score ?? 50;
                    const band = inc.risk_assessment?.severity_band || inc.severity.toUpperCase();
                    const isOverride = inc.risk_assessment?.hard_safety_rule_triggered;

                    return (
                      <tr key={inc.incident_id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-amber-400">
                          {inc.incident_id}
                        </td>
                        <td className="p-3.5 capitalize text-slate-200 font-semibold">
                          {inc.hazard_type.replace('_', ' ')}
                        </td>
                        <td className="p-3.5 font-mono font-black text-white">
                          {score.toFixed(0)} / 100
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            band === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' :
                            band === 'HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {band}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {isOverride ? (
                            <span className="text-red-400 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>YES</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono">NO</span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-300 truncate max-w-[200px]">
                          {inc.location.region || inc.location.address}
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">
                          {new Date(inc.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3.5 text-right">
                          <Link
                            href={`/?incident=${inc.incident_id}`}
                            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
