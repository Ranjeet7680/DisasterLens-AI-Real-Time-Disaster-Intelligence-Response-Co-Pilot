'use client';

import React, { useState } from 'react';
import { AgentRun } from '../lib/types';
import { Bot, CheckCircle, Clock, Zap, AlertCircle, Cpu, Languages, Sparkles, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

interface AgentActivityProps {
  agentRuns: AgentRun[];
  summaryEn?: string;
  summaryHi?: string;
  lang: 'en' | 'hi';
  onReanalyze?: () => void;
  isAnalyzing?: boolean;
}

export const AgentActivity: React.FC<AgentActivityProps> = ({
  agentRuns,
  summaryEn,
  summaryHi,
  lang,
  onReanalyze,
  isAnalyzing = false
}) => {
  const [briefLang, setBriefLang] = useState<'en' | 'hi'>(lang);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const agentsList = [
    { key: 'Hazard Intelligence Agent', icon: '🌊', desc: 'Precipitation, river levels & flood stage' },
    { key: 'Report Validation Agent', icon: '🔍', desc: 'Deduplication, geofencing & source credibility' },
    { key: 'Risk Assessment Agent', icon: '⚖️', desc: 'R=0.4H+0.3E+0.2V+0.1D & safety override' },
    { key: 'Response Planning Agent', icon: '📋', desc: 'SOP matching & resource allocation' }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
      {/* Flowing Data Beam Animation along the top border */}
      <div className="absolute top-0 left-0 right-0 h-1 agent-stream-glow" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{lang === 'en' ? 'Multi-Agent AI Pipeline' : 'मल्टी-एजेंट AI पाइपलाइन'}</span>
              {isAnalyzing && (
                <span className="text-[10px] font-mono text-amber-400 animate-pulse bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  EXECUTING AGENTS...
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'en' ? 'Deterministic execution with auditable telemetry' : 'स्पष्ट ट्रेस के साथ स्वचालित विश्लेषण'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onReanalyze && (
            <button
              onClick={onReanalyze}
              disabled={isAnalyzing}
              className="px-2.5 py-1 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? (lang === 'en' ? 'Analyzing...' : 'विश्लेषण...') : (lang === 'en' ? 'Re-run Workflow' : 'पुनः चलाएं')}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{lang === 'en' ? 'Active' : 'सक्रिय'}</span>
          </div>
        </div>
      </div>

      {/* Agent Workflow Sequence Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {agentsList.map((agentMeta, idx) => {
          const run = agentRuns.find((r) => r.agent_name.toLowerCase().includes(agentMeta.key.toLowerCase().split(' ')[0]));
          const isDone = !!run;
          const isFallback = run?.status === 'fallback';
          const isExpanded = expandedAgent === agentMeta.key;

          return (
            <div
              key={idx}
              onClick={() => isDone && setExpandedAgent(isExpanded ? null : agentMeta.key)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isDone
                  ? 'bg-slate-950/70 border-slate-700 hover:border-slate-500'
                  : 'bg-slate-950/30 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{agentMeta.icon}</span>
                {isDone ? (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    isFallback ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}>
                    {run.latency_ms}ms
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-500">IDLE</span>
                )}
              </div>
              <div className="font-bold text-xs text-slate-200 mb-1 flex items-center justify-between">
                <span>{agentMeta.key}</span>
                {isDone && (
                  <span className="text-slate-400">
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 leading-tight mb-2">{agentMeta.desc}</div>

              {/* Status footer */}
              <div className="flex items-center gap-1 text-[11px] font-medium pt-2 border-t border-slate-800">
                {isDone ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 capitalize">{run.status}</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-500">{lang === 'en' ? 'Waiting' : 'प्रतीक्षारत'}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Agent Telemetry Inspection */}
      {expandedAgent && (
        <div className="mb-4 p-3 rounded-xl bg-slate-950 border border-indigo-900/60 text-xs">
          <div className="flex items-center justify-between mb-2 text-indigo-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>{expandedAgent} Telemetry & Output Trace</span>
            </span>
            <button
              onClick={() => setExpandedAgent(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 p-2 rounded bg-slate-900/80 border border-slate-800">
            {JSON.stringify(
              agentRuns.find((r) => r.agent_name.toLowerCase().includes(expandedAgent.toLowerCase().split(' ')[0]))?.output,
              null,
              2
            )}
          </pre>
        </div>
      )}

      {/* Decision Briefing Box (English + Hindi) */}
      {(summaryEn || summaryHi) && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-900/50 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'en' ? 'Consolidated Decision Briefing' : 'समेकित परिचालन निर्णय रिपोर्ट'}</span>
            </span>

            {/* Language toggle for brief */}
            <div className="flex items-center gap-1 text-[11px] bg-slate-900 px-1 py-0.5 rounded border border-slate-800">
              <button
                onClick={() => setBriefLang('en')}
                className={`px-2 py-0.5 rounded ${briefLang === 'en' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
              >
                EN
              </button>
              <button
                onClick={() => setBriefLang('hi')}
                className={`px-2 py-0.5 rounded ${briefLang === 'hi' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
              >
                हिंदी
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            {briefLang === 'en' ? (summaryEn || summaryHi) : (summaryHi || summaryEn)}
          </p>
        </div>
      )}
    </div>
  );
};
