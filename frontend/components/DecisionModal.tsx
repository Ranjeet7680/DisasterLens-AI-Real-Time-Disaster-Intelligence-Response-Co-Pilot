'use client';

import React, { useState } from 'react';
import { Recommendation } from '../lib/types';
import { Check, X, Edit3, ShieldAlert, CheckCircle2, UserCheck, Package, BookOpen, Sparkles } from 'lucide-react';
import { reviewRecommendation } from '../lib/api';
import { playApprovalSuccessSound } from '../lib/sound';
import { SupportedLanguage } from '../lib/languages';

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: Recommendation[];
  incidentId: string;
  onRefresh: () => void;
  lang: SupportedLanguage;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({
  isOpen,
  onClose,
  recommendations,
  incidentId,
  onRefresh,
  lang
}) => {
  const [reviewerName, setReviewerName] = useState('EOC Incident Commander');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modifiedText, setModifiedText] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDecision = async (
    recId: string,
    decision: 'approved' | 'rejected' | 'modified',
    actionText?: string
  ) => {
    setLoadingId(recId);
    try {
      await reviewRecommendation(recId, decision, reviewerName, notes, actionText);
      if (decision === 'approved' || decision === 'modified') {
        playApprovalSuccessSound();
      }
      setEditingId(null);
      setNotes('');
      onRefresh();
    } catch (err) {
      console.error('Error reviewing recommendation:', err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-950 text-amber-400 border border-amber-800">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{lang === 'en' ? 'Human Approval & Resource Dispatch' : 'मानवीय अनुमोदन एवं संसाधन परिनियोजन'}</span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'en' ? `Incident ${incidentId} • Authorized EOC Operations Review` : `घटना ${incidentId} • अधिकृत समीक्षा`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reviewer Call Sign Banner */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{lang === 'en' ? 'Authorized Reviewer:' : 'अधिकृत समीक्षक:'}</span>
          </div>
          <input
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-white font-mono text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Recommendations List */}
        <div className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {recommendations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              {lang === 'en' ? 'No recommendations generated yet. Run the AI workflow first.' : 'कोई सिफ़ारिश मौजूद नहीं है।'}
            </div>
          ) : (
            recommendations.map((rec) => {
              const isApproved = rec.status === 'approved';
              const isRejected = rec.status === 'rejected';
              const isModified = rec.status === 'modified';
              const isPending = rec.status === 'pending_review';

              return (
                <div
                  key={rec.id}
                  className={`p-4 rounded-xl border text-xs transition-all ${
                    isApproved
                      ? 'bg-emerald-950/25 border-emerald-700/80 shadow-lg shadow-emerald-950/30'
                      : isRejected
                      ? 'bg-red-950/20 border-red-800/80 opacity-70'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono font-bold text-slate-300">{rec.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                      rec.priority === 'IMMEDIATE'
                        ? 'bg-red-900/80 text-red-200 border border-red-700'
                        : rec.priority === 'HIGH'
                        ? 'bg-orange-900/80 text-orange-200 border border-orange-700'
                        : 'bg-blue-900/80 text-blue-200 border border-blue-700'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>

                  {/* Proposed Action */}
                  {editingId === rec.id ? (
                    <div className="mb-3">
                      <textarea
                        value={modifiedText}
                        onChange={(e) => setModifiedText(e.target.value)}
                        className="w-full bg-slate-900 border border-blue-600 rounded p-2 text-slate-200 text-xs focus:outline-none"
                        rows={2}
                      />
                    </div>
                  ) : (
                    <p className="text-slate-100 font-medium text-sm leading-snug mb-3">
                      {rec.proposed_action}
                    </p>
                  )}

                  {/* Required Resources & Evidence References */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-semibold flex items-center gap-1 mb-1">
                        <Package className="w-3 h-3 text-amber-400" />
                        <span>{lang === 'en' ? 'Matched Resources:' : 'संसाधन:'}</span>
                      </span>
                      <ul className="text-slate-300 space-y-0.5">
                        {rec.required_resources.map((r, i) => (
                          <li key={i}>
                            • {r.quantity}x {r.resource_type.replace('_', ' ')} ({r.notes || ''})
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold flex items-center gap-1 mb-1">
                        <BookOpen className="w-3 h-3 text-blue-400" />
                        <span>{lang === 'en' ? 'Justifying Evidence:' : 'समर्थक साक्ष्य:'}</span>
                      </span>
                      <ul className="text-slate-300 space-y-0.5">
                        {rec.evidence_references.map((e, i) => (
                          <li key={i} className="truncate">• {e}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Required sign-off */}
                  <div className="text-[11px] text-amber-300/80 font-mono mb-3">
                    ⚠ {rec.required_approvals}
                  </div>

                  {/* Status & Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Status: <strong className={`uppercase ${isApproved ? 'text-emerald-400' : isRejected ? 'text-red-400' : 'text-amber-400'}`}>{rec.status}</strong>
                    </span>

                    {isPending && (
                      <div className="flex items-center gap-2">
                        {editingId === rec.id ? (
                          <button
                            onClick={() => handleDecision(rec.id, 'modified', modifiedText)}
                            disabled={loadingId === rec.id}
                            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
                          >
                            Save & Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(rec.id);
                              setModifiedText(rec.proposed_action);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3 h-3 text-blue-400" />
                            <span>{lang === 'en' ? 'Edit' : 'संपादित करें'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDecision(rec.id, 'rejected')}
                          disabled={loadingId === rec.id}
                          className="px-2.5 py-1 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <X className="w-3 h-3" />
                          <span>{lang === 'en' ? 'Reject' : 'अस्वीकार'}</span>
                        </button>

                        <button
                          onClick={() => handleDecision(rec.id, 'approved')}
                          disabled={loadingId === rec.id}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-lg shadow-emerald-950/60 transition-colors active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{lang === 'en' ? 'Approve & Dispatch' : 'स्वीकृत करें'}</span>
                        </button>
                      </div>
                    )}

                    {!isPending && (
                      <span className="text-xs text-slate-400">
                        Reviewed by: <strong className="text-white">{rec.reviewed_by}</strong> at {new Date(rec.reviewed_at || '').toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            {lang === 'en' ? 'Close Panel' : 'बंद करें'}
          </button>
        </div>
      </div>
    </div>
  );
};
