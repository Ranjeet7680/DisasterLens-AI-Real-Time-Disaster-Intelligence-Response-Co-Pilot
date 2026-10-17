'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { AlertTicker } from '../components/AlertTicker';
import { IncidentMap } from '../components/IncidentMap';
import { IncidentTable } from '../components/IncidentTable';
import { RiskCard } from '../components/RiskCard';
import { AgentActivity } from '../components/AgentActivity';
import { AlertPanel } from '../components/AlertPanel';
import { LiveWeatherWidget } from '../components/LiveWeatherWidget';
import { DecisionModal } from '../components/DecisionModal';
import { IncidentReportModal } from '../components/IncidentReportModal';
import { SimulatorDrawer } from '../components/SimulatorDrawer';
import { ExportReportModal } from '../components/ExportReportModal';

import {
  fetchIncidents,
  fetchIncidentDetail,
  fetchAlerts,
  fetchResources,
  fetchMetrics,
  triggerAnalysis,
  WS_BASE
} from '../lib/api';
import {
  Incident,
  IncidentDetail,
  Alert,
  ResourceItem,
  DashboardMetrics,
  RiskAssessment
} from '../lib/types';
import { playEmergencyAlertSound } from '../lib/sound';
import { ShieldAlert, AlertTriangle, CheckCircle, Activity, Radio, Users, Cpu, FileCheck, FileText } from 'lucide-react';

