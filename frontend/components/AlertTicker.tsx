'use client';

import React from 'react';
import { Alert } from '../lib/types';
import { ShieldAlert, AlertTriangle, Flame } from 'lucide-react';
import { SupportedLanguage } from '../lib/languages';

interface AlertTickerProps {
  alerts: Alert[];
  lang: SupportedLanguage;
  onSelectAlert?: (alert: Alert) => void;
}

export const AlertTicker: React.FC<AlertTickerProps> = ({ alerts, lang, onSelectAlert }) => {
  const activeAlerts = alerts.filter((a) => a.state === 'active');
  if (activeAlerts.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-red-950/95 via-rose-950/90 to-red-950/95 border-b border-red-800 text-red-200 text-xs py-2 px-4 overflow-hidden shadow-2xl flex items-center relative z-40 backdrop-blur-md">
      {/* Fixed Emergency Badge */}
      <div className="flex items-center gap-2 pr-4 bg-red-950/90 shrink-0 font-extrabold uppercase tracking-wider text-[11px] text-red-300 z-10 border-r border-red-800/80">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
        <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
        <span className="whitespace-nowrap">
          {lang === 'en' ? 'ACTIVE EMERGENCY BULLETIN:' : 'आपातकालीन बुलेटिन:'}
        </span>
        <span className="px-1.5 py-0.2 rounded-full bg-red-900 text-red-100 font-mono text-[10px]">
          {activeAlerts.length}
        </span>
      </div>

      {/* Marquee with Gradient Fade Mask */}
      <div className="overflow-hidden whitespace-nowrap flex-1 relative pl-6 ticker-mask">
        <div className="animate-marquee flex items-center gap-16 font-mono text-xs">
          {activeAlerts.concat(activeAlerts).map((alt, idx) => (
            <div
              key={`${alt.id}-${idx}`}
              onClick={() => onSelectAlert && onSelectAlert(alt)}
              className="inline-flex items-center gap-2.5 cursor-pointer hover:text-white transition-all group"
            >
              <span className="px-2 py-0.5 rounded bg-red-900 text-white font-extrabold text-[10px] uppercase shadow-sm group-hover:bg-red-800 transition-colors">
                {alt.severity}
              </span>
              <strong className="text-red-100 font-bold group-hover:underline">{alt.title}</strong>
              <span className="text-red-300/90">— {alt.message}</span>
              <span className="text-red-400/70 font-mono text-[11px]">
                [{new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]
              </span>
              <span className="text-red-700/80 font-mono">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
