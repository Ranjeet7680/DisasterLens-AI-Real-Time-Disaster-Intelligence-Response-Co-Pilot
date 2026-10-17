'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Mic, Bot, Sparkles, Radio } from 'lucide-react';
import { SupportedLanguage, getTranslation } from '../lib/languages';
import { speakText, stopSpeaking, isSpeaking } from '../lib/voice';

interface VoiceAssistantBarProps {
  currentBriefText?: string;
  lang: SupportedLanguage;
  onOpenReportWithVoice: () => void;
  onOpenCopilot: () => void;
}

export const VoiceAssistantBar: React.FC<VoiceAssistantBarProps> = ({
  currentBriefText,
  lang,
  onOpenReportWithVoice,
  onOpenCopilot
}) => {
  const [speaking, setSpeaking] = useState(false);

  const handleToggleSpeak = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      if (!currentBriefText) return;
      setSpeaking(true);
      speakText(currentBriefText, lang, () => {
        setSpeaking(false);
      });
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/50 rounded-xl p-3 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md">
      {/* Left: Tactical Audio & AI Indicator */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800 shrink-0">
          <Radio className={`w-4 h-4 ${speaking ? 'text-amber-400 animate-pulse' : ''}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-white">
              {lang === 'hi' ? 'भारतीय बहुभाषी वॉइस सिस्टम' : lang === 'bn' ? 'ভারতীয় বহুভাষিক ভয়েস সিস্টেম' : 'Indian Multilingual Voice Assistant'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase font-semibold">
              {lang} TTS + STT
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {lang === 'hi'
              ? 'आपातकालीन रिपोर्ट सुनें या बोलकर नयी घटना दर्ज करें।'
              : 'Listen to operational briefings or dictate emergency reports hands-free.'}
          </p>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Listen to SitRep Button */}
        <button
          onClick={handleToggleSpeak}
          disabled={!currentBriefText}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-40 ${
            speaking
              ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          {speaking ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
          <span>{speaking ? (lang === 'hi' ? 'रोकें (Stop)' : 'Stop Audio') : getTranslation(lang, 'voiceSpeakBrief', 'Listen to SitRep')}</span>
        </button>

        {/* Dictate SOS Voice Report Button */}
        <button
          onClick={onOpenReportWithVoice}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
        >
          <Mic className="w-3.5 h-3.5 text-white" />
          <span>{lang === 'hi' ? 'बोलकर रिपोर्ट करें' : 'Voice Dictate SOS'}</span>
        </button>

        {/* Ask AI Copilot Button */}
        <button
          onClick={onOpenCopilot}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'AI सहायक से पूछें' : 'Ask AI Co-Pilot'}</span>
        </button>
      </div>
    </div>
  );
};
