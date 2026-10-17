'use client';

import React from 'react';
import { Alert } from '../lib/types';
import { ShieldAlert, AlertTriangle, Radio } from 'lucide-react';

interface AlertTickerProps {
  alerts: Alert[];
  lang: 'en' | 'hi';
  onSelectAlert?: (alert: Alert) => void;
}

export const AlertTicker: React.FC<AlertTickerProps> = ({ alerts, lang, onSelectAlert }) => {
  const activeAlerts = alerts.filter((a) => a.state === 'active');
  if (activeAlerts.length === 0) return null;

  return (
    <div className="bg-red-950/80 border-b border-red-800 text-red-200 text-xs py-1.5 px-4 overflow-hidden shadow-lg flex items-center relative z-40 backdrop-blur-md">
      <div className="flex items-center gap-2 pr-4 bg-red-950 shrink-0 font-bold uppercase tracking-wider text-[11px] text-red-300 z-10 border-r border-red-800/80">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
        <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
        <span>{lang === 'en' ? 'ACTIVE EMERGENCY BULLETIN:' : 'आपातकालीन बुलेटिन:'}</span>
      </div>

      <div className="overflow-hidden whitespace-nowrap flex-1 relative">
        <div className="animate-marquee flex items-center gap-12 font-mono text-xs">
          {activeAlerts.map((alt) => (
            <div
              key={alt.id}
              onClick={() => onSelectAlert && onSelectAlert(alt)}
              className="inline-flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
            >
              <span className="px-1.5 py-0.2 rounded bg-red-900 text-white font-bold text-[10px] uppercase">
                {alt.severity}
              </span>
              <strong className="text-red-100">{alt.title}</strong>
              <span className="text-red-300/80">— {alt.message}</span>
              <span className="text-red-400/60">
                [{new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
