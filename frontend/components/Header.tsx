'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, Radio, Activity, MapPin, Database, Sparkles, PlusCircle } from 'lucide-react';

interface HeaderProps {
  lang: 'en' | 'hi';
  setLang: (lang: 'en' | 'hi') => void;
  onOpenReportModal: () => void;
  onOpenSimulator: () => void;
  activeAlertCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  onOpenReportModal,
  onOpenSimulator,
  activeAlertCount = 0
}) => {
  const pathname = usePathname();

  const navItems = [
    { name: lang === 'en' ? 'Command Dashboard' : 'कमांड डैशबोर्ड', href: '/' },
    { name: lang === 'en' ? 'Incidents Queue' : 'घटना सूची', href: '/incidents' },
    { name: lang === 'en' ? 'Response Resources' : 'प्रतिक्रिया संसाधन', href: '/resources' },
    { name: lang === 'en' ? 'Audit Trail' : 'ऑडिट लॉग', href: '/audit' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-600 to-amber-600 text-white shadow-lg shadow-red-950/50 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-red-400 via-amber-300 to-orange-400 bg-clip-text text-transparent">
                    DisasterLens AI
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800">
                    EOC COPILOT
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  {lang === 'en' ? 'Real-Time Disaster Intelligence Platform' : 'वास्तविक समय आपदा खुफिया मंच'}
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-amber-400 border border-slate-700'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions & Language Switcher */}
          <div className="flex items-center gap-3">
            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden lg:inline">{lang === 'en' ? 'LIVE WS' : 'लाइव'}</span>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-medium">
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded transition-colors ${
                  lang === 'en' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-2 py-1 rounded transition-colors ${
                  lang === 'hi' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                हिंदी
              </button>
            </div>

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
              <span>{lang === 'en' ? 'Demo Simulator' : 'सिमुलेटर'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
