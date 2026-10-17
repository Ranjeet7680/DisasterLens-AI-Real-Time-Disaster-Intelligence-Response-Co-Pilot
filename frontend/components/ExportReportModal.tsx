'use client';

import React, { useState } from 'react';
import { IncidentDetail } from '../lib/types';
import { X, FileDown, Copy, Check, ShieldCheck, Printer } from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: IncidentDetail | null;
  lang: 'en' | 'hi';
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  detail,
  lang
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !detail) return null;

  const { incident, risk_assessment, recommendations, agent_runs } = detail;
  const now = new Date().toISOString();

  // Generate formal Markdown SitRep
  const reportMarkdown = `# EMERGENCY OPERATIONS CENTER (EOC) — SITUATION REPORT (SITREP)
**Platform**: DisasterLens AI Decision Co-Pilot
**Report Timestamp**: ${now}
**Classification**: OFFICIAL OPERATIONAL RECORD

---

## 1. INCIDENT PROFILE
- **Incident ID**: ${incident.incident_id}
- **Hazard Type**: ${incident.hazard_type.toUpperCase()}
- **Reported Severity**: ${incident.severity.toUpperCase()}
- **Location**: ${incident.location.address || 'Designated Coordinates'} (${incident.location.region || 'District Command'})
- **GPS Coordinates**: Latitude ${incident.location.latitude}, Longitude ${incident.location.longitude}
- **Source Channel**: ${incident.source}
- **Verification Status**: ${incident.verification_status}
- **Field Description**: ${incident.description}

---

## 2. EXPLAINABLE RISK ASSESSMENT
- **Composite Score**: ${risk_assessment?.composite_score ?? 'N/A'}/100
- **Priority Band**: ${risk_assessment?.severity_band ?? 'N/A'}
- **Mathematical Formula**: ${risk_assessment?.calculation_formula ?? 'R = 0.40H + 0.30E + 0.20V + 0.10D'}
- **Component Breakdown**:
  - Hazard Severity (H: 40%): ${risk_assessment?.hazard_score ?? 'N/A'}/100
  - Population Exposure (E: 30%): ${risk_assessment?.exposure_score ?? 'N/A'}/100
  - Community Vulnerability (V: 20%): ${risk_assessment?.vulnerability_score ?? 'N/A'}/100
  - Data Freshness & Reliability (D: 10%): ${risk_assessment?.data_freshness_score ?? 'N/A'}/100
- **Safety Override Triggered**: ${risk_assessment?.hard_safety_rule_triggered ? 'YES - EMERGENCY ESCALATION' : 'NO'}
- **Safety Policy Reason**: ${risk_assessment?.safety_override_reason || 'Standard calibrated formula applied'}

---

## 3. PROPOSED & APPROVED RESPONSE ACTIONS
${recommendations.map((rec, i) => `### Action ${i + 1}: ${rec.proposed_action}
- **Action Type**: ${rec.action_type}
- **Priority**: ${rec.priority}
- **Status**: ${rec.status.toUpperCase()}
- **Required Approvals**: ${rec.required_approvals}
- **Reviewer Signature**: ${rec.reviewed_by || 'Pending Review'} (${rec.reviewed_at || 'Pending'})
- **Supporting Evidence**:
${rec.evidence_references.map(e => `  * ${e}`).join('\n')}
- **Matched Resources**:
${rec.required_resources.map(r => `  * ${r.quantity}x ${r.resource_type} (${r.notes || ''})`).join('\n')}
`).join('\n')}

---

## 4. MULTI-AGENT EXECUTION AUDIT
${agent_runs.map(run => `- **${run.agent_name}**: Status=${run.status.toUpperCase()}, Latency=${run.latency_ms}ms, Timestamp=${run.created_at}`).join('\n')}

---
*Authorized by DisasterLens AI Command Intelligence System*
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SITREP_${incident.incident_id}_${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {lang === 'en' ? 'Official Incident Decision SitRep' : 'आधिकारिक आपदा स्थिति रिपोर्ट'}
              </h2>
              <p className="text-xs text-slate-400">
                {incident.incident_id} • {lang === 'en' ? 'Export formatted briefing for authorities' : 'प्रशासनिक उपयोग हेतु रिपोर्ट'}
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

        {/* SitRep Text Preview */}
        <div className="mt-4 flex-1 overflow-y-auto">
          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
            {reportMarkdown}
          </pre>
        </div>

        {/* Modal Actions */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            {lang === 'en' ? 'Close' : 'बंद करें'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (lang === 'en' ? 'Copied!' : 'कॉपी किया गया') : (lang === 'en' ? 'Copy Markdown' : 'कॉपी करें')}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/60 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Download .md SitRep' : 'रिपोर्ट डाउनलोड करें'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
