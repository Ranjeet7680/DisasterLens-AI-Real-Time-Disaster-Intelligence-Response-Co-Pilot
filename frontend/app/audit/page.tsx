'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { fetchAuditEvents } from '../../lib/api';
import { AuditEvent } from '../../lib/types';
import { IncidentReportModal } from '../../components/IncidentReportModal';
import { SimulatorDrawer } from '../../components/SimulatorDrawer';
import { FileText, ShieldCheck, UserCheck, RefreshCw, AlertCircle, Database } from 'lucide-react';

import { SupportedLanguage } from '../../lib/languages';

export default function AuditPage() {
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const loadAudit = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditEvents(50);
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, []);

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
              <Database className="w-5 h-5 text-emerald-400" />
              <span>{lang === 'en' ? 'Immutable Decision Audit Log' : 'निर्णय ऑडिट लॉग'}</span>
            </h1>
            <p className="text-xs text-slate-400">
              {lang === 'en' ? 'Verifiable audit records of human approvals, safety overrides and agent executions' : 'मानवीय अनुमोदन एवं सुरक्षा अधिभावी का अपरिवर्तनीय रिकॉर्ड'}
            </p>
          </div>

          <button
            onClick={loadAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 self-start sm:self-auto transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{lang === 'en' ? 'Refresh Audit' : 'रिफ्रेश'}</span>
          </button>
        </div>

        {/* Audit Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs font-bold text-slate-300">
            <span>{lang === 'en' ? 'Event Timeline & Actor Verification' : 'घटना क्रम एवं सत्यापन'}</span>
            <span className="font-mono text-slate-500">{events.length} {lang === 'en' ? 'Recorded Entries' : 'प्रविष्टियाँ'}</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {events.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                {lang === 'en' ? 'No audit entries recorded yet.' : 'कोई ऑडिट प्रविष्टि नहीं मिली।'}
              </div>
            ) : (
              events.map((ev) => {
                const isHumanDecision = ev.event_type.startsWith('recommendation_');
                const isSafetyOverride = ev.event_type === 'safety_override_triggered';

                return (
                  <div key={ev.id} className="p-4 hover:bg-slate-800/30 transition-colors text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-slate-400 font-bold">{ev.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                          isHumanDecision
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : isSafetyOverride
                            ? 'bg-red-950 text-red-300 border-red-800'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {ev.event_type.replace('_', ' ')}
                        </span>
                      </div>

                      <span className="font-mono text-slate-500 text-[11px]">
                        {new Date(ev.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2 text-slate-300">
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        Actor: <strong className="text-white">{ev.actor}</strong>
                      </span>
                    </div>

                    {/* Details Box */}
                    <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                      {JSON.stringify(ev.details, null, 2)}
                    </pre>
                  </div>
                );
              })
            )}
          </div>
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
