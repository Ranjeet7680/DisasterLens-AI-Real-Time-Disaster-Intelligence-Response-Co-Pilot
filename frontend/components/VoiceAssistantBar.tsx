'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Mic, Bot, Sparkles, Radio, Activity } from 'lucide-react';
import { SupportedLanguage, getTranslation } from '../lib/languages';
import { speakText, stopSpeaking } from '../lib/voice';

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

  // Fallback SITREP so the audio is NEVER disabled/grayed out
  const defaultBrief =
    lang === 'hi'
      ? 'आपदा प्रबंधन नियंत्रण कक्ष सक्रिय है। राँची बेसिन में 5 बाढ़ क्षेत्रों की निगरानी जारी है। एसडीआरएफ की तीव्र गति नावें मोरहाबादी और डोरंडा में तैनात हैं।'
      : lang === 'bn'
      ? 'দুর্যোগ ব্যবস্থাপনা নিয়ন্ত্রণ কক্ষ সক্রিয়। রাঁচি অববাহিকায় ৫টি বন্যা অঞ্চল পর্যবেক্ষণ করা হচ্ছে। এসডিআরএফ উদ্ধারকারী দল মোতায়েন রয়েছে।'
      : lang === 'ta'
      ? 'பேரிடர் மேலாண்மைக் கட்டுப்பாட்டு அறை செயல்படுகிறது. ராஞ்சி ஆற்றுப்படுகையில் 5 வெள்ளப் பகுதிகள் கண்காணிக்கப்படுகின்றன.'
      : lang === 'te'
      ? 'విపత్తు నిర్వహణ నియంత్రణ కేంద్రం చురుగ్గా ఉంది. రాంచీ బేసిన్లో 5 వరద ప్రభావిత ప్రాంతాలను పర్యవేక్షిస్తున్నారు.'
      : lang === 'mr'
      ? 'आपत्ती व्यवस्थापन नियंत्रण कक्ष सक्रिय आहे. रांची खोऱ्यात ५ पूर प्रवण क्षेत्रांवर देखरेख सुरू आहे.'
      : 'Disaster Management Control Room Active. Monitoring 5 critical flood sectors in Ranchi basin. SDRF fast response rescue boats staged at Morabadi and Doranda.';

  const textToSpeak = currentBriefText || defaultBrief;

  const handleToggleSpeak = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      speakText(textToSpeak, lang, () => {
        setSpeaking(false);
      });
    }
  };

  return (
    <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/30 rounded-2xl p-3.5 shadow-[0_0_25px_rgba(99,102,241,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xl">
      {/* Left: Tactical Audio & AI Indicator */}
      <div className="flex items-center gap-3.5">
        <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-indigo-950 to-slate-900 text-indigo-400 border border-indigo-500/40 shrink-0 shadow-lg">
          <Radio className={`w-5 h-5 ${speaking ? 'text-amber-400 animate-pulse' : 'text-indigo-400'}`} />
          {speaking && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-sm text-white tracking-tight">
              {lang === 'hi'
                ? 'भारतीय बहुभाषी वॉइस सहायक'
                : lang === 'bn'
                ? 'ভারতীয় বহুভাষিক ভয়েস সহায়ক'
                : lang === 'ta'
                ? 'இந்திய பன்மொழி குரல் உதவியாளர்'
                : lang === 'te'
                ? 'భారతీయ బహుభాషా వాయిస్ అసిస్టెంట్'
                : lang === 'mr'
                ? 'भारतीय बहुभाषिक व्हॉइस सहाय्यक'
                : 'Indian Multilingual Tactical Voice System'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-cyan-300 border border-cyan-800 font-bold uppercase tracking-wider">
              {lang} TTS + STT Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'hi'
              ? 'आपातकालीन सितरेप सुनें या हैंड्स-फ्री बोलकर रिपोर्ट दर्ज करें।'
              : 'Listen to live tactical briefings or dictate emergency SOS reports hands-free.'}
          </p>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Listen to SitRep Button with Real-Time Audio Equalizer */}
        <button
          onClick={handleToggleSpeak}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 ${
            speaking
              ? 'bg-amber-500 text-slate-950 shadow-amber-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-amber-500/50'
          }`}
        >
          {speaking ? (
            <>
              {/* Equalizer animation */}
              <div className="flex items-center gap-0.5 h-3.5">
                <div className="w-0.5 bg-slate-950 rounded-full eq-bar-1" />
                <div className="w-0.5 bg-slate-950 rounded-full eq-bar-2" />
                <div className="w-0.5 bg-slate-950 rounded-full eq-bar-3" />
                <div className="w-0.5 bg-slate-950 rounded-full eq-bar-4" />
                <div className="w-0.5 bg-slate-950 rounded-full eq-bar-5" />
              </div>
              <span>{lang === 'hi' ? 'रोकें (Stop)' : 'Stop Audio'}</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>{getTranslation(lang, 'voiceSpeakBrief', 'Listen to SitRep')}</span>
            </>
          )}
        </button>

        {/* Dictate SOS Voice Report Button */}
        <button
          onClick={onOpenReportWithVoice}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-blue-900/40 active:scale-95"
        >
          <Mic className="w-4 h-4 text-white animate-pulse" />
          <span>{lang === 'hi' ? 'बोलकर रिपोर्ट करें' : 'Voice Dictate SOS'}</span>
        </button>

        {/* Ask AI Copilot Button */}
        <button
          onClick={onOpenCopilot}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-purple-900/40 active:scale-95"
        >
          <Bot className="w-4 h-4 text-white" />
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{lang === 'hi' ? 'AI सह-पायलट' : 'Ask AI Co-Pilot'}</span>
        </button>
      </div>
    </div>
  );
};
