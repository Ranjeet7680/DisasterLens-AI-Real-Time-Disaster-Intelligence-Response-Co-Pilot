'use client';

import React from 'react';
import { RiskAssessment } from '../lib/types';
import { AlertTriangle, ShieldCheck, Info, CheckCircle2, Flame, Users, Landmark, Clock } from 'lucide-react';

interface RiskCardProps {
  assessment?: RiskAssessment | null;
  lang: 'en' | 'hi';
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

  let bandBg = 'bg-emerald-950 text-emerald-300 border-emerald-800';
  if (band === 'CRITICAL' || isOverride) bandBg = 'bg-red-950 text-red-300 border-red-800';
  else if (band === 'HIGH') bandBg = 'bg-orange-950 text-orange-300 border-orange-800';
  else if (band === 'MEDIUM') bandBg = 'bg-amber-950 text-amber-300 border-amber-800';

  return (
    <div className={`bg-slate-900 border rounded-xl p-5 shadow-xl transition-all ${
      isOverride ? 'border-red-600/80 shadow-red-950/40 shadow-2xl' : 'border-slate-800'
    }`}>
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>{lang === 'en' ? 'Risk Intelligence & Scoring' : 'जोखिम विश्लेषण एवं स्कोर'}</span>
          </h3>
          <p className="text-xs text-slate-400">
            {assessment.model_version} • {assessment.calculation_formula}
          </p>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase border ${bandBg}`}>
          {band} {lang === 'en' ? 'PRIORITY' : 'प्राथमिकता'}
        </div>
      </div>

      {/* Safety Override Alert Banner */}
      {isOverride && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/70 border border-red-700/80 text-red-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wider text-red-300 block">
              {lang === 'en' ? 'SAFETY OVERRIDE ACTIVATED' : 'सुरक्षा प्राथमिकता नियम सक्रिय'}
            </span>
            <p className="mt-0.5 text-red-200">
              {assessment.safety_override_reason ||
                (lang === 'en'
                  ? 'Imminent life-safety hazard mandates priority escalation over sparse data completeness.'
                  : 'आसन्न जान-माल के खतरे के कारण प्राथमिकता स्वचालित रूप से बढ़ाई गई है।')}
            </p>
          </div>
        </div>
      )}

      {/* Main Score Display & Formula Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        {/* Composite Score Circle */}
        <div className="md:col-span-1 bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-black text-white">{score}</div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {lang === 'en' ? 'Composite' : 'समग्र स्कोर'} / 100
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full ${
                score >= 75 ? 'bg-red-500' : score >= 55 ? 'bg-orange-500' : score >= 35 ? 'bg-yellow-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, score)}%` }}
            />
          </div>
        </div>

        {/* 4 Factor Component Breakdown */}
        <div className="md:col-span-3 grid grid-cols-2 gap-2 text-xs">
          {/* H: Hazard Severity 40% */}
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                <span>{lang === 'en' ? 'Hazard (H: 40%)' : 'आपदा तीव्रता (40%)'}</span>
              </span>
              <span className="font-mono text-white font-bold">{assessment.hazard_score.toFixed(0)}/100</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div className="bg-red-500 h-full" style={{ width: `${assessment.hazard_score}%` }} />
            </div>
          </div>

          {/* E: Population Exposure 30% */}
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'en' ? 'Exposure (E: 30%)' : 'जनसंख्या प्रभाव (30%)'}</span>
              </span>
              <span className="font-mono text-white font-bold">{assessment.exposure_score.toFixed(0)}/100</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div className="bg-amber-500 h-full" style={{ width: `${assessment.exposure_score}%` }} />
            </div>
          </div>

          {/* V: Vulnerability 20% */}
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <Landmark className="w-3.5 h-3.5 text-blue-400" />
                <span>{lang === 'en' ? 'Vulnerability (V: 20%)' : 'संवेदनशीलता (20%)'}</span>
              </span>
              <span className="font-mono text-white font-bold">{assessment.vulnerability_score.toFixed(0)}/100</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div className="bg-blue-500 h-full" style={{ width: `${assessment.vulnerability_score}%` }} />
            </div>
          </div>

          {/* D: Data Reliability & Freshness 10% */}
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'en' ? 'Freshness (D: 10%)' : 'डेटा विश्वसनीयता (10%)'}</span>
              </span>
              <span className="font-mono text-white font-bold">{assessment.data_freshness_score.toFixed(0)}/100</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${assessment.data_freshness_score}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Contributing Factors List */}
      <div>
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{lang === 'en' ? 'Auditable Factor Breakdown:' : 'ऑडिट योग्य कारक विवरण:'}</span>
        </h4>
        <ul className="space-y-1 text-xs text-slate-300">
          {assessment.contributing_factors.map((factor, idx) => (
            <li key={idx} className="flex items-start gap-2 bg-slate-950/40 px-2 py-1.5 rounded border border-slate-800/50">
              <span className="text-amber-400 font-bold">•</span>
              <span>{factor}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
