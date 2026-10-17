'use client';

import React, { useState } from 'react';
import { AgentRun } from '../lib/types';
import {
  Bot,
  CheckCircle,
  Clock,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Terminal,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  FileCode2
} from 'lucide-react';
import { SupportedLanguage, getTranslation } from '../lib/languages';
import { speakText, stopSpeaking } from '../lib/voice';

interface AgentActivityProps {
  agentRuns: AgentRun[];
  summaryEn?: string;
  summaryHi?: string;
  translations?: Record<string, string>;
  lang: SupportedLanguage;
  onReanalyze?: () => void;
  isAnalyzing?: boolean;
}

export const AgentActivity: React.FC<AgentActivityProps> = ({
  agentRuns,
  summaryEn,
  summaryHi,
  translations,
  lang,
  onReanalyze,
  isAnalyzing = false
}) => {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [isSpeakingBrief, setIsSpeakingBrief] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Active briefing text based on selected language
  const activeBriefText =
    translations?.[lang] ||
    (lang === 'hi' ? summaryHi : summaryEn) ||
    summaryEn ||
    summaryHi ||
    '';

  const handleSpeakBrief = () => {
    if (isSpeakingBrief) {
      stopSpeaking();
      setIsSpeakingBrief(false);
    } else {
      if (!activeBriefText) return;
      setIsSpeakingBrief(true);
      speakText(activeBriefText, lang, () => setIsSpeakingBrief(false));
    }
  };

  const handleCopyPayload = (key: string, payload: any) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const agentsList = [
    {
      step: 1,
      key: 'Hazard Intelligence Agent',
      shortKey: 'hazard',
      icon: '🌊',
      titleEn: 'Hazard Agent',
      titleHi: 'आपदा एजेंट',
      modelType: 'Hybrid (Sensors + Gemini)',
      descEn: 'Precipitation, river levels & flood stage indicators',
      descHi: 'वर्षा, नदी जलस्तर एवं बाढ़ चरण संकेतक'
    },
    {
      step: 2,
      key: 'Report Validation Agent',
      shortKey: 'validation',
      icon: '🔍',
      titleEn: 'Validation Agent',
      titleHi: 'सत्यापन एजेंट',
      modelType: 'Deduplication & Geofencing',
      descEn: 'Duplicate detection, spatial clustering & claim verification',
      descHi: 'दोहरी रिपोर्ट पहचान एवं भौगोलिक सत्यापन'
    },
    {
      step: 3,
      key: 'Risk Assessment Agent',
      shortKey: 'risk',
      icon: '⚖️',
      titleEn: 'Risk Agent',
      titleHi: 'जोखिम एजेंट',
      modelType: 'Deterministic Model',
      descEn: 'R=0.4H+0.3E+0.2V+0.1D & hard life-safety rules',
      descHi: 'नियम-आधारित स्कोरिंग एवं सुरक्षा प्राथमिकता'
    },
    {
      step: 4,
      key: 'Response Planning Agent',
      shortKey: 'response',
      icon: '📋',
      titleEn: 'Response Agent',
      titleHi: 'प्रतिक्रिया एजेंट',
      modelType: 'NDRF SOP Engine',
      descEn: 'SOP matching, evacuation corridors & resource allocation',
      descHi: 'मानक संचालन प्रक्रिया एवं संसाधन आवंटन'
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden">
      {/* Animated Flowing Data Stream along top border */}
      <div className="absolute top-0 left-0 right-0 h-1 agent-stream-glow" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800 shadow-sm">
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{lang === 'en' ? 'Multi-Agent AI Pipeline' : 'मल्टी-एजेंट AI पाइपलाइन'}</span>
              {isAnalyzing && (
                <span className="text-[10px] font-mono text-amber-400 animate-pulse bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  PIPELINE EXECUTING...
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'en'
                ? 'Coordinated hazard validation, deterministic risk, and response planning'
                : 'समन्वित आपदा विश्लेषण, गणितीय जोखिम गणना एवं प्रतिक्रिया योजना'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onReanalyze && (
            <button
              onClick={onReanalyze}
              disabled={isAnalyzing}
              className="px-3 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>
                {isAnalyzing
                  ? lang === 'en'
                    ? 'Analyzing...'
                    : 'विश्लेषण जारी...'
                  : lang === 'en'
                  ? 'Re-run Workflow'
                  : 'पुनः चलाएं'}
              </span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-800 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{lang === 'en' ? 'Active Pipeline' : 'सक्रिय पाइपलाइन'}</span>
          </div>
        </div>
      </div>

      {/* Sequential Pipeline Cards with Visual Directional Connectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {agentsList.map((agentMeta, idx) => {
          const run = agentRuns.find(
            (r) =>
              r.agent_name.toLowerCase().includes(agentMeta.shortKey) ||
              r.agent_name.toLowerCase().includes(agentMeta.key.toLowerCase().split(' ')[0])
          );
          const isDone = !!run;
          const isFallback = run?.status === 'fallback';
          const isExpanded = expandedAgent === agentMeta.key;

          return (
            <div
              key={idx}
              onClick={() => isDone && setExpandedAgent(isExpanded ? null : agentMeta.key)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                isDone
                  ? isExpanded
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-950/50'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-600 hover:bg-slate-950'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60'
              }`}
            >
              <div>
                {/* Step badge & Latency */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-mono font-bold border border-slate-700">
                      {agentMeta.step}
                    </span>
                    <span className="text-lg">{agentMeta.icon}</span>
                  </div>

                  {isDone ? (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight border ${
                        isFallback
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-emerald-950/90 text-emerald-300 border-emerald-800'
                      }`}
                    >
                      {run.latency_ms} ms
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      PENDING
                    </span>
                  )}
                </div>

                {/* Agent Title */}
                <div className="font-bold text-xs text-white mb-1 flex items-center justify-between">
                  <span>{lang === 'en' ? agentMeta.titleEn : agentMeta.titleHi}</span>
                  {isDone && (
                    <span className="text-slate-400 group-hover:text-cyan-400 transition-colors">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  )}
                </div>

                {/* Agent Description */}
                <p className="text-[11px] text-slate-400 leading-snug mb-3">
                  {lang === 'en' ? agentMeta.descEn : agentMeta.descHi}
                </p>
              </div>

              {/* Status footer with Model Tag */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  <span className="truncate max-w-[90px]">{agentMeta.modelType}</span>
                </div>

                {isDone ? (
                  <div className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                    <CheckCircle className="w-3 h-3" />
                    <span className="capitalize">{run.status}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-slate-500 font-medium text-[11px]">
                    <Clock className="w-3 h-3" />
                    <span>Waiting</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Agent Telemetry & Output Inspector */}
      {expandedAgent && (
        <div className="mb-5 p-4 rounded-xl bg-slate-950 border border-indigo-700/80 shadow-2xl relative animate-in fade-in duration-200">
          {(() => {
            const currentRun = agentRuns.find(
              (r) =>
                r.agent_name.toLowerCase().includes(expandedAgent.toLowerCase().split(' ')[0])
            );
            return (
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-sm text-white">
                      {expandedAgent} — Telemetry & Decision Payload
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                      LATENCY: {currentRun?.latency_ms ?? 0} ms
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyPayload(expandedAgent, currentRun?.output)}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === expandedAgent ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setExpandedAgent(null)}
                      className="text-slate-400 hover:text-white px-2 py-0.5 rounded text-xs"
                    >
                      ✕ Close
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Execution State
                    </span>
                    <span className="text-emerald-400 font-bold capitalize flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {currentRun?.status ?? 'Completed'}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Model / Deterministic Engine
                    </span>
                    <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      {expandedAgent.includes('Risk')
                        ? 'Deterministic Formula Model'
                        : expandedAgent.includes('Validation')
                        ? 'Spatial & Jaccard Clustering'
                        : expandedAgent.includes('Response')
                        ? 'Approved SOP Matching'
                        : 'Gemini 2.5 Flash / Sensor Rule'}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Audit Trace Stamp
                    </span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {currentRun?.created_at ? new Date(currentRun.created_at).toLocaleTimeString() : 'Verified'}
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <div className="text-[10px] font-mono text-slate-400 mb-1 flex items-center gap-1">
                    <FileCode2 className="w-3 h-3 text-indigo-400" />
                    <span>Raw Structured Output (Verified Schema):</span>
                  </div>
                  <pre className="text-[11px] font-mono text-cyan-200 bg-slate-900/90 p-3 rounded-lg border border-slate-800 max-h-56 overflow-auto">
                    {JSON.stringify(currentRun?.output ?? {}, null, 2)}
                  </pre>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Multilingual Consolidated Decision Briefing with Equalizer Voice Readout */}
      {activeBriefText && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-900/60 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{getTranslation(lang, 'consolidatedBrief', 'Consolidated Decision Briefing')}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase font-bold">
                {lang}
              </span>
            </span>

            {/* Read Aloud Voice Button with Animated Equalizer Waveform */}
            <button
              onClick={handleSpeakBrief}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
                isSpeakingBrief
                  ? 'bg-amber-600 text-white shadow-amber-900/50 shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700'
              }`}
            >
              {isSpeakingBrief ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <div className="flex items-center gap-0.5 h-3">
                    <span className="w-1 bg-white rounded-full eq-bar-1" />
                    <span className="w-1 bg-white rounded-full eq-bar-2" />
                    <span className="w-1 bg-white rounded-full eq-bar-3" />
                    <span className="w-1 bg-white rounded-full eq-bar-4" />
                    <span className="w-1 bg-white rounded-full eq-bar-5" />
                  </div>
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen Brief</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            {activeBriefText}
          </p>
        </div>
      )}
    </div>
  );
};
