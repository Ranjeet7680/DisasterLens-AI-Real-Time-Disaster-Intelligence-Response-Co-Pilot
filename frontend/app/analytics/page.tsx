'use client';

import React, { useState } from 'react';
import { Header } from '../../components/Header';
import { IncidentReportModal } from '../../components/IncidentReportModal';
import { SimulatorDrawer } from '../../components/SimulatorDrawer';
import {
  Activity,
  TrendingUp,
  Cpu,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Flame,
  Users,
  Compass,
  Download,
  BarChart3,
  Waves,
  Zap
} from 'lucide-react';
import { SupportedLanguage } from '../../lib/languages';

export default function AnalyticsPage() {
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [timeHorizon, setTimeHorizon] = useState<'24h' | '48h' | '72h'>('48h');

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // 72-Hour Inundation & Precipitation Forecast Data
  const forecastData = [
    { hour: 'T+00h', rain: 42, riverMeters: 4.8, risk: 78, status: 'Warning' },
    { hour: 'T+06h', rain: 68, riverMeters: 5.6, risk: 86, status: 'Critical' },
    { hour: 'T+12h', rain: 95, riverMeters: 6.9, risk: 94, status: 'Peak Surge' },
    { hour: 'T+18h', rain: 82, riverMeters: 7.2, risk: 91, status: 'Critical' },
    { hour: 'T+24h', rain: 54, riverMeters: 6.4, risk: 82, status: 'High' },
    { hour: 'T+36h', rain: 30, riverMeters: 5.1, risk: 65, status: 'Medium' },
    { hour: 'T+48h', rain: 15, riverMeters: 4.2, risk: 48, status: 'Receding' },
    { hour: 'T+72h', rain: 8, riverMeters: 3.5, risk: 32, status: 'Safe' }
  ];

  // Ward Vulnerability Index
  const wardVulnerability = [
    { ward: 'Ward 14 (Doranda Lowlands)', population: 28400, elevationM: 642, riskIdx: 92, shelterFit: '480 / 600' },
    { ward: 'Ward 08 (Subarnarekha Riverbank)', population: 19800, elevationM: 638, riskIdx: 89, shelterFit: '310 / 400' },
    { ward: 'Ward 22 (Namkum Embankment)', population: 22100, elevationM: 645, riskIdx: 76, shelterFit: '220 / 300' },
    { ward: 'Ward 03 (Morabadi Plateau)', population: 35000, elevationM: 672, riskIdx: 34, shelterFit: 'Safe Zone' },
    { ward: 'Ward 11 (Bariatu Foothills)', population: 26500, elevationM: 668, riskIdx: 28, shelterFit: 'Safe Zone' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans tactical-grid">
      <Header
        lang={lang}
        setLang={setLang}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
      />

      <main className="max-w-[1700px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1 pt-8 sm:pt-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400 shadow-md">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                  <span>{lang === 'en' ? 'Predictive Hazard Analytics & Agent Benchmarking' : 'आपदा पूर्वानुमानी विश्लेषण एवं एजेंट प्रदर्शन'}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    ML FORECASTING
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  {lang === 'en'
                    ? 'Hydro-meteorological forecast models, multi-agent AI execution benchmarks, and ward-level vulnerability indices'
                    : 'जल-मौसम पूर्वानुमान मॉडल, मल्टी-एजेंट गति विश्लेषण एवं वार्ड स्तर संवेदनशीलता'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              {(['24h', '48h', '72h'] as const).map((h) => (
                <button
                  key={h}
                  onClick={() => setTimeHorizon(h)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    timeHorizon === h ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {h} Model
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Agent Execution Benchmarks KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Pipeline Latency
              </span>
              <span className="text-2xl font-black font-mono text-cyan-400 mt-0.5 block">
                1,527 ms
              </span>
              <span className="text-[10px] text-slate-500 font-mono">4 Coordinated Agents</span>
            </div>
            <Clock className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-900/80 p-3.5 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                Safety Override Recall
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400 mt-0.5 block">
                100.0%
              </span>
              <span className="text-[10px] text-emerald-300/80 font-mono">Zero Missed Life Hazards</span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-purple-950/40 border border-purple-900/80 p-3.5 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
                Deduplication Precision
              </span>
              <span className="text-2xl font-black font-mono text-purple-300 mt-0.5 block">
                98.4%
              </span>
              <span className="text-[10px] text-purple-300/80 font-mono">Haversine Geofenced</span>
            </div>
            <Cpu className="w-5 h-5 text-purple-400" />
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-amber-950/40 border border-amber-900/80 p-3.5 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                False Alert Filtering
              </span>
              <span className="text-2xl font-black font-mono text-amber-300 mt-0.5 block">
                78.5%
              </span>
              <span className="text-[10px] text-amber-400/80 font-mono">Noise Reduction</span>
            </div>
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        {/* 72-Hour Predictive Hydro-Meteorological Inundation Forecast */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Waves className="w-4 h-4 text-cyan-400" />
                <span>Ranchi &amp; Subarnarekha River Basin — Inundation Depth &amp; Risk Trajectory</span>
              </h2>
              <p className="text-xs text-slate-400">
                Predictive hydrological time-series model combining Open-Meteo precipitation forecasts with dam spillway rates
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>Peak Surge: T+12h (7.2m)</span>
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Max Rain: 95 mm/h</span>
              </span>
            </div>
          </div>

          {/* Forecast Visual Chart Bars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
            {forecastData.map((d, idx) => {
              const isPeak = d.status.includes('Peak') || d.status === 'Critical';
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex flex-col justify-between text-center transition-all ${
                    isPeak
                      ? 'bg-red-950/40 border-red-700/80 shadow-lg shadow-red-950/40'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="font-mono text-xs font-bold text-slate-300 mb-1">
                    {d.hour}
                  </div>

                  {/* Visual Bar Height proportional to risk */}
                  <div className="h-28 flex items-end justify-center py-2">
                    <div
                      className={`w-8 rounded-t-lg transition-all duration-700 ${
                        d.risk >= 85
                          ? 'bg-gradient-to-t from-red-600 to-orange-500'
                          : d.risk >= 65
                          ? 'bg-gradient-to-t from-amber-600 to-yellow-400'
                          : 'bg-gradient-to-t from-cyan-600 to-teal-400'
                      }`}
                      style={{ height: `${d.risk}%` }}
                    />
                  </div>

                  <div className="space-y-1 pt-1 border-t border-slate-800 text-[11px]">
                    <div className="font-mono font-black text-white">{d.riverMeters}m rise</div>
                    <div className="text-[10px] text-cyan-400 font-mono">{d.rain} mm/h</div>
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                        isPeak ? 'bg-red-900 text-red-200' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ward-Level Vulnerability & Exposure Index Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Ranchi Municipal Corporation — Ward Exposure &amp; Vulnerability Matrix</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Census population density × terrain elevation × dwelling vulnerability
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">5 Monitored Sectors</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/50 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3.5">Ward &amp; Lowland Sector</th>
                  <th className="p-3.5">Exposed Population</th>
                  <th className="p-3.5">Mean Elevation</th>
                  <th className="p-3.5">Vulnerability Index</th>
                  <th className="p-3.5">Designated Shelter Match</th>
                  <th className="p-3.5 text-right">Priority Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {wardVulnerability.map((w, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-white flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${w.riskIdx > 75 ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
                      <span>{w.ward}</span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {w.population.toLocaleString()} souls
                    </td>
                    <td className="p-3.5 font-mono text-cyan-400">
                      {w.elevationM} m MSL
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-white">{w.riskIdx}/100</span>
                        <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${w.riskIdx > 75 ? 'bg-red-500' : w.riskIdx > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${w.riskIdx}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {w.shelterFit}
                    </td>
                    <td className="p-3.5 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          w.riskIdx > 75
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {w.riskIdx > 75 ? 'Mandate Evacuation' : 'Muster Station Ready'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <IncidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitted={() => {}}
        lang={lang}
      />

      <SimulatorDrawer
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onScenarioTriggered={() => {}}
        lang={lang}
      />
    </div>
  );
}
