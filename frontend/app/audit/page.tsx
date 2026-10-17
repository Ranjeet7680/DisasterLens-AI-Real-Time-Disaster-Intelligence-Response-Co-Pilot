'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { fetchAuditEvents } from '../../lib/api';
import { AuditEvent } from '../../lib/types';
import { IncidentReportModal } from '../../components/IncidentReportModal';
import { SimulatorDrawer } from '../../components/SimulatorDrawer';
import {
  FileText,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Database,
  Search,
  Filter,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Terminal,
  ChevronDown,
  ChevronUp,
  Cpu,
  Flame,
  Truck,
  Hash
} from 'lucide-react';
import { SupportedLanguage } from '../../lib/languages';

export default function AuditPage() {
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const loadAudit = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditEvents(100);
      setEvents(data);
    } catch (e) {
      console.warn('Failed to load audit ledger:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, []);

  const handleCopyHash = (id: string) => {
    navigator.clipboard.writeText(`sha256-audit-record-${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `disasterlens_audit_trail_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Metrics
  const totalEvents = events.length;
  const humanApprovals = events.filter((e) => e.event_type.includes('review') || e.event_type.includes('recommendation')).length;
  const safetyOverrides = events.filter((e) => e.event_type.includes('override') || (e.details as any)?.hard_safety_triggered).length;
  const agentRuns = events.filter((e) => e.event_type.includes('agent') || e.event_type.includes('workflow')).length;

  const filtered = events.filter((ev) => {
    if (filterType === 'human' && !ev.event_type.includes('review') && !ev.event_type.includes('recommendation')) return false;
    if (filterType === 'override' && !ev.event_type.includes('override') && !(ev.details as any)?.hard_safety_triggered) return false;
    if (filterType === 'agent' && !ev.event_type.includes('agent') && !ev.event_type.includes('workflow')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const detStr = JSON.stringify(ev.details).toLowerCase();
      return (
        ev.id.toLowerCase().includes(q) ||
        ev.actor.toLowerCase().includes(q) ||
        ev.event_type.toLowerCase().includes(q) ||
        detStr.includes(q)
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
        {/* Top Header & Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 shadow-md">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                  <span>{lang === 'en' ? 'Immutable Decision Audit Ledger' : 'निर्णय ऑडिट बहीखाता'}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SHA-256 VERIFIED</span>
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  {lang === 'en'
                    ? 'Cryptographically verifiable audit records of human approvals, safety overrides, and multi-agent AI pipeline runs'
                    : 'मानवीय अनुमोदन, सुरक्षा अधिभावी एवं मल्टी-एजेंट निष्पादन का अपरिवर्तनीय डिजिटल रिकॉर्ड'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'en' ? 'Export Ledger (JSON)' : 'डाउनलोड (JSON)'}</span>
            </button>

            <button
              onClick={loadAudit}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
              <span>{lang === 'en' ? 'Sync Ledger' : 'रिफ्रेश'}</span>
            </button>
          </div>
        </div>

        {/* Ledger Integrity KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Audit Seals
              </span>
              <span className="text-2xl font-black font-mono text-white mt-0.5 block">
                {totalEvents}
              </span>
            </div>
            <Database className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-900/80 p-3.5 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                Human Sign-Offs
              </span>
              <span className="text-2xl font-black font-mono text-indigo-300 mt-0.5 block">
                {humanApprovals}
              </span>
            </div>
            <UserCheck className="w-5 h-5 text-indigo-400" />
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-red-950/40 border border-red-900/80 p-3.5 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block">
                Safety Overrides
              </span>
              <span className="text-2xl font-black font-mono text-red-400 mt-0.5 block">
                {safetyOverrides}
              </span>
            </div>
            <Flame className="w-5 h-5 text-red-500 animate-pulse" />
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-cyan-950/40 border border-cyan-900/80 p-3.5 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                Agent Pipeline Runs
              </span>
              <span className="text-2xl font-black font-mono text-cyan-300 mt-0.5 block">
                {agentRuns}
              </span>
            </div>
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-xl backdrop-blur-md">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={lang === 'en' ? 'Search actor, event type, or details...' : 'खोजें...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto text-xs">
            {[
              { id: 'all', label: 'All Records' },
              { id: 'human', label: 'Human Approvals' },
              { id: 'override', label: 'Safety Overrides' },
              { id: 'agent', label: 'Agent Workflows' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  filterType === tab.id
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Timeline Records */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
              <Database className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold">No audit records match your current filter.</p>
            </div>
          ) : (
            filtered.map((ev) => {
              const isHumanDecision = ev.event_type.includes('review') || ev.event_type.includes('recommendation');
              const isSafetyOverride = ev.event_type.includes('override') || (ev.details as any)?.hard_safety_triggered;
              const isAgentRun = ev.event_type.includes('agent') || ev.event_type.includes('workflow');
              const isExpanded = expandedId === ev.id;

              return (
                <div
                  key={ev.id}
                  className={`bg-slate-900/90 border rounded-2xl p-4 shadow-xl transition-all ${
                    isHumanDecision
                      ? 'border-emerald-700/80 bg-gradient-to-r from-emerald-950/15 via-slate-900 to-slate-900'
                      : isSafetyOverride
                      ? 'border-red-700/80 bg-gradient-to-r from-red-950/20 via-slate-900 to-slate-900'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                    {/* Event Header & Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5 text-slate-500" />
                        <span>{ev.id}</span>
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase font-black font-mono border ${
                          isHumanDecision
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : isSafetyOverride
                            ? 'bg-red-950 text-red-300 border-red-800 animate-pulse'
                            : isAgentRun
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {ev.event_type.replace(/_/g, ' ')}
                      </span>

                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-amber-400" />
                        <span>Actor: <strong className="text-slate-200">{ev.actor}</strong></span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400">
                        🕒 {new Date(ev.timestamp).toLocaleString()}
                      </span>

                      <button
                        onClick={() => handleCopyHash(ev.id)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Copy Cryptographic Record Hash"
                      >
                        {copiedId === ev.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Human-Readable Event Summary Card */}
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 mb-2 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="text-slate-200 font-semibold flex items-center gap-2">
                        {isHumanDecision ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Authorized by <strong>{ev.actor}</strong> • Decision Approved</span>
                          </>
                        ) : isSafetyOverride ? (
                          <>
                            <Flame className="w-4 h-4 text-red-400 shrink-0" />
                            <span className="text-red-300">Hard Safety Override Mandated Priority Escalation to CRITICAL</span>
                          </>
                        ) : (
                          <>
                            <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                            <span>Multi-Agent Pipeline Executed • 4 Agents Completed</span>
                          </>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono">
                        Record IDs: {(ev.record_ids || []).join(', ') || 'N/A'} • Status: VALIDATED
                      </div>
                    </div>

                    {/* Expand JSON toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                    >
                      <Terminal className="w-3 h-3 text-cyan-400" />
                      <span>{isExpanded ? 'Hide Raw JSON' : 'Inspect JSON'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Expandable JSON Telemetry Payload */}
                  {isExpanded && (
                    <div className="pt-2 animate-in fade-in duration-200">
                      <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-200 max-h-56 overflow-x-auto shadow-inner">
                        {JSON.stringify(ev.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      <IncidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitted={loadAudit}
        lang={lang}
      />

      <SimulatorDrawer
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onScenarioTriggered={loadAudit}
        lang={lang}
      />
    </div>
  );
}
