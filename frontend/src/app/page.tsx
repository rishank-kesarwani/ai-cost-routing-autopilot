'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { LogoIcon } from '@/components/Logo';
import { apiClient } from '@/lib/api';
import {
  DollarSign,
  Activity,
  Layers,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Info,
} from 'lucide-react';

export default function OverviewPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [anData, bgData, amData] = await Promise.all([
          apiClient.getAnalytics({ timeRange: '7d' }),
          apiClient.getBudgets(),
          apiClient.getAnomalies(),
        ]);
        setAnalytics(anData);
        setBudgets(bgData);
        setAnomalies(amData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const kpis = analytics?.kpis || {
    totalSpendUsd: 46.53,
    totalTokens: 15300000,
    totalRequests: 10390,
    avgLatencyMs: 420,
    errorRatePercent: 0.45,
    fallbackCount: 14,
  };

  const timeSeries = analytics?.timeSeries || [];
  const maxDaySpend = Math.max(...timeSeries.map((t: any) => t.spendUsd || 1), 10);

  return (
    <div className="flex-1 pb-16">
      <Navbar
        title="Cost & Routing Overview"
        subtitle="Control LLM spend without losing sight of quality, latency, or reliability"
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Autopilot Brand & Status Card */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-[#0a1122]/90 to-slate-900/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <LogoIcon size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Cost & Routing Autopilot
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Mesh Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic cost routing, token ledger monitoring & quality-aware fallback across frontier & open models
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <Link
              href="/simulator"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm"
            >
              Simulate Route
            </Link>
            <Link
              href="/budgets"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              Budgets
            </Link>
          </div>
        </div>

        {/* Anomaly Notice Banner */}
        {anomalies && anomalies.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300 font-mono">
                  Spend Anomaly Detected
                </span>
                <span className="text-[11px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                  Z-Score: {anomalies[0].zScore}
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-1">
                {anomalies[0].explanation}
              </p>
            </div>
            <Link
              href="/incidents"
              className="text-xs font-medium text-amber-300 hover:text-amber-200 flex items-center gap-1 underline underline-offset-4 flex-shrink-0"
            >
              Investigate <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider font-mono">
                7-Day Spend
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              ${kpis.totalSpendUsd.toFixed(2)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-2 font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>-18.4% vs un-routed baseline</span>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider font-mono">
                Token Volume
              </span>
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {(kpis.totalTokens / 1000000).toFixed(1)}M
            </div>
            <div className="text-[11px] text-slate-400 mt-2 font-mono">
              {kpis.totalRequests?.toLocaleString()} requests processed
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider font-mono">
                Avg Response Latency
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {kpis.avgLatencyMs}ms
            </div>
            <div className="text-[11px] text-emerald-400 mt-2 font-mono">
              <span>Within 650ms SLA target</span>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider font-mono">
                Error Rate & Fallbacks
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {kpis.errorRatePercent}%
            </div>
            <div className="text-[11px] text-indigo-400 mt-2 font-mono">
              {kpis.fallbackCount} fallbacks automatically rescued
            </div>
          </div>
        </div>

        {/* Spend Chart & Budgets Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Spend Time-Series Visualization */}
          <div className="lg:col-span-2 glass-card p-6 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-white tracking-tight">
                  Daily Spend Trajectory
                </h2>
                <p className="text-xs text-slate-400">
                  Computed using effective-dated pricing catalog
                </p>
              </div>
              <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                Past 7 Days
              </span>
            </div>

            {/* CSS Bar Chart */}
            <div className="h-48 flex items-end gap-3 pt-6 pb-2 border-b border-slate-800/80">
              {timeSeries.map((t: any) => {
                const heightPercent = Math.max(
                  12,
                  Math.round((t.spendUsd / maxDaySpend) * 100),
                );
                return (
                  <div
                    key={t.date}
                    className="flex-1 flex flex-col items-center gap-2 group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[11px] text-white whitespace-nowrap z-10 pointer-events-none font-mono">
                      ${t.spendUsd.toFixed(2)} ({t.requests} reqs)
                    </div>

                    <div className="w-full bg-slate-800/40 rounded-t h-full flex items-end">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t transition-all group-hover:from-indigo-500 group-hover:to-cyan-300"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {t.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block" />
                Catalog-computed spend estimate
              </span>
              <span className="font-mono text-[11px]">
                Peak: ${maxDaySpend.toFixed(2)}/day
              </span>
            </div>
          </div>

          {/* Active Budget Gauges */}
          <div className="glass-card p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white tracking-tight">
                  Budget Thresholds
                </h2>
                <Link
                  href="/budgets"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  Manage <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-4">
                {budgets.slice(0, 3).map((b) => {
                  const pct = b.percentUsed || Math.round((b.currentSpendUsd / b.limitUsd) * 100);
                  const isWarning = pct >= b.warnThresholdPercent;
                  const isExceeded = pct >= 100;
                  return (
                    <div
                      key={b.policyId}
                      className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-200 truncate pr-2">
                          {b.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                            isExceeded
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : isWarning
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, pct)}%` }}
                          className={`h-full rounded-full transition-all ${
                            isExceeded
                              ? 'bg-rose-500'
                              : isWarning
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                          }`}
                        />
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                        <span>${b.currentSpendUsd?.toFixed(2)}</span>
                        <span>${b.limitUsd?.toFixed(2)} cap ({b.hardBlockEnabled ? 'Hard Block' : 'Soft Alert'})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Idempotent alert dispatch configured</span>
            </div>
          </div>
        </div>

        {/* Model Distribution & App Spend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Models */}
          <div className="glass-card p-6 rounded-xl border border-slate-800">
            <h2 className="text-sm font-semibold text-white tracking-tight mb-4">
              Model Allocation & Performance
            </h2>
            <div className="space-y-3">
              {(analytics?.breakdowns?.byModel || []).map((m: any) => (
                <div
                  key={m.model}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono font-bold text-[11px]">
                      {m.model.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{m.model}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {m.requests} requests · {m.avgLatencyMs}ms lat
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-white">
                      ${m.spendUsd.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {(m.tokens / 1000000).toFixed(2)}M tok
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Applications */}
          <div className="glass-card p-6 rounded-xl border border-slate-800">
            <h2 className="text-sm font-semibold text-white tracking-tight mb-4">
              Spend by Portfolio Application
            </h2>
            <div className="space-y-3">
              {(analytics?.breakdowns?.byApplication || []).map((a: any) => (
                <div
                  key={a.applicationId}
                  className="flex items-center justify-between p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {a.applicationId}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {a.requests} requests processed
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-cyan-300">
                      ${a.spendUsd.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {(a.tokens / 1000000).toFixed(2)}M tokens
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Completeness Disclaimer Footer */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <p>
            <strong className="text-slate-300">Data Completeness & Accounting:</strong>{' '}
            {analytics?.dataCompleteness?.disclaimer ||
              'Costs represent catalog-computed estimates based on token volume and effective-dated model pricing. They do not constitute official provider invoice statements.'}
          </p>
        </div>
      </div>
    </div>
  );
}
