'use client';

import React, { useState } from 'react';
import { Alert } from '../lib/types';
import { Bell, AlertOctagon, Check, CheckCheck, ShieldAlert } from 'lucide-react';
import { acknowledgeAlert, resolveAlert } from '../lib/api';

interface AlertPanelProps {
  alerts: Alert[];
  onRefresh: () => void;
  lang: 'en' | 'hi';
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-950 text-red-400 border border-red-800">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{lang === 'en' ? 'Active Alerts' : 'सक्रिय चेतावनियां'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-red-900/60 text-red-300 font-mono">
                {alerts.filter((a) => a.state === 'active').length}
              </span>
            </h3>
          </div>
        </div>

        {/* Filter */}
        <div className="flex rounded-md bg-slate-950 p-0.5 border border-slate-800 text-[11px]">
          <button
            onClick={() => setFilterState('active')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filterState === 'active' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
            }`}
          >
            {lang === 'en' ? 'Active' : 'सक्रिय'}
          </button>
          <button
            onClick={() => setFilterState('all')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filterState === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
            }`}
          >
            {lang === 'en' ? 'All' : 'सभी'}
          </button>
        </div>
      </div>

      {/* Alert Feed */}
      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
        {displayedAlerts.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
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
                className={`p-3 rounded-lg border text-xs transition-all ${
                  isCritical
                    ? 'bg-red-950/40 border-red-800/80'
                    : 'bg-amber-950/30 border-amber-800/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <ShieldAlert className={`w-3.5 h-3.5 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
                    <span>{alt.title}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                    isCritical ? 'bg-red-900/80 text-red-200' : 'bg-amber-900/80 text-amber-200'
                  }`}>
                    {alt.severity}
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed mb-2.5">{alt.message}</p>

                {/* Footer with actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400 font-mono">
                    {new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {alt.state === 'active' && (
                      <button
                        onClick={() => handleAck(alt.id)}
                        disabled={loadingId === alt.id}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-amber-400" />
                        <span>{lang === 'en' ? 'Acknowledge' : 'स्वीकार करें'}</span>
                      </button>
                    )}

                    {alt.state !== 'resolved' && (
                      <button
                        onClick={() => handleResolve(alt.id)}
                        disabled={loadingId === alt.id}
                        className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[10px] font-semibold transition-colors flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3 text-emerald-400" />
                        <span>{lang === 'en' ? 'Resolve' : 'समाधान'}</span>
                      </button>
                    )}

                    {isResolved && (
                      <span className="text-emerald-400 font-mono text-[10px]">
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
