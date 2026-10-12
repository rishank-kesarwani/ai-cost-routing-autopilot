'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { apiClient } from '@/lib/api';
import {
  Network,
  Plus,
  Shield,
  Activity,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Lock,
  GitFork,
} from 'lucide-react';

export default function RoutingPoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiClient.getRoutingPolicies();
        setPolicies(data);
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex-1 pb-16">
      <Navbar
        title="Routing Policies & Fallback Matrix"
        subtitle="Define latency constraints, provider allowlists, model priority and multi-tier fallback chains"
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Active Routing Rules
            </h2>
            <p className="text-xs text-slate-400">
              Evaluated on every request before model invocation
            </p>
          </div>
          <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
            Fail-Safe Circuit Breaker Enabled
          </span>
        </div>

        {/* Policies List */}
        <div className="space-y-4">
          {policies.map((policy) => (
            <div
              key={policy.policyId}
              className="glass-card p-6 rounded-xl border border-slate-800 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <GitFork className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-sm">
                        {policy.name}
                      </h3>
                      {policy.isDefault && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      Target: {policy.applicationId}
                      {policy.featureId && ` (${policy.featureId})`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    SLA: {policy.latencyTargetMs}ms
                  </span>
                  <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    Max: ${policy.maxCostPer1kTokensUsd}/1k
                  </span>
                  <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    Quality &ge; {policy.qualityThreshold}
                  </span>
                </div>
              </div>

              {/* Priority Model Chain & Fallback Sequence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80 text-xs">
                {/* Candidate Priority */}
                <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Candidate Priority Order</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                    {policy.modelPriority?.map((model: string, idx: number) => (
                      <React.Fragment key={model}>
                        <span className="px-2 py-1 rounded bg-indigo-600/10 text-indigo-300 border border-indigo-500/20">
                          {model}
                        </span>
                        {idx < policy.modelPriority.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Fallback Order */}
                <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Safe Fallback Rescue Chain</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                    {policy.fallbackOrder?.map((model: string, idx: number) => (
                      <React.Fragment key={model}>
                        <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {model}
                        </span>
                        {idx < policy.fallbackOrder.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* Guardrails summary */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span>Allowlist:</span>
                  <div className="flex gap-1">
                    {policy.providerAllowlist?.map((prov: string) => (
                      <span
                        key={prov}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] uppercase font-mono text-slate-300"
                      >
                        {prov}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span>Gate Mode:</span>
                  <span className="text-cyan-400 font-semibold">
                    {policy.qualityGateMode || 'FAIL_CLOSED'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
