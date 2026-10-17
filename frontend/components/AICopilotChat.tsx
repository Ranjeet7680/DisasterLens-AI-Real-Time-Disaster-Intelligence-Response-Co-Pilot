'use client';

import React, { useState } from 'react';
import { Bot, Send, Mic, MicOff, Volume2, VolumeX, Sparkles, X, ChevronRight, MessageSquare } from 'lucide-react';
import { SupportedLanguage, getTranslation } from '../lib/languages';
import { speakText, stopSpeaking, startVoiceRecognition, stopVoiceRecognition } from '../lib/voice';

interface AICopilotChatProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId?: string;
  lang: SupportedLanguage;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
}

export const AICopilotChat: React.FC<AICopilotChatProps> = ({
  isOpen,
  onClose,
  incidentId,
  lang
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'copilot',
      text:
        lang === 'hi'
          ? 'नमस्ते! मैं आपका आपदा निर्णय सह-पायलट (Disaster AI Co-Pilot) हूँ। आप मुझसे राहत आश्रय, बचाव नावों या जोखिम स्कोर के बारे में बोलकर या लिखकर पूछ सकते हैं।'
          : lang === 'bn'
          ? 'নমস্কার! আমি আপনার দুর্যোগ সিদ্ধান্ত সহ-পাইলট। আপনি আশ্রয় শিবির, উদ্ধারকারী নৌকা বা ঝুঁকির বিষয়ে জানতে চাইতে পারেন।'
          : lang === 'ta'
          ? 'வணக்கம்! நான் உங்கள் பேரிடர் முடிவெடுக்கும் AI வழிகாட்டி. முகாம்கள் அல்லது மீட்புப் படகுகள் குறித்து என்னிடம் கேளுங்கள்.'
          : lang === 'te'
          ? 'నమస్కారం! నేను మీ విపత్తు నిర్ణయ సహ-పైలట్. సహాయక శిబిరాలు లేదా రెస్క్యూ బోట్ల గురించి అడగండి.'
          : lang === 'mr'
          ? 'नमस्कार! मी तुमचा आपत्ती निर्णय सह-पायलट आहे. मदत शिबिरे किंवा बचाव पथकांबद्दल मला विचारा.'
          : 'Greetings Commander! I am your real-time Disaster AI Co-Pilot. Ask me about nearby shelter capacities, rescue boats, SOP guidelines, or risk calculations.',
      timestamp: 'Initial'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickPrompts = [
    { label: lang === 'hi' ? 'आश्रय स्थल क्षमता' : 'Shelter capacity nearby?', text: 'Which shelters have space available?' },
    { label: lang === 'hi' ? 'बचाव नावें स्थिति' : 'Available rescue boats?', text: 'How many rescue boats are on standby within 3 km?' },
    { label: lang === 'hi' ? 'जोखिम फॉर्मूला समझाइए' : 'Explain Risk Formula', text: 'Explain the composite risk formula and safety override' }
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
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, copilotMsg]);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full h-[620px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-950/50">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{getTranslation(lang, 'voiceCopilot', 'Ask Disaster AI Co-Pilot')}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase">
                  {lang}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {incidentId ? `Grounded context: Incident ${incidentId}` : 'Grounded on real-time incident & resource feeds'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Question Pills */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[10px] shrink-0 font-semibold">Quick Ask:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.text)}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-indigo-950 hover:border-indigo-700 border border-slate-700 text-slate-300 text-[11px] shrink-0 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            const isSpeakingThis = speakingMsgId === m.id;

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-sm shadow-md'
                  }`}
                >
                  <p className="text-xs font-sans">{m.text}</p>
                </div>

                <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-500">
                  <span>{m.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => handleSpeak(m.id, m.text)}
                      title="Read answer aloud"
                      className="hover:text-indigo-400 text-slate-400 transition-colors"
                    >
                      {isSpeakingThis ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-indigo-400 text-xs py-2">
              <span className="animate-spin">⏳</span>
              <span>Evaluating incident context & SOP guidelines...</span>
            </div>
          )}
        </div>

        {/* Voice Dictation Notification Banner */}
        {isListening && (
          <div className="bg-red-950/80 border-t border-red-800 px-4 py-1.5 text-xs text-red-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>{getTranslation(lang, 'voiceListening', 'Listening to your speech... Speak now')}</span>
            </span>
            <button
              onClick={handleToggleVoiceDictation}
              className="text-[11px] underline text-red-300 hover:text-white"
            >
              Stop
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
                ? 'bg-red-600 text-white border-red-500 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-amber-400" />}
          </button>

          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={getTranslation(lang, 'copilotPrompt', 'Ask about shelters, boats, or road status...')}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          <button
            onClick={() => handleSend()}
            disabled={loading || !inputQuery.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
