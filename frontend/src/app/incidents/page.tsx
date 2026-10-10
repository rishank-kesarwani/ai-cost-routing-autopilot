'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { apiClient } from '@/lib/api';
import {
  AlertTriangle,
  ScrollText,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileText,
  Copy,
} from 'lucide-react';

export default function IncidentsAndAuditPage() {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [anData, auData] = await Promise.all([
          apiClient.getAnomalies(),
          apiClient.getDecisionAudits(),
        ]);
        setAnomalies(anData);
        setAudits(auData);
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex-1 pb-16">
      <Navbar
        title="Incidents, Anomalies & Audit Trail"
        subtitle="Statistical spend anomaly detection, fallback activations and full decision audit logs"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Statistical Anomaly Alerts */}
        <div className="glass-card p-6 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Statistical Spend Outliers (Z-Score Rolling Baseline)
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Method: 14-day rolling mean &plusmn; &sigma;
            </span>
          </div>

          <div className="space-y-3">
            {anomalies.map((an, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                        an.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {an.severity} ANOMALY
                    </span>
                    <span className="font-semibold text-white font-mono">
                      {an.scope}
                    </span>
                  </div>
                  <p className="text-slate-300">{an.explanation}</p>
                </div>

                <div className="font-mono text-right flex-shrink-0">
                  <div className="text-sm font-bold text-rose-400">
                    ${an.actualSpendUsd}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Baseline: ${an.baselineMeanSpendUsd} (Z: {an.zScore})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decision Audit Trail */}
        <div className="glass-card p-6 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Immutable Decision Audit Trace
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Redacted for tenant privacy
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Audit ID</th>
                  <th className="py-3 px-4">Target Application</th>
                  <th className="py-3 px-4">Policy Applied</th>
                  <th className="py-3 px-4">Selected Model</th>
                  <th className="py-3 px-4">Est. Cost</th>
                  <th className="py-3 px-4">Quality Score</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {audits.map((au) => (
                  <tr
                    key={au.auditId}
                    onClick={() => setSelectedAudit(au)}
                    className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-indigo-300">
                      {au.auditId}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 font-sans">
                      {au.applicationId}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-sans">
                      {au.policyApplied?.policyName || 'Standard Policy'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {au.selectedRoute?.modelId || 'None'}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400">
                      ${au.selectedRoute?.estimatedCostUsd?.toFixed(4) || '0.00'}
                    </td>
                    <td className="py-3.5 px-4 text-cyan-400">
                      {au.selectedRoute?.qualityScore || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans text-indigo-400">
                      <span className="inline-flex items-center gap-1">
                        Trace <ArrowRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Audit Modal */}
        {selectedAudit && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Audit Record: {selectedAudit.auditId}
                  </h3>
                  <span className="text-xs font-mono text-indigo-300">
                    Correlation: {selectedAudit.correlationId}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedAudit(null)}
                  className="text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="font-semibold text-white mb-1">Winning Model</div>
                  <div className="text-slate-300 font-mono">
                    {selectedAudit.selectedRoute?.modelId} ({selectedAudit.selectedRoute?.provider}) · Est. Spend: ${selectedAudit.selectedRoute?.estimatedCostUsd}
                  </div>
                </div>

                <div className="font-semibold text-white">Candidate Evaluation Details:</div>
                <div className="space-y-2">
                  {selectedAudit.candidateEvaluations?.map((cand: any) => (
                    <div
                      key={cand.modelId}
                      className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <span className="font-bold text-white">{cand.modelId}</span>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                          {cand.explanation}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                          cand.status === 'SELECTED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {cand.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
