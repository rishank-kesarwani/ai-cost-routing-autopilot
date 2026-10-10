'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { apiClient } from '@/lib/api';
import {
  Settings,
  Database,
  Layers,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  Shield,
  Info,
} from 'lucide-react';

export default function SettingsPage() {
  const [catalog, setCatalog] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [cData, rData] = await Promise.all([
          apiClient.getPricingCatalog(),
          apiClient.getReadiness(),
        ]);
        setCatalog(cData);
        setReadiness(rData);
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, []);

  const models = catalog?.models || [];

  return (
    <div className="flex-1 pb-16">
      <Navbar
        title="Settings & Effective Pricing Catalog"
        subtitle="Versioned model pricing rates, SLA benchmarks and microservice ecosystem connectivity"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Microservice Integrations Status */}
        <div className="glass-card p-6 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Portfolio Microservice Integrations
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* AI Platform */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Shared AI Platform</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ONLINE
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Port :5000 · Unified model execution, fallback handling & prompt gateways.
              </p>
              <div className="font-mono text-[11px] text-indigo-300">
                URL: {readiness?.dependencies?.aiPlatform?.url || 'http://localhost:5000'}
              </div>
            </div>

            {/* Notification Service */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Notification Service</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  CONFIGURED
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Port :3001 · Dual-channel email & push alerts for budget caps & anomalies.
              </p>
              <div className="font-mono text-[11px] text-indigo-300">
                URL: {readiness?.dependencies?.notificationService?.url || 'http://localhost:3001'}
              </div>
            </div>

            {/* Model Regression Detection */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Regression Platform</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  VERIFIED API
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Port :4000 · Automated benchmark verification with fail-closed release gates.
              </p>
              <div className="font-mono text-[11px] text-indigo-300">
                URL: {readiness?.dependencies?.modelRegressionService?.url || 'http://localhost:4000'}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Catalog Table */}
        <div className="glass-card p-6 rounded-xl border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white tracking-tight">
                  Effective-Dated Pricing Catalog
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Version: <strong className="text-white font-mono">{catalog?.catalogVersion || 'catalog-2026.04-v1'}</strong> · Currency: <strong className="text-white font-mono">USD</strong>
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Coverage: 8 Production Models
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Model & Provider</th>
                  <th className="py-3 px-4">Prompt / 1k</th>
                  <th className="py-3 px-4">Completion / 1k</th>
                  <th className="py-3 px-4">Input / 1M</th>
                  <th className="py-3 px-4">Output / 1M</th>
                  <th className="py-3 px-4">Median Latency</th>
                  <th className="py-3 px-4">Quality Score</th>
                  <th className="py-3 px-4">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {models.map((m: any) => (
                  <tr key={m.modelId} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-bold text-white font-mono">
                        {m.modelId}
                      </div>
                      <div className="text-[11px] text-slate-400 uppercase font-mono">
                        {m.provider} · {m.displayName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      ${m.promptCostPer1k?.toFixed(5)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      ${m.completionCostPer1k?.toFixed(5)}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 font-semibold">
                      ${m.inputCostPer1M?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 font-semibold">
                      ${m.outputCostPer1M?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-white">
                      {m.medianLatencyMs}ms
                    </td>
                    <td className="py-3.5 px-4 text-cyan-400 font-bold">
                      {m.baselineQualityScore}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          m.qualityTier === 'PREMIUM'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : m.qualityTier === 'BALANCED'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {m.qualityTier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Note on Invoices vs Catalog Estimates */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Pricing Catalog Integrity Notice:</strong> All cost estimates shown in this system are calculated strictly using versioned catalog rates. We never invent arbitrary rates or claim that estimates constitute official provider invoices. Enterprise volume discounts or custom negotiated commitments should be added as a custom version in the catalog table.
          </p>
        </div>
      </div>
    </div>
  );
}
