'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, Radio, Activity, Volume2, VolumeX, Sparkles, PlusCircle, FileText } from 'lucide-react';
import { toggleAudio, getAudioState } from '../lib/sound';
import { SupportedLanguage, LANGUAGES } from '../lib/languages';

interface HeaderProps {
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
  onOpenReportModal: () => void;
  onOpenSimulator: () => void;
  onOpenExport?: () => void;
  activeAlertCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  onOpenReportModal,
  onOpenSimulator,
  onOpenExport,
  activeAlertCount = 0
}) => {
  const pathname = usePathname();
  const [soundOn, setSoundOn] = useState(true);

  const handleToggleSound = () => {
    const newState = toggleAudio();
    setSoundOn(newState);
  };

  const navItems = [
    { name: lang === 'en' ? 'Command Dashboard' : 'कमांड डैशबोर्ड', href: '/' },
    { name: lang === 'en' ? 'Incidents Queue' : 'घटना सूची', href: '/incidents' },
    { name: lang === 'en' ? 'Response Resources' : 'प्रतिक्रिया संसाधन', href: '/resources' },
    { name: lang === 'en' ? 'Evacuation GIS' : 'निकासी गलियारे', href: '/evacuation' },
    { name: lang === 'en' ? 'Predictive Analytics' : 'पूर्वानुमान एवं विश्लेषण', href: '/analytics' },
    { name: lang === 'en' ? 'Audit Trail' : 'ऑडिट लॉग', href: '/audit' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-2xl">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-3 group whitespace-nowrap">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-cyan-500/50 shadow-lg shadow-cyan-950/60 group-hover:scale-105 group-hover:border-cyan-400 transition-all bg-slate-900 shrink-0">
                <img
                  src="/logo.png"
                  alt="DisasterLens AI Emblem"
                  className="w-full h-full object-cover scale-125 group-hover:rotate-3 transition-transform"
                />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-slate-950" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg tracking-tight bg-gradient-to-r from-red-400 via-amber-300 to-orange-400 bg-clip-text text-transparent">
                    DisasterLens AI
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/90 text-red-300 border border-red-800 font-bold uppercase tracking-wider">
                    EOC COPILOT
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden xl:block font-medium">
                  {lang === 'en' ? 'Real-Time Disaster Intelligence & Response Platform' : 'वास्तविक समय आपदा खुफिया एवं प्रतिक्रिया मंच'}
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Tactical Alert Sound Toggle */}
            <button
              onClick={handleToggleSound}
              title={soundOn ? 'Tactical Audio Alerts: ON' : 'Tactical Audio Alerts: OFF'}
              className={`p-1.5 rounded-lg border transition-colors ${
                soundOn
                  ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Live Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{lang === 'en' ? 'LIVE WS' : 'लाइव'}</span>
            </div>

            {/* Indian Languages Selector */}
            <div className="flex items-center rounded-lg bg-slate-900 border border-slate-700 p-0.5 text-xs font-medium">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as SupportedLanguage)}
                className="bg-transparent text-amber-300 font-bold px-2 py-1 focus:outline-none cursor-pointer text-xs"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Export SitRep button */}
            {onOpenExport && (
              <button
                onClick={onOpenExport}
                title="Export Official Situation Report"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>SitRep</span>
              </button>
            )}

            {/* Quick Report Button */}
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'en' ? 'New Report' : 'नयी रिपोर्ट'}</span>
            </button>

            {/* Simulator Trigger Button */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Simulator' : 'सिमुलेटर'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
