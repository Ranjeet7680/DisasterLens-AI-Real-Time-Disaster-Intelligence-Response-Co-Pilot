'use client';

import React, { useState } from 'react';
import { Bot, Mic, Send, Volume2, VolumeX, X, Sparkles, Radio, Shield, Navigation, AlertTriangle } from 'lucide-react';
import { SupportedLanguage, getTranslation } from '../lib/languages';
import { startVoiceRecognition, stopVoiceRecognition, speakText, stopSpeaking } from '../lib/voice';

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
  actions?: string[];
}

interface AICopilotChatProps {
  isOpen: boolean;
  onClose: () => void;
  lang: SupportedLanguage;
  incidentId?: string;
}

export const AICopilotChat: React.FC<AICopilotChatProps> = ({
  isOpen,
  onClose,
  lang,
  incidentId
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'copilot',
      text:
        lang === 'hi'
          ? 'नमस्ते कमांडर! मैं आपका वास्तविक समय आपदा निर्णय सह-पायलट (Disaster AI Co-Pilot) हूँ। आप मुझसे राहत आश्रय, बचाव नावों, सुरक्षित निकासी मार्गों या चिकित्सा सहायता के बारे में बोलकर या लिखकर पूछ सकते हैं।'
          : lang === 'bn'
          ? 'নমস্কার কমান্ডার! আমি আপনার দুর্যোগ সিদ্ধান্ত সহ-পাইলট। আপনি আশ্রয় শিবির, উদ্ধারকারী নৌকা, নিরাপদ রুট বা জরুরি চিকিৎসা বিষয়ে জানতে পারেন।'
          : lang === 'ta'
          ? 'வணக்கம் தளபதியே! நான் உங்கள் பேரிடர் முடிவெடுக்கும் AI வழிகாட்டி. முகாம்கள், மீட்புப் படகுகள், வெளியேற்றப் பாதைகள் அல்லது மருத்துவ உதவிகள் குறித்து என்னிடம் கேளுங்கள்.'
          : lang === 'te'
          ? 'నమస్కారం కమాండర్! నేను మీ విపత్తు నిర్ణయ సహ-పైలట్. సహాయక శిబిరాలు, రెస్క్యూ బోట్లు, సురక్షిత మార్గాలు లేదా వైద్య సహాయం గురించి అడగండి.'
          : lang === 'mr'
          ? 'नमस्कार कमांडर! मी तुमचा आपत्ती निर्णय सह-पायलट आहे. मदत शिबिरे, बचाव नौका, सुरक्षित रस्ते किंवा वैद्यकीय मदतीबद्दल मला विचारा.'
          : 'Greetings Commander! I am your real-time Disaster AI Co-Pilot. Ask me about nearby shelter capacities, rescue boats, open evacuation corridors, hospital readiness, or risk calculations.',
      timestamp: 'Initial'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickPrompts = [
    {
      label: lang === 'hi' ? '🏠 आश्रय स्थल क्षमता' : '🏠 Shelter Capacity',
      text: lang === 'hi' ? 'आसपास के आश्रय स्थलों में कितनी क्षमता उपलब्ध है?' : 'Which shelters have space available?'
    },
    {
      label: lang === 'hi' ? '🚤 बचाव नावें स्थिति' : '🚤 Rescue Boats Ready',
      text: lang === 'hi' ? 'कितनी मोटर चालित नावें स्टैंडबाय पर हैं?' : 'How many rescue boats are on standby within 3 km?'
    },
    {
      label: lang === 'hi' ? '🛣️ सुरक्षित निकासी मार्ग' : '🛣️ Evacuation Routes',
      text: lang === 'hi' ? 'कौन से सड़कें और निकासी मार्ग जलभराव से मुक्त हैं?' : 'Which evacuation routes and roads are safe and open?'
    },
    {
      label: lang === 'hi' ? '🏥 अस्पताल व एम्बुलेंस' : '🏥 Hospital Triage',
      text: lang === 'hi' ? 'रिम्स अस्पताल और एम्बुलेंस की क्या स्थिति है?' : 'What is the status of hospital trauma care and ambulances?'
    },
    {
      label: lang === 'hi' ? '📐 जोखिम फॉर्मूला' : '📐 Risk Formula',
      text: lang === 'hi' ? 'समग्र जोखिम फॉर्मूला और सुरक्षा नियम समझाइए' : 'Explain the composite risk formula and safety override'
    }
  ];

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/copilot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          incident_id: incidentId,
          lang: lang
        })
      });

      if (res.ok) {
        const data = await res.json();
        const copilotMsg: ChatMessage = {
          id: `cop-${Date.now()}`,
          sender: 'copilot',
          text: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: data.suggested_actions
        };
        setMessages((prev) => [...prev, copilotMsg]);

        // Auto-read response aloud if enabled
        if (autoSpeak) {
          setSpeakingMsgId(copilotMsg.id);
          speakText(data.answer, lang, () => {
            setSpeakingMsgId(null);
          });
        }
      }
    } catch (e) {
      console.error('Copilot query error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVoiceDictation = () => {
    if (isListening) {
      stopVoiceRecognition();
      setIsListening(false);
    } else {
      setIsListening(true);
      startVoiceRecognition(
        lang,
        (transcript) => {
          setInputQuery(transcript);
        },
        (err) => {
          console.warn(err);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
    }
  };

  const handleSpeak = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      setSpeakingMsgId(msgId);
      speakText(text, lang, () => setSpeakingMsgId(null));
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full h-[640px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header with AI Emblem and Voice Toggles */}
        <div className="p-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-purple-500/50 shadow-lg shadow-purple-950/50 shrink-0 bg-slate-900">
              <img
                src="/logo.png"
                alt="AI Co-Pilot"
                className="w-full h-full object-cover scale-125"
              />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{getTranslation(lang, 'voiceCopilot', 'Ask Disaster AI Co-Pilot')}</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-purple-950 text-cyan-300 border border-purple-800 font-bold uppercase">
                  {lang} Mode
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {incidentId ? `📍 Grounded context: Incident ${incidentId}` : '📡 Grounded on live incident & resource feeds'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-Speak Toggle */}
            <button
              onClick={() => {
                if (autoSpeak) stopSpeaking();
                setAutoSpeak(!autoSpeak);
              }}
              title={autoSpeak ? 'Auto-Voice Readout: ON' : 'Auto-Voice Readout: OFF'}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all border ${
                autoSpeak
                  ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Volume2 className="w-3 h-3 text-amber-400" />
              <span>{autoSpeak ? 'Audio ON' : 'Audio OFF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Question Pills */}
        <div className="px-3.5 py-2 bg-slate-950/50 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
          <span className="text-slate-400 text-[10px] shrink-0 font-bold uppercase tracking-wider">Quick Ask:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.text)}
              className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-purple-950 hover:border-purple-600 border border-slate-700/80 text-slate-300 hover:text-white text-[11px] shrink-0 transition-all font-medium"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            const isSpeakingThis = speakingMsgId === m.id;

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-sm shadow-md'
                      : 'bg-slate-800/95 text-slate-200 border border-slate-700/80 rounded-bl-sm shadow-lg'
                  }`}
                >
                  <p className="text-xs font-sans whitespace-pre-wrap">{m.text}</p>

                  {/* Render Suggested Action Chips if provided by AI */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700/80 flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-bold text-amber-400 block w-full">⚡ Suggested EOC Directives:</span>
                      {m.actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleSend(`Confirm authorization: ${act}`)}
                          className="px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-200 border border-purple-800 text-[10px] font-semibold hover:bg-purple-900 transition-colors"
                        >
                          {act}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 px-1.5 text-[10px] text-slate-500">
                  <span className="font-mono">{m.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => handleSpeak(m.id, m.text)}
                      title="Read answer aloud"
                      className="hover:text-amber-400 text-slate-400 transition-colors flex items-center gap-1"
                    >
                      {isSpeakingThis ? (
                        <>
                          <div className="flex items-center gap-0.5 h-2.5">
                            <div className="w-0.5 bg-amber-400 rounded-full eq-bar-1" />
                            <div className="w-0.5 bg-amber-400 rounded-full eq-bar-2" />
                            <div className="w-0.5 bg-amber-400 rounded-full eq-bar-3" />
                            <div className="w-0.5 bg-amber-400 rounded-full eq-bar-4" />
                          </div>
                          <span className="text-amber-400 font-mono text-[9px]">Speaking</span>
                        </>
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-purple-400 text-xs py-2">
              <span className="animate-spin">⏳</span>
              <span>Evaluating live telemetry, SOP guidelines & river levels...</span>
            </div>
          )}
        </div>

        {/* Voice Dictation Notification Banner */}
        {isListening && (
          <div className="bg-red-950/90 border-t border-red-800 px-4 py-2 text-xs text-red-200 flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-md shadow-red-500" />
              <span>{getTranslation(lang, 'voiceListening', 'Listening to your speech... Speak now')}</span>
            </span>
            <button
              onClick={handleToggleVoiceDictation}
              className="text-[11px] underline text-red-300 hover:text-white font-bold"
            >
              Stop Recording
            </button>
          </div>
        )}

        {/* Input Bar with Mic & Send */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          {/* Microphone Dictation Button */}
          <button
            onClick={handleToggleVoiceDictation}
            title={isListening ? 'Stop recording' : 'Dictate by voice in ' + lang}
            className={`p-2.5 rounded-xl border transition-all ${
              isListening
                ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/50 animate-pulse'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-purple-500/50'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={
              lang === 'hi'
                ? 'आपदा स्थिति, आश्रय या राहत के बारे में पूछें...'
                : 'Ask about flood danger, shelter capacity, routes...'
            }
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || loading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white disabled:opacity-30 transition-all shadow-md active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
