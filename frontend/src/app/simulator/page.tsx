'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { apiClient } from '@/lib/api';
import {
  Cpu,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';

export default function RouteSimulatorPage() {
  // Scenario Inputs
  const [applicationId, setApplicationId] = useState('ai-pr-review-platform');
  const [featureId, setFeatureId] = useState('code-analysis');
  const [promptTokens, setPromptTokens] = useState('1500');
  const [expectedCompletionTokens, setExpectedCompletionTokens] = useState('600');
  const [latencyTargetMs, setLatencyTargetMs] = useState('650');
  const [maxCostPer1kTokensUsd, setMaxCostPer1kTokensUsd] = useState('0.006');
  const [qualityThreshold, setQualityThreshold] = useState('0.85');

  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.simulateRoute({
        tenantId: 'tenant-acme',
        applicationId,
        featureId,
        promptTokens: parseInt(promptTokens, 10),
        expectedCompletionTokens: parseInt(expectedCompletionTokens, 10),
        latencyTargetMs: parseInt(latencyTargetMs, 10),
        maxCostPer1kTokensUsd: parseFloat(maxCostPer1kTokensUsd),
        qualityThreshold: parseFloat(qualityThreshold),
      });
      setSimulationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 pb-16">
      <Navbar
        title="Routing Policy Simulator"
        subtitle="Dry-run simulator evaluating candidate models against cost, latency, provider and quality gates"
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Scenario Input Card */}
        <div className="glass-card p-6 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Scenario Parameters
            </h2>
          </div>

          <form onSubmit={handleSimulate} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Target Application
                </label>
                <select
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none"
                >
                  <option value="ai-pr-review-platform">ai-pr-review-platform</option>
                  <option value="ai-movie-matcher">ai-movie-matcher</option>
                  <option value="ai-travel-planner">ai-travel-planner</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Feature / Endpoint
                </label>
                <input
                  type="text"
                  value={featureId}
                  onChange={(e) => setFeatureId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Prompt Token Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={promptTokens}
                  onChange={(e) => setPromptTokens(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Expected Completion Tokens
                </label>
                <input
                  type="number"
                  min="1"
                  value={expectedCompletionTokens}
                  onChange={(e) => setExpectedCompletionTokens(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Latency SLA Target (ms)
                </label>
                <input
                  type="number"
                  step="50"
                  value={latencyTargetMs}
                  onChange={(e) => setLatencyTargetMs(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Max Cost Cap ($ / 1k Tokens)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={maxCostPer1kTokensUsd}
                  onChange={(e) => setMaxCostPer1kTokensUsd(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Quality Gate Minimum (0.00 - 1.00)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={qualityThreshold}
                  onChange={(e) => setQualityThreshold(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{loading ? 'Evaluating Candidates...' : 'Run Simulation'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Simulation Output Tree */}
        {simulationResult && (
          <div className="space-y-6">
            {/* Winner Route Banner */}
            {simulationResult.selectedRoute ? (
              <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/40 glow-indigo space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                        Winning Candidate Selected
                      </span>
                      <h3 className="text-base font-bold text-white">
                        {simulationResult.selectedRoute.displayName || simulationResult.selectedRoute.modelId}
                      </h3>
                    </div>
                  </div>

                  <span className="text-xs font-mono px-3 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Decision: ROUTED
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  {simulationResult.explanation}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Est. Cost:</span>
                    <strong className="text-emerald-400">
                      ${simulationResult.selectedRoute.estimatedCostUsd?.toFixed(5)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Est. Latency:</span>
                    <strong className="text-white">
                      {simulationResult.selectedRoute.estimatedLatencyMs}ms
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Quality Score:</span>
                    <strong className="text-cyan-400">
                      {simulationResult.selectedRoute.qualityScore}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Catalog:</span>
                    <strong className="text-slate-300">
                      {simulationResult.selectedRoute.catalogVersion}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs">
                <div className="font-semibold text-rose-300 text-sm mb-1 flex items-center gap-2">
                  <XCircle className="w-5 h-5" /> All Candidates Rejected
                </div>
                <p>{simulationResult.explanation}</p>
              </div>
            )}

            {/* Candidate Evaluation Table & Rationale */}
            <div className="glass-card p-6 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Candidate Evaluation Breakdown & Explanations
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {simulationResult.candidateEvaluations?.length || 0} Models Evaluated
                </span>
              </div>

              <div className="space-y-3">
                {simulationResult.candidateEvaluations?.map((cand: any) => {
                  const isSelected = cand.status === 'SELECTED';
                  const isRejected = cand.status === 'REJECTED';
                  return (
                    <div
                      key={cand.modelId}
                      className={`p-4 rounded-xl border transition-all text-xs ${
                        isSelected
                          ? 'bg-emerald-500/5 border-emerald-500/30'
                          : isRejected
                            ? 'bg-slate-900/40 border-slate-800/80 opacity-75'
                            : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono text-sm">
                            {cand.modelId}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800">
                            {cand.provider}
                          </span>
                        </div>

                        <div>
                          {isSelected ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                              SELECTED ROUTE
                            </span>
                          ) : cand.rejectionReason ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] font-semibold border border-rose-500/30">
                              {cand.rejectionReason}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                              ELIGIBLE STANDBY
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-300 mb-3 text-[11px]">
                        {cand.explanation}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                        <span>
                          Spend: <strong className="text-slate-200">${cand.estimatedCostUsd?.toFixed(5)}</strong>
                        </span>
                        <span>
                          Latency: <strong className="text-slate-200">{cand.medianLatencyMs}ms</strong>
                        </span>
                        <span>
                          Quality: <strong className="text-slate-200">{cand.qualityScore}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fallback Chain Preview */}
            {simulationResult.fallbackChain && simulationResult.fallbackChain.length > 0 && (
              <div className="glass-card p-5 rounded-xl border border-slate-800">
                <div className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Configured Fallback Rescue Order</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  {simulationResult.fallbackChain.map((f: any, idx: number) => (
                    <React.Fragment key={f.modelId}>
                      <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-amber-300">
                        #{idx + 1} {f.modelId} ({f.provider})
                      </span>
                      {idx < simulationResult.fallbackChain.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
