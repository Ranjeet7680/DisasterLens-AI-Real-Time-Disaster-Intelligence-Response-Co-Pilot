'use client';

import React, { useState } from 'react';
import { Alert } from '../lib/types';
import { Bell, AlertOctagon, Check, CheckCheck, ShieldAlert } from 'lucide-react';
import { acknowledgeAlert, resolveAlert } from '../lib/api';
import { SupportedLanguage, getTranslation } from '../lib/languages';

interface AlertPanelProps {
  alerts: Alert[];
  onRefresh: () => void;
  lang: SupportedLanguage;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ alerts, onRefresh, lang }) => {
  const [filterState, setFilterState] = useState<'active' | 'all'>('active');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const displayedAlerts = alerts.filter((a) => (filterState === 'active' ? a.state === 'active' : true));

  const handleAck = async (id: string) => {
    setLoadingId(id);
    try {
      await acknowledgeAlert(id, 'Duty Officer');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleResolve = async (id: string) => {
    setLoadingId(id);
    try {
      await resolveAlert(id, 'Duty Officer');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-950/80 text-red-400 border border-red-800/80 shadow-md">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>{lang === 'en' ? 'Active Alerts & Bulletins' : 'सक्रिय चेतावनियां'}</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-red-900/80 text-red-100 font-mono font-bold">
                {alerts.filter((a) => a.state === 'active').length}
              </span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Real-Time Emergency Feeds
            </span>
          </div>
        </div>

        {/* Filter */}
        <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-[11px]">
          <button
            onClick={() => setFilterState('active')}
            className={`px-2.5 py-0.5 rounded-md transition-all font-semibold ${
              filterState === 'active' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'en' ? 'Active' : 'सक्रिय'}
          </button>
          <button
            onClick={() => setFilterState('all')}
            className={`px-2.5 py-0.5 rounded-md transition-all font-semibold ${
              filterState === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'en' ? 'All' : 'सभी'}
          </button>
        </div>
      </div>

      {/* Alert Feed */}
      <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
        {displayedAlerts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            {lang === 'en' ? 'No active alerts in queue.' : 'वर्तमान में कोई सक्रिय चेतावनी नहीं है।'}
          </div>
        ) : (
          displayedAlerts.map((alt) => {
            const isCritical = alt.severity === 'critical';
            const isAck = alt.state === 'acknowledged';
            const isResolved = alt.state === 'resolved';

            return (
              <div
                key={alt.id}
                className={`p-3.5 rounded-xl border text-xs transition-all ${
                  isCritical
                    ? 'bg-gradient-to-r from-red-950/40 to-slate-900 border-red-800/80 border-l-4 border-l-red-500 shadow-md shadow-red-950/30'
                    : 'bg-gradient-to-r from-amber-950/30 to-slate-900 border-amber-800/60 border-l-4 border-l-amber-500'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 font-black text-white">
                    <ShieldAlert className={`w-4 h-4 shrink-0 ${isCritical ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
                    <span className="leading-snug">{alt.title}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-black font-mono shrink-0 ${
                    isCritical ? 'bg-red-900 text-red-100 border border-red-700' : 'bg-amber-900 text-amber-100 border border-amber-700'
                  }`}>
                    {alt.severity}
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed mb-3">{alt.message}</p>

                {/* Footer with actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400 font-mono text-[10px]">
                    🕒 {new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <div className="flex items-center gap-2">
                    {alt.state === 'active' && (
                      <button
                        onClick={() => handleAck(alt.id)}
                        disabled={loadingId === alt.id}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-all flex items-center gap-1 border border-slate-700 hover:border-amber-500/50"
                      >
                        <Check className="w-3 h-3 text-amber-400" />
                        <span>{lang === 'en' ? 'Acknowledge' : 'स्वीकार करें'}</span>
                      </button>
                    )}

                    {alt.state !== 'resolved' && (
                      <button
                        onClick={() => handleResolve(alt.id)}
                        disabled={loadingId === alt.id}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm"
                      >
                        <CheckCheck className="w-3 h-3 text-emerald-400" />
                        <span>{lang === 'en' ? 'Resolve' : 'समाधान'}</span>
                      </button>
                    )}

                    {isResolved && (
                      <span className="text-emerald-400 font-mono text-[10px] font-bold">
                        ✓ {lang === 'en' ? 'Resolved' : 'समाधानित'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