export default function CommandDashboard() {
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  // State
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [incidentDetail, setIncidentDetail] = useState<IncidentDetail | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Modals
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Load primary data
  const loadData = useCallback(async () => {
    try {
      const [incList, altList, resList, mtrx] = await Promise.all([
        fetchIncidents(),
        fetchAlerts(),
        fetchResources(),
        fetchMetrics()
      ]);
      setIncidents(incList);
      setAlerts(altList);
      setResources(resList);
      setMetrics(mtrx);

      // Auto select first incident if none selected
      if (!selectedIncident && incList.length > 0) {
        setSelectedIncident(incList[0]);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }, [selectedIncident]);

  // Load selected incident details
  useEffect(() => {
    if (selectedIncident) {
      fetchIncidentDetail(selectedIncident.incident_id)
        .then((detail) => setIncidentDetail(detail))
        .catch((err) => console.error(err));
    }
  }, [selectedIncident]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // WebSocket Real-Time Connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(`${WS_BASE}/ws/incidents`);
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          loadData();
          if (payload.type === 'incident_created' || payload.type === 'incident_analyzed') {
            const isCrit = payload.data?.severity === 'critical' || payload.data?.risk_assessment?.severity_band === 'CRITICAL';
            playEmergencyAlertSound(isCrit);
          }
          if (payload.type === 'incident_analyzed' && payload.data?.incident?.incident_id) {
            fetchIncidentDetail(payload.data.incident.incident_id).then((d) => setIncidentDetail(d));
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };
    } catch (e) {
      console.warn('WS fallback to interval polling:', e);
    }

    const interval = setInterval(() => {
      loadData();
    }, 8000);

    return () => {
      if (ws) ws.close();
      clearInterval(interval);
    };
  }, [loadData]);

  const handleReanalyzeCurrent = async () => {
    if (!selectedIncident) return;
    setIsAnalyzing(true);
    try {
      await triggerAnalysis(selectedIncident.incident_id);
      await loadData();
      const detail = await fetchIncidentDetail(selectedIncident.incident_id);
      setIncidentDetail(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans tactical-grid">
      <Header
        lang={lang}
        setLang={setLang}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        activeAlertCount={metrics?.active_alerts ?? 0}
      />

      {/* Emergency Bulletin Marquee Ticker */}
      <AlertTicker
        alerts={alerts}
        lang={lang}
        onSelectAlert={(alt) => {
          const found = incidents.find((i) => i.incident_id === alt.incident_id);
          if (found) setSelectedIncident(found);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Top Tactical Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl backdrop-blur-md shadow-lg">
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
              {lang === 'en' ? 'Active Incidents' : 'सक्रिय घटनाएं'}
            </span>
            <div className="text-xl font-black text-white">{metrics?.total_active_incidents ?? 0}</div>
          </div>

          <div className="bg-slate-900/90 border border-red-900/70 p-3 rounded-xl bg-gradient-to-br from-slate-900 to-red-950/30 backdrop-blur-md shadow-lg">
            <span className="text-[11px] font-semibold text-red-400 block mb-0.5">
              {lang === 'en' ? 'Critical Priority' : 'गंभीर स्थिति'}
            </span>
            <div className="text-xl font-black text-red-400">{metrics?.critical_incidents ?? 0}</div>
          </div>

          <div className="bg-slate-900/90 border border-orange-900/70 p-3 rounded-xl bg-gradient-to-br from-slate-900 to-orange-950/30 backdrop-blur-md shadow-lg">
            <span className="text-[11px] font-semibold text-orange-400 block mb-0.5">
              {lang === 'en' ? 'High Urgency' : 'उच्च तात्कालिकता'}
            </span>
            <div className="text-xl font-black text-orange-400">{metrics?.high_incidents ?? 0}</div>
          </div>

          <div className="bg-slate-900/90 border border-amber-900/70 p-3 rounded-xl bg-gradient-to-br from-slate-900 to-amber-950/30 backdrop-blur-md shadow-lg">
            <span className="text-[11px] font-semibold text-amber-400 block mb-0.5">
              {lang === 'en' ? 'Safety Overrides' : 'सुरक्षा नियम सक्रिय'}
            </span>
            <div className="text-xl font-black text-amber-300">{metrics?.safety_overrides_triggered ?? 0}</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl backdrop-blur-md shadow-lg">
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
              {lang === 'en' ? 'Pending Approvals' : 'अनुमोदन लंबित'}
            </span>
            <div className="text-xl font-black text-sky-400">{metrics?.pending_approvals ?? 0}</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl backdrop-blur-md shadow-lg">
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
              {lang === 'en' ? 'Resource Deployed' : 'संसाधन परिनियोजन'}
            </span>
            <div className="text-xl font-black text-emerald-400">
              {metrics?.resource_capacity?.deployed_pct ?? 0}%
            </div>
          </div>
        </div>

        {/* Main Grid: Map (Left) & Incident Queue / Alerts (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Map (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>{lang === 'en' ? 'Geospatial Situational Awareness' : 'भू-स्थानिक स्थितिजन्य मानचित्र'}</span>
              </h2>
              <span className="text-xs text-slate-400">
                {lang === 'en' ? 'Ranchi & Subarnarekha River Basin' : 'राँची एवं सुवर्णरेखा बेसिन'}
              </span>
            </div>

            <IncidentMap
              incidents={incidents}
              resources={resources}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              lang={lang}
            />

            {/* Live Weather Widget below Map */}
            {selectedIncident && (
              <LiveWeatherWidget
                latitude={selectedIncident.location.latitude}
                longitude={selectedIncident.location.longitude}
                regionName={selectedIncident.location.region || selectedIncident.location.address}
                lang={lang}
              />
            )}
          </div>

          {/* Right: Incidents Queue & Alerts (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="h-[280px]">
              <IncidentTable
                incidents={incidents}
                selectedIncident={selectedIncident}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
                lang={lang}
              />
            </div>

            <div className="h-[280px]">
              <AlertPanel
                alerts={alerts}
                onRefresh={loadData}
                lang={lang}
              />
            </div>
          </div>
        </div>

        {/* Selected Incident Deep Inspection & Decision Actions */}
        {selectedIncident && (
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-base font-bold text-amber-400">
                    {selectedIncident.incident_id}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-xs uppercase font-semibold">
                    {selectedIncident.hazard_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400">
                    • {selectedIncident.location.region || selectedIncident.location.address}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-snug">
                  {selectedIncident.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'en' ? 'SitRep' : 'रिपोर्ट'}</span>
                </button>

                <button
                  onClick={() => setIsDecisionModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 flex items-center gap-2 transition-all active:scale-95"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>
                    {lang === 'en' ? 'Review & Approve Recommendations' : 'सिफारिशों की समीक्षा व अनुमोदन करें'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 text-white text-[10px]">
                    {incidentDetail?.recommendations?.length || 0}
                  </span>
                </button>
              </div>
            </div>

            {/* Split: Explainable Risk on Left, Multi-Agent Pipeline on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5">
                <RiskCard
                  assessment={incidentDetail?.risk_assessment}
                  lang={lang}
                />
              </div>

              <div className="lg:col-span-7">
                <AgentActivity
                  agentRuns={incidentDetail?.agent_runs || []}
                  summaryEn={incidentDetail?.risk_assessment ? (incidentDetail as any).summary_text_en : undefined}
                  summaryHi={incidentDetail?.risk_assessment ? (incidentDetail as any).summary_text_hi : undefined}
                  lang={lang}
                  onReanalyze={handleReanalyzeCurrent}
                  isAnalyzing={isAnalyzing}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Decision Modal */}
      {selectedIncident && (
        <DecisionModal
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
          recommendations={incidentDetail?.recommendations || []}
          incidentId={selectedIncident.incident_id}
          onRefresh={loadData}
          lang={lang}
        />
      )}

      {/* Incident Intake Modal */}
      <IncidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitted={loadData}
        lang={lang}
      />

      {/* Simulator Drawer */}
      <SimulatorDrawer
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onScenarioTriggered={loadData}
        lang={lang}
      />

      {/* SitRep Export Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        detail={incidentDetail}
        lang={lang}
      />
    </div>
  );
}
