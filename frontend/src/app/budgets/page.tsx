'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { apiClient } from '@/lib/api';
import {
  Wallet,
  Plus,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Bell,
  X,
  TrendingUp,
} from 'lucide-react';

export default function BudgetPoliciesPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [applicationId, setApplicationId] = useState('ai-pr-review-platform');
  const [period, setPeriod] = useState<'MONTHLY' | 'DAILY'>('MONTHLY');
  const [limitUsd, setLimitUsd] = useState('100');
  const [warnThresholdPercent, setWarnThresholdPercent] = useState('80');
  const [hardBlockEnabled, setHardBlockEnabled] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [bData, aData] = await Promise.all([
          apiClient.getBudgets(),
          apiClient.getBudgetAlerts(),
        ]);
        setBudgets(bData);
        setAlerts(aData);
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newBudget = {
      policyId: `bdg_${Date.now().toString().slice(-6)}`,
      name,
      tenantId: 'tenant-acme',
      applicationId,
      period,
      limitUsd: parseFloat(limitUsd),
      warnThresholdPercent: parseInt(warnThresholdPercent, 10),
      hardBlockEnabled,
      currentSpendUsd: 0,
      percentUsed: 0,
      status: 'ACTIVE',
      description: 'Custom created budget policy',
    };
    setBudgets([newBudget, ...budgets]);
    setModalOpen(false);
  };

  return (
    <div className="flex-1 pb-16">
      <Navbar
        title="Budget Policies & Quota Enforcement"
        subtitle="Configure daily, monthly, and feature-scoped budgets with hard block protection"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header action */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Configured Budget Caps
            </h2>
            <p className="text-xs text-slate-400">
              Active enforcement across tenant workspaces and portfolio applications
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Create Budget Policy</span>
          </button>
        </div>

        {/* Budgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => {
            const pct = b.percentUsed || Math.round((b.currentSpendUsd / b.limitUsd) * 100);
            const isWarning = pct >= b.warnThresholdPercent;
            const isExceeded = pct >= 100;
            return (
              <div
                key={b.policyId}
                className="glass-card p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {b.period}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        isExceeded
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : isWarning
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {pct}% Used
                    </span>
                  </div>

                  <h3 className="font-semibold text-white text-sm tracking-tight">
                    {b.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    App: <span className="font-mono text-slate-300">{b.applicationId}</span>
                    {b.featureId && (
                      <> · Feature: <span className="font-mono text-slate-300">{b.featureId}</span></>
                    )}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, pct)}%` }}
                      className={`h-full rounded-full transition-all ${
                        isExceeded
                          ? 'bg-rose-500'
                          : isWarning
                            ? 'bg-amber-500'
                            : 'bg-indigo-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>${b.currentSpendUsd?.toFixed(2)} spent</span>
                    <span>${b.limitUsd?.toFixed(2)} limit</span>
                  </div>
                </div>

                {/* Enforcement Mode & Thresholds */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Shield
                      className={`w-3.5 h-3.5 ${
                        b.hardBlockEnabled ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    />
                    <span className="font-medium text-slate-300">
                      {b.hardBlockEnabled ? 'Hard Block' : 'Soft Alert'}
                    </span>
                  </div>
                  <span className="font-mono text-[11px]">
                    Warn: {b.warnThresholdPercent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Threshold Crossed Alerts Log */}
        <div className="glass-card p-6 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Idempotent Budget Alert History
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Notification Service Dispatches
            </span>
          </div>

          <div className="space-y-2.5">
            {alerts.map((alt) => (
              <div
                key={alt.alertId}
                className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-white">{alt.message}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Policy: {alt.policyName} · Idempotency: {alt.alertId}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {alt.notificationStatus || 'DELIVERED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">
                  Create Budget Policy
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Policy Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. PR Platform Daily Guardrail"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Target App
                    </label>
                    <select
                      value={applicationId}
                      onChange={(e) => setApplicationId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none"
                    >
                      <option value="*">All Apps (*)</option>
                      <option value="ai-pr-review-platform">ai-pr-review-platform</option>
                      <option value="ai-movie-matcher">ai-movie-matcher</option>
                      <option value="ai-travel-planner">ai-travel-planner</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Period
                    </label>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="DAILY">Daily</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Budget Cap (USD)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={limitUsd}
                      onChange={(e) => setLimitUsd(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Warning % Threshold
                    </label>
                    <input
                      type="number"
                      required
                      min="10"
                      max="99"
                      value={warnThresholdPercent}
                      onChange={(e) => setWarnThresholdPercent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Hard Block Enforcement</div>
                    <div className="text-[11px] text-slate-400">
                      Block model calls when 100% threshold crossed
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hardBlockEnabled}
                    onChange={(e) => setHardBlockEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                  >
                    Save Policy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
