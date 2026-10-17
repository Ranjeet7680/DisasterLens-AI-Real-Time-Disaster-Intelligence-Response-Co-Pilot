'use client';

import React, { useState } from 'react';
import { X, Send, AlertTriangle, MapPin, Radio, ShieldCheck, Mic, MicOff } from 'lucide-react';
import { submitIncident } from '../lib/api';
import { SupportedLanguage, getTranslation } from '../lib/languages';
import { startVoiceRecognition, stopVoiceRecognition } from '../lib/voice';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  lang: SupportedLanguage;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
  onSubmitted,
  lang
}) => {
  const [hazardType, setHazardType] = useState('flood');
  const [severity, setSeverity] = useState('medium');
  const [source, setSource] = useState('operator');
  const [lat, setLat] = useState('23.3441');
  const [lon, setLon] = useState('85.3096');
  const [region, setRegion] = useState('Ranchi Central Catchment');
  const [address, setAddress] = useState('Sector 4 Lowlands, Main Road');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const presets = [
    { label: 'Subarnarekha Riverfront', lat: 23.3620, lon: 85.3120, reg: 'Subarnarekha Basin' },
    { label: 'Harmu Bridge Crossing', lat: 23.3325, lon: 85.3175, reg: 'Harmu Catchment' },
    { label: 'Dhurwa Dam Sluice', lat: 23.2980, lon: 85.2780, reg: 'Dhurwa Basin' },
    { label: 'RIMS Medical Center', lat: 23.3735, lon: 85.3415, reg: 'Ranchi East' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError(lang === 'en' ? 'Please provide an incident description.' : 'कृपया घटना का विवरण दर्ज करें।');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await submitIncident({
        hazard_type: hazardType,
        severity,
        source,
        location: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          address,
          region
        },
        description
      });
      onSubmitted();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-950 text-blue-400 border border-blue-800">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {lang === 'en' ? 'Ingest New Disaster Report' : 'नयी आपदा घटना दर्ज करें'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'en' ? 'Triggers multi-agent hazard & risk scoring workflow' : 'मल्टी-एजेंट विश्लेषण स्वचालित रूप से शुरू होगा'}
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

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-200 text-xs">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
          {/* Preset Location Quick Pick */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'en' ? 'Quick Location Presets:' : 'त्वरित स्थान चयन:'}</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setLat(p.lat.toString());
                    setLon(p.lon.toString());
                    setRegion(p.reg);
                    setAddress(p.label);
                  }}
                  className="px-2 py-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-300 transition-colors"
                >
                  <span className="font-semibold text-white block">{p.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {p.lat}, {p.lon}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Hazard Type & Reported Severity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {lang === 'en' ? 'Hazard Classification' : 'आपदा प्रकार'}
              </label>
              <select
                value={hazardType}
                onChange={(e) => setHazardType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="flood">Flood (River/Urban)</option>
                <option value="flash_flood">Flash Flood (Sudden Surge)</option>
                <option value="extreme_weather">Extreme Weather / Gale</option>
                <option value="cyclone">Cyclone / Storm Surge</option>
                <option value="landslide">Landslide / Debris Flow</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {lang === 'en' ? 'Reported Severity' : 'प्रारंभिक गंभीरता'}
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="low">Low (Advisory)</option>
                <option value="medium">Medium (Warning)</option>
                <option value="high">High (Severe Alert)</option>
                <option value="critical">Critical (Life Danger)</option>
              </select>
            </div>
          </div>

          {/* Source & Region */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {lang === 'en' ? 'Ingestion Channel / Source' : 'रिपोर्ट स्रोत'}
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="operator">EOC Operator (0.90 Credibility)</option>
                <option value="sensor_stream">Automated Sensor Grid (0.95 Credibility)</option>
                <option value="citizen_report">Citizen SOS Report (0.65 Credibility)</option>
                <option value="weather_alert">Official IMD Weather Alert (0.92 Credibility)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {lang === 'en' ? 'Administrative Region' : 'प्रशासनिक क्षेत्र'}
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div>
              <label className="block text-slate-400 font-sans font-semibold mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-sans font-semibold mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description with Voice Dictation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-400 font-semibold">
                {lang === 'en' ? 'Incident Description & Indicators' : 'घटना विवरण एवं संकेत'}
              </label>

              <button
                type="button"
                onClick={() => {
                  if (isListening) {
                    stopVoiceRecognition();
                    setIsListening(false);
                  } else {
                    setIsListening(true);
                    startVoiceRecognition(
                      lang,
                      (transcript) => {
                        setDescription((prev) => (prev ? prev + ' ' + transcript : transcript));
                      },
                      (err) => {
                        console.warn(err);
                        setIsListening(false);
                      },
                      () => setIsListening(false)
                    );
                  }
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
                }`}
              >
                {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                <span>{isListening ? (lang === 'hi' ? 'बोलना बंद करें' : 'Stop Listening') : (lang === 'hi' ? 'बोलकर दर्ज करें' : 'Dictate SOS')}</span>
              </button>
            </div>

            {isListening && (
              <div className="p-2 mb-2 rounded bg-red-950/60 border border-red-800 text-[11px] text-red-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>Listening in {lang}... Speak your emergency report clearly.</span>
              </div>
            )}

            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={lang === 'en' ? 'Describe observed inundation, trapped persons, rising water rate, or infrastructure damage...' : 'घटना का विवरण दर्ज करें या बोलकर बताएं...'}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? (lang === 'en' ? 'Processing Agents...' : 'प्रक्रिया जारी...') : (lang === 'en' ? 'Submit & Analyze Incident' : 'रिपोर्ट जमा करें और विश्लेषण करें')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
