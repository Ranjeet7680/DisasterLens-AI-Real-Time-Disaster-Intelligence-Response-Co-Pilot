'use client';

import React, { useState } from 'react';
import { Incident } from '../lib/types';
import { AlertCircle, AlertTriangle, Layers, MapPin, ShieldCheck, ChevronRight, Copy, ArrowUpDown } from 'lucide-react';
import { SupportedLanguage } from '../lib/languages';

interface IncidentTableProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  lang: SupportedLanguage;
}

export const IncidentTable: React.FC<IncidentTableProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  lang
}) => {
  const [sortBy, setSortBy] = useState<'risk' | 'time'>('risk');

  const sortedIncidents = [...incidents].sort((a, b) => {
    if (sortBy === 'risk') {
      const scoreA = a.risk_assessment?.composite_score ?? (a.severity === 'critical' ? 90 : 50);
      const scoreB = b.risk_assessment?.composite_score ?? (b.severity === 'critical' ? 90 : 50);
      return scoreB - scoreA;
    }
    return new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime();
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Table Header with Sort */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white">
            {lang === 'en' ? 'Prioritized Incident Queue' : 'प्राथमिकता आधारित घटना कतार'}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setSortBy(sortBy === 'risk' ? 'time' : 'risk')}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-950 border border-slate-800"
          >
            <ArrowUpDown className="w-3 h-3 text-amber-400" />
            <span>{sortBy === 'risk' ? (lang === 'en' ? 'By Risk' : 'जोखिम अनुसार') : (lang === 'en' ? 'By Time' : 'समय अनुसार')}</span>
          </button>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded-full">
            {incidents.length}
          </span>
        </div>
      </div>

      {/* Incident List */}
      <div className="divide-y divide-slate-800/80 overflow-y-auto max-h-[500px]">
        {sortedIncidents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            {lang === 'en' ? 'No incidents reported. Use simulator or submit a new report.' : 'कोई घटना दर्ज नहीं है।'}
          </div>
        ) : (
          sortedIncidents.map((inc) => {
            const isSelected = selectedIncident?.incident_id === inc.incident_id;
            const score = inc.risk_assessment?.composite_score ?? 50;
            const band = inc.risk_assessment?.severity_band || inc.severity.toUpperCase();
            const isOverride = inc.risk_assessment?.hard_safety_rule_triggered;
            const isDuplicate = inc.verification_status === 'flagged_duplicate' || !!inc.duplicate_of;

            let badgeClass = 'bg-emerald-950 text-emerald-300 border-emerald-800';
            if (band === 'CRITICAL' || isOverride) badgeClass = 'bg-red-950 text-red-300 border-red-800';
            else if (band === 'HIGH') badgeClass = 'bg-orange-950 text-orange-300 border-orange-800';
            else if (band === 'MEDIUM') badgeClass = 'bg-amber-950 text-amber-300 border-amber-800';

            return (
              <div
                key={inc.incident_id}
                onClick={() => onSelectIncident(inc)}
                className={`p-3 cursor-pointer transition-all text-xs ${
                  isSelected
                    ? 'bg-slate-800/95 border-l-4 border-amber-500 shadow-md'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-slate-200">{inc.incident_id}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300 uppercase font-semibold">
                      {inc.hazard_type.replace('_', ' ')}
                    </span>
                    {isOverride && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-red-900/80 text-red-200 text-[10px] font-bold border border-red-700 animate-pulse">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>OVERRIDE</span>
                      </span>
                    )}
                    {isDuplicate && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 text-[10px] font-bold border border-purple-800">
                        <Copy className="w-2.5 h-2.5" />
                        <span>DUP</span>
                      </span>
                    )}
                  </div>

                  {/* Priority / Score Pill */}
                  <div className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${badgeClass}`}>
                    {score.toFixed(0)} • {band}
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-300 line-clamp-2 leading-snug mb-1.5 font-normal">
                  {inc.description}
                </p>

                {/* Footer: location & time */}
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 truncate max-w-[200px]">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{inc.location.region || inc.location.address || 'Reported Sector'}</span>
                  </span>
                  <span className="font-mono text-slate-500">
                    {new Date(inc.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
