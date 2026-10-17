'use client';

import React, { useState } from 'react';
import { X, Sparkles, Play, ShieldAlert, CheckCircle, Copy, Flame, Waves } from 'lucide-react';
import { triggerScenario } from '../lib/api';
import { SupportedLanguage } from '../lib/languages';

interface SimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioTriggered: () => void;
  lang: SupportedLanguage;
}

export const SimulatorDrawer: React.FC<SimulatorDrawerProps> = ({
  isOpen,
  onClose,
  onScenarioTriggered,
  lang
}) => {
  const [triggeringKey, setTriggeringKey] = useState<string | null>(null);
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      key: 'flash_flood_subarnarekha',
      title: lang === 'en' ? 'Subarnarekha River Flash Inundation' : 'सुवर्णरेखा नदी आकस्मिक बाढ़',
      badge: lang === 'en' ? 'P0 Primary Flood' : 'प्राथमिक बाढ़',
      badgeColor: 'bg-red-950 text-red-300 border-red-800',
      description: lang === 'en' ? 'Telemetry station records +1.9m rise above danger mark. Over 60 low-lying residences inundated; families stranded.' : 'नदी का जलस्तर खतरे के निशान से 1.9 मीटर ऊपर।',
      icon: Waves
    },
    {
      key: 'duplicate_citizen_sos',
      title: lang === 'en' ? 'Harmu River Crossing (Duplicate Test)' : 'हरमू नदी (डुप्लिकेट रिपोर्ट परीक्षण)',
      badge: lang === 'en' ? 'Validation Agent Test' : 'सत्यापन परीक्षण',
      badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
      description: lang === 'en' ? 'Citizen reports water over bridge causeway within 2km of existing report. Tests Validation Agent spatial-temporal deduplication.' : 'मौजूदा घटना के निकट नागरिक रिपोर्ट। डुप्लिकेट पहचान परीक्षण।',
      icon: Copy
    },
    {
      key: 'dam_safety_override',
      title: lang === 'en' ? 'Dhurwa Dam Sluice Warning (Hard Safety Override)' : 'धुर्वा बांध आपातकालीन जल निकासी (सुरक्षा नियम)',
      badge: lang === 'en' ? 'Safety Rule Override' : 'सुरक्षा अधिभावी',
      badgeColor: 'bg-red-900 text-white border-red-600',
      description: lang === 'en' ? 'Reservoir at 99.4% full capacity. Tests the safety rule: credible life danger overrides composite formula to prevent alert suppression.' : 'आसन्न जान-माल के खतरे पर स्वचालित रूप से सर्वोच्च प्राथमिकता सक्रिय।',
      icon: Flame
    },
    {
      key: 'hospital_power_threat',
      title: lang === 'en' ? 'RIMS Medical Facility Auxiliary Substation Flooding' : 'रिम्स अस्पताल सबस्टेशन जलभराव',
      badge: lang === 'en' ? 'High Population Exposure' : 'उच्च जनसंख्या प्रभाव',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
      description: lang === 'en' ? 'Storm runoff threatening hospital ICU auxiliary generators. Tests high population exposure (E: 30%) weighting.' : 'अस्पताल के आईसीयू बैकअप जनरेटर पर पानी का खतरा।',
      icon: ShieldAlert
    }
  ];

  const handleTrigger = async (key: string) => {
    setTriggeringKey(key);
    try {
      await triggerScenario(key);
      setLastTriggered(key);
      onScenarioTriggered();
    } catch (err) {
      console.error('Failed to trigger scenario:', err);
    } finally {
      setTriggeringKey(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-950 border-l border-slate-800 w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-amber-500/50 shadow-lg shadow-amber-950/50 bg-slate-900 shrink-0">
                <img
                  src="/logo.png"
                  alt="Simulator Emblem"
                  className="w-full h-full object-cover scale-125"
                />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {lang === 'en' ? 'Disaster Scenario Simulator' : 'आपदा परिदृश्य सिमुलेटर'}
                </h2>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                  HACKATHON JUDGE MODE
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-400 leading-relaxed">
            {lang === 'en'
              ? 'Trigger calibrated disaster scenarios to evaluate the end-to-end multi-agent pipeline in real-time, including deduplication and safety rule escalation.'
              : 'सभी AI एजेंटों के वास्तविक समय के कार्यप्रवाह का परीक्षण करने के लिए परिदृश्य ट्रिगर करें।'}
          </p>

          {/* Scenario Cards */}
          <div className="mt-4 space-y-3">
            {scenarios.map((sc) => {
              const Icon = sc.icon;
              const isTriggering = triggeringKey === sc.key;
              const isDone = lastTriggered === sc.key;

              return (
                <div
                  key={sc.key}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-bold text-slate-100">{sc.title}</span>
                    </div>
                  </div>

                  <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] uppercase font-bold border mb-2 ${sc.badgeColor}`}>
                    {sc.badge}
                  </span>

                  <p className="text-slate-400 leading-snug mb-3">{sc.description}</p>

                  <button
                    onClick={() => handleTrigger(sc.key)}
                    disabled={isTriggering}
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isTriggering ? (
                      <span className="animate-spin text-amber-400">⏳</span>
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>
                      {isTriggering
                        ? (lang === 'en' ? 'Ingesting & Analyzing...' : 'विश्लेषण जारी...')
                        : (lang === 'en' ? 'Inject Scenario Live' : 'परिदृश्य इंजेक्ट करें')}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 mt-6">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
          >
            {lang === 'en' ? 'Close Simulator' : 'सिमुलेटर बंद करें'}
          </button>
        </div>
      </div>
    </div>
  );
};
