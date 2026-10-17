'use client';

import React, { useState } from 'react';
import { Incident } from '../lib/types';
import { Layers, MapPin, AlertTriangle, Copy, ArrowUpDown, ChevronRight, Compass } from 'lucide-react';
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Table Header with Sort & Live Count */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/80">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'en' ? 'Prioritized Incident Queue' : 'प्राथमिकता आधारित घटना कतार'}
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Deterministic Severity Ranking
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setSortBy(sortBy === 'risk' ? 'time' : 'risk')}
            className="flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500/50 transition-all font-semibold"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>{sortBy === 'risk' ? (lang === 'en' ? 'By Risk' : 'जोखिम अनुसार') : (lang === 'en' ? 'By Time' : 'समय अनुसार')}</span>
          </button>
          <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-full">
            {incidents.length}
          </span>
        </div>
      </div>

      {/* Incident List */}
      <div className="overflow-y-auto flex-1 min-h-0 p-2.5 space-y-2.5 scroll-pt-2">
        {sortedIncidents.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-xs">
            {lang === 'en' ? 'No incidents reported. Use simulator or submit a new report.' : 'कोई घटना दर्ज नहीं है। सिमुलेटर का प्रयोग करें।'}
          </div>
        ) : (
          sortedIncidents.map((inc) => {
            const isSelected = selectedIncident?.incident_id === inc.incident_id;
            const score = inc.risk_assessment?.composite_score ?? 50;
            const band = inc.risk_assessment?.severity_band || inc.severity.toUpperCase();
            const isOverride = inc.risk_assessment?.hard_safety_rule_triggered;
            const isDuplicate = inc.verification_status === 'flagged_duplicate' || !!inc.duplicate_of;

            let badgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
            let barColor = 'bg-emerald-500';
            if (band === 'CRITICAL' || isOverride) {
              badgeClass = 'bg-red-950/80 text-red-200 border-red-700 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
              barColor = 'bg-red-500';
            } else if (band === 'HIGH') {
              badgeClass = 'bg-orange-950/80 text-orange-200 border-orange-700';
              barColor = 'bg-orange-500';
            } else if (band === 'MEDIUM') {
              badgeClass = 'bg-amber-950/80 text-amber-200 border-amber-700';
              barColor = 'bg-amber-500';
            }

            return (
              <div
                key={inc.incident_id}
                onClick={() => onSelectIncident(inc)}
                className={`p-3.5 rounded-xl cursor-pointer transition-all text-xs border ${
                  isSelected
                    ? 'bg-slate-800/90 border-blue-500 shadow-lg shadow-blue-950/40 ring-1 ring-blue-500/50'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-black text-slate-100">{inc.incident_id}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300 uppercase font-bold tracking-wider border border-slate-700">
                      {inc.hazard_type.replace('_', ' ')}
                    </span>
                    {isOverride && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-900/90 text-red-100 text-[10px] font-black border border-red-600 animate-pulse">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>OVERRIDE</span>
                      </span>
                    )}
                    {isDuplicate && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-950 text-purple-200 text-[10px] font-bold border border-purple-800">
                        <Copy className="w-2.5 h-2.5" />
                        <span>DUP MERGED</span>
                      </span>
                    )}
                  </div>

                  {/* Priority / Score Pill */}
                  <div className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase font-mono border ${badgeClass} shrink-0`}>
                    {score.toFixed(0)} • {band}
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-300 line-clamp-2 leading-relaxed mb-2 font-normal">
                  {inc.description}
                </p>

                {/* Footer: location & time & action */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                  <span className="flex items-center gap-1 truncate max-w-[220px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{inc.location.region || inc.location.address || 'Reported Sector'}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 text-[10px]">
                      {new Date(inc.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-blue-400 translate-x-0.5' : 'text-slate-600'}`} />
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
