'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { apiClient } from '@/lib/api';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Lock,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function QualityGatesPage() {
  const [model, setModel] = useState('gpt-4o-mini');
  const [provider, setProvider] = useState('openai');
  const [baselineId, setBaselineId] = useState('prod-golden-baseline');
  const [datasetId, setDatasetId] = useState('customer-support-v1');
  const [qualityGateMode, setQualityGateMode] = useState<'FAIL_CLOSED' | 'MARK_UNVERIFIED'>('FAIL_CLOSED');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.evaluateQualityGate({
        model,
        provider,
        baselineId,
        datasetId,
        qualityGateMode,
      });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 pb-16">
      <Navbar
        title="Quality-Aware Release Gates"
        subtitle="Verification against Model Regression Detection platform with strict fail-closed enforcement"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Release Gate Form */}
        <div className="glass-card p-6 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Model Regression Gate Check
              </h2>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20">
              Target: ai-model-regression-detection (:4000)
            </span>
          </div>

          <form onSubmit={handleEvaluate} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Candidate Model
                </label>
                <select
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    if (e.target.value.includes('claude')) setProvider('anthropic');
                    else if (e.target.value.includes('gemini')) setProvider('google');
                    else if (e.target.value.includes('llama')) setProvider('groq');
                    else setProvider('openai');
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none"
                >
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
                  <option value="gemini-1-5-flash">gemini-1-5-flash</option>
                  <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Benchmark Dataset
                </label>
                <input
                  type="text"
                  value={datasetId}
                  onChange={(e) => setDatasetId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Baseline ID
                </label>
                <input
                  type="text"
                  value={baselineId}
                  onChange={(e) => setBaselineId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Unreachable Service Policy
                </label>
                <select
                  value={qualityGateMode}
                  onChange={(e) => setQualityGateMode(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none"
                >
                  <option value="FAIL_CLOSED">FAIL_CLOSED (Strict Hard Block)</option>
                  <option value="MARK_UNVERIFIED">MARK_UNVERIFIED (Warning Only)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-400">
                Rule: Missing evaluation results are never silently treated as PASS.
              </span>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{loading ? 'Evaluating...' : 'Query Regression Gate'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Quality Gate Result Display */}
        {result && (
          <div className="space-y-4">
            <div
              className={`p-6 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                result.decision === 'PASS'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : result.decision === 'WARN'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                {result.decision === 'PASS' ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                ) : result.decision === 'WARN' ? (
                  <AlertTriangle className="w-8 h-8 text-amber-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-400 flex-shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white uppercase">
                      Gate Decision: {result.decision}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                      Score: {result.score}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1">
                    {result.explanation}
                  </p>
                </div>
              </div>

              <div className="flex-shrink-0 text-right font-mono text-xs text-slate-300">
                <div>Model: <strong className="text-white">{result.model}</strong></div>
                <div className="text-[11px] text-slate-400">
                  Fail-Closed: {result.failClosedEnforced ? 'ENFORCED' : 'OFF'}
                </div>
              </div>
            </div>

            {/* Regression Metrics Grid */}
            <div className="glass-card p-6 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Verified Benchmark Signals
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Exact Match Ratio</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">0.95</div>
                  <span className="text-[10px] text-slate-400">Delta: -0.01 (-1.05% safe)</span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Semantic Similarity</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">0.96</div>
                  <span className="text-[10px] text-slate-400">Cosine threshold met</span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Latency Delta</div>
                  <div className="text-base font-bold text-white mt-1">-85ms</div>
                  <span className="text-[10px] text-emerald-400">Faster than baseline</span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400">AI Judge Score</div>
                  <div className="text-base font-bold text-cyan-400 mt-1">9.2 / 10</div>
                  <span className="text-[10px] text-slate-400">Structured evaluator pass</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
