'use client';

import React from 'react';
import { RiskAssessment } from '../lib/types';
import { AlertTriangle, ShieldCheck, Info, CheckCircle2, Flame, Users, Landmark, Clock, Gauge, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { SupportedLanguage } from '../lib/languages';

interface RiskCardProps {
  assessment?: RiskAssessment | null;
  lang: SupportedLanguage;
}

export const RiskCard: React.FC<RiskCardProps> = ({ assessment, lang }) => {
  if (!assessment) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-slate-400">
        <Info className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm">
          {lang === 'en' ? 'Select an incident to view explainable risk score breakdown.' : 'विस्तृत जोखिम स्कोर विश्लेषण देखने के लिए किसी घटना का चयन करें।'}
        </p>
      </div>
    );
  }

  const score = Math.round(assessment.composite_score);
  const isOverride = assessment.hard_safety_rule_triggered;
  const band = assessment.severity_band;

  // Exact mathematical component contributions
  const hContrib = (assessment.hazard_score * 0.40).toFixed(1);
  const eContrib = (assessment.exposure_score * 0.30).toFixed(1);
  const vContrib = (assessment.vulnerability_score * 0.20).toFixed(1);
  const dContrib = (assessment.data_freshness_score * 0.10).toFixed(1);

  // SVG Circular Gauge calculations
  // Radius = 44, Circumference = 2 * PI * 44 ≈ 276.46
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let bandBg = 'bg-emerald-950/80 text-emerald-300 border-emerald-700';
  let gaugeGradientId = 'gaugeEmerald';
  let gaugeGlow = 'rgba(16, 185, 129, 0.4)';

  if (band === 'CRITICAL' || isOverride) {
    bandBg = 'bg-red-950/90 text-red-300 border-red-600 animate-pulse';
    gaugeGradientId = 'gaugeRed';
    gaugeGlow = 'rgba(239, 68, 68, 0.5)';
  } else if (band === 'HIGH') {
    bandBg = 'bg-orange-950/80 text-orange-300 border-orange-700';
    gaugeGradientId = 'gaugeOrange';
    gaugeGlow = 'rgba(249, 115, 22, 0.4)';
  } else if (band === 'MEDIUM') {
    bandBg = 'bg-amber-950/80 text-amber-300 border-amber-700';
    gaugeGradientId = 'gaugeAmber';
    gaugeGlow = 'rgba(245, 158, 11, 0.4)';
  }

  return (
    <div
      className={`bg-slate-900 border rounded-xl p-5 shadow-2xl transition-all relative overflow-hidden ${
        isOverride
          ? 'border-red-600/90 shadow-red-950/50'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Subtle background glow */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none blur-3xl opacity-20"
        style={{ background: isOverride ? '#ef4444' : '#3b82f6' }}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-800 text-indigo-400">
              <Gauge className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{lang === 'en' ? 'Risk Intelligence & Scoring' : 'जोखिम विश्लेषण एवं स्कोर'}</span>
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                {assessment.model_version} • <span className="text-cyan-400">{assessment.calculation_formula}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${bandBg}`}>
            {band} {lang === 'en' ? 'PRIORITY' : 'प्राथमिकता'}
          </div>
        </div>
      </div>

      {/* Safety Override Alert Banner */}
      {isOverride && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-600 text-red-200 text-xs flex items-start gap-2.5 relative z-10 shadow-lg shadow-red-950/60">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-extrabold uppercase tracking-wider text-red-300">
                {lang === 'en' ? 'SAFETY OVERRIDE ACTIVATED' : 'सुरक्षा प्राथमिकता नियम सक्रिय'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-900/60 text-red-200 border border-red-700">
                HARD CONSTRAINT RULE
              </span>
            </div>
            <p className="mt-1 text-red-100 text-[11px] leading-relaxed">
              {assessment.safety_override_reason ||
                (lang === 'en'
                  ? 'Imminent life-safety hazard mandates priority escalation over sparse data completeness.'
                  : 'आसन्न जान-माल के खतरे के कारण प्राथमिकता स्वचालित रूप से बढ़ाई गई है।')}
            </p>
          </div>
        </div>
      )}

      {/* Main Score Display & Explainable Formula Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-5 relative z-10">
        {/* Futuristic SVG Radial Circular Dial */}
        <div className="md:col-span-4 bg-slate-950/90 rounded-xl p-4 border border-slate-800/90 flex flex-col items-center justify-center text-center shadow-inner relative group">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="gaugeRed" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
                <linearGradient id="gaugeOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="gaugeAmber" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="gaugeEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Background Circular Track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#1e293b"
                strokeWidth="8"
                fill="transparent"
              />

              {/* Foreground Animated Value Arc */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke={`url(#${gaugeGradientId})`}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: 'stroke-dashoffset 1s ease-in-out',
                  filter: `drop-shadow(0 0 6px ${gaugeGlow})`
                }}
              />
            </svg>

            {/* Inner Center Score Readout */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white tracking-tight leading-none drop-shadow">
                {score}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">
                / 100
              </span>
            </div>
          </div>

          <div className="mt-2 text-center">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              {lang === 'en' ? 'Composite Risk Index' : 'समग्र जोखिम सूचकांक'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Deterministic weighted sum
            </div>
          </div>
        </div>

        {/* 4 Factor Component Breakdown with Math Formula Indicators */}
        <div className="md:col-span-8 flex flex-col justify-between gap-2 text-xs">
          {/* H: Hazard Severity 40% */}
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-slate-200">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                <span>{lang === 'en' ? 'Hazard Intensity (H)' : 'आपदा तीव्रता (H)'}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950/80 text-red-300 border border-red-800">
                  40% WT
                </span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">
                  0.40 × {assessment.hazard_score.toFixed(0)} = <span className="text-red-400 font-bold">+{hContrib}</span>
                </span>
                <span className="font-mono text-white font-bold">{assessment.hazard_score.toFixed(0)}/100</span>
              </div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-600 to-orange-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, assessment.hazard_score)}%` }}
              />
            </div>
          </div>

          {/* E: Population Exposure 30% */}
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-slate-200">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'en' ? 'Population Exposure (E)' : 'जनसंख्या प्रभाव (E)'}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                  30% WT
                </span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">
                  0.30 × {assessment.exposure_score.toFixed(0)} = <span className="text-amber-400 font-bold">+{eContrib}</span>
                </span>
                <span className="font-mono text-white font-bold">{assessment.exposure_score.toFixed(0)}/100</span>
              </div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-600 to-yellow-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, assessment.exposure_score)}%` }}
              />
            </div>
          </div>

          {/* V: Vulnerability 20% */}
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-slate-200">
                <Landmark className="w-3.5 h-3.5 text-blue-400" />
                <span>{lang === 'en' ? 'Vulnerability (V)' : 'संवेदनशीलता (V)'}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950/80 text-blue-300 border border-blue-800">
                  20% WT
                </span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">
                  0.20 × {assessment.vulnerability_score.toFixed(0)} = <span className="text-blue-400 font-bold">+{vContrib}</span>
                </span>
                <span className="font-mono text-white font-bold">{assessment.vulnerability_score.toFixed(0)}/100</span>
              </div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, assessment.vulnerability_score)}%` }}
              />
            </div>
          </div>

          {/* D: Data Reliability & Freshness 10% */}
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-slate-200">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'en' ? 'Freshness & Quality (D)' : 'डेटा विश्वसनीयता (D)'}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  10% WT
                </span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">
                  0.10 × {assessment.data_freshness_score.toFixed(0)} = <span className="text-emerald-400 font-bold">+{dContrib}</span>
                </span>
                <span className="font-mono text-white font-bold">{assessment.data_freshness_score.toFixed(0)}/100</span>
              </div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, assessment.data_freshness_score)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Auditable Contributing Factors List */}
      <div className="relative z-10 pt-1">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'en' ? 'Auditable Factor Breakdown:' : 'ऑडिट योग्य कारक विवरण:'}</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {assessment.contributing_factors.length} verified factors
          </span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
          {assessment.contributing_factors.map((factor, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 bg-slate-950/60 hover:bg-slate-950 px-2.5 py-2 rounded-lg border border-slate-800/80 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
              <span className="text-slate-200 leading-snug">{factor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
