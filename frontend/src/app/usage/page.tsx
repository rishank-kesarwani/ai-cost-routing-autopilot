'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { apiClient } from '@/lib/api';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Info,
  X,
  Copy,
  ExternalLink,
} from 'lucide-react';

export default function UsageExplorerPage() {
  const [ledger, setLedger] = useState<any>({ items: [], summary: {} });
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [appFilter, setAppFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadLedger() {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (appFilter) params.applicationId = appFilter;
        if (modelFilter) params.model = modelFilter;
        if (statusFilter) params.status = statusFilter;

        const res = await apiClient.getLedger(params);
        setLedger(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLedger();
  }, [appFilter, modelFilter, statusFilter]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex-1 pb-16">
      <Navbar
        title="Usage & Cost Ledger"
        subtitle="Immutable ledger of token measurements, latency SLA tracking and cost attribution"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Filter bar */}
        <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-medium">Application:</span>
              <select
                value={appFilter}
                onChange={(e) => setAppFilter(e.target.value)}
                className="bg-transparent text-white outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">All Applications</option>
                <option value="ai-pr-review-platform" className="bg-slate-900">ai-pr-review-platform</option>
                <option value="ai-movie-matcher" className="bg-slate-900">ai-movie-matcher</option>
                <option value="ai-travel-planner" className="bg-slate-900">ai-travel-planner</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-slate-400 font-medium">Model:</span>
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="bg-transparent text-white outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">All Models</option>
                <option value="gpt-4o" className="bg-slate-900">gpt-4o</option>
                <option value="gpt-4o-mini" className="bg-slate-900">gpt-4o-mini</option>
                <option value="claude-3-5-sonnet" className="bg-slate-900">claude-3-5-sonnet</option>
                <option value="gemini-1-5-flash" className="bg-slate-900">gemini-1-5-flash</option>
                <option value="llama-3.3-70b-versatile" className="bg-slate-900">llama-3.3-70b-versatile</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-slate-400 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-white outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">All Statuses</option>
                <option value="SUCCESS" className="bg-slate-900">SUCCESS</option>
                <option value="FALLBACK_SUCCESS" className="bg-slate-900">FALLBACK_SUCCESS</option>
                <option value="ERROR" className="bg-slate-900">ERROR</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Showing <strong className="text-white">{ledger.items?.length || 0}</strong> records
          </div>
        </div>

        {/* Ledger Table */}
        <div className="glass-card rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Correlation ID / Time</th>
                  <th className="py-3 px-4">Application / Feature</th>
                  <th className="py-3 px-4">Model & Provider</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Tokens (P / C)</th>
                  <th className="py-3 px-4">Est. Cost</th>
                  <th className="py-3 px-4">Cost Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {ledger.items?.map((item: any) => {
                  const isFallback = item.fallbackActivated;
                  const isError = item.status === 'ERROR';
                  return (
                    <tr
                      key={item.eventId}
                      onClick={() => setSelectedEvent(item)}
                      className="hover:bg-slate-900/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">
                          {item.correlationId.slice(0, 14)}...
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          {new Date(item.requestTimestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <div className="text-white font-medium">
                          {item.applicationId}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.featureId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-indigo-300">
                          {item.model}
                        </span>
                        <div className="text-[10px] text-slate-400 uppercase">
                          {item.provider}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200">
                        {item.latencyMs}ms
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-white font-medium">
                          {item.totalTokens?.toLocaleString()}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {item.promptTokens} / {item.completionTokens}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400 font-semibold">
                        ${item.estimatedCostUsd?.toFixed(5)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                            item.costSource === 'PROVIDER_REPORTED'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                          }`}
                        >
                          {item.costSource === 'PROVIDER_REPORTED'
                            ? 'Provider Inv.'
                            : 'Catalog Est.'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isError ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-sans font-medium">
                            <XCircle className="w-3.5 h-3.5" /> Error
                          </span>
                        ) : isFallback ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-sans font-medium">
                            <AlertCircle className="w-3.5 h-3.5" /> Fallback
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-sans font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> OK
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-indigo-400 hover:text-indigo-300 font-sans text-xs inline-flex items-center gap-1">
                          Details <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Event Detail Drawer Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-lg bg-[#0f172a] border-l border-slate-800 h-full p-6 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    Measurement Event Trace
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    ID: {selectedEvent.eventId}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Correlation ID block */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-mono mb-1">
                  Correlation ID
                </div>
                <div className="flex items-center justify-between text-xs text-indigo-300 font-mono break-all">
                  <span>{selectedEvent.correlationId}</span>
                  <button
                    onClick={() => copyToClipboard(selectedEvent.correlationId)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title="Copy correlation ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                {copied && (
                  <div className="text-[10px] text-emerald-400 mt-1 font-mono">
                    Copied to clipboard!
                  </div>
                )}
              </div>

              {/* Attribution Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Tenant</div>
                  <div className="font-semibold text-white mt-0.5">
                    {selectedEvent.tenantId}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Application</div>
                  <div className="font-semibold text-white mt-0.5">
                    {selectedEvent.applicationId}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Feature</div>
                  <div className="font-semibold text-white mt-0.5">
                    {selectedEvent.featureId}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Source</div>
                  <div className="font-semibold text-white mt-0.5 font-mono text-[11px]">
                    {selectedEvent.measurementSource || 'PLATFORM_GATEWAY'}
                  </div>
                </div>
              </div>

              {/* Pricing Catalog & Cost Transparency */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Cost Calculation Breakdown</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {selectedEvent.pricingCatalogVersion}
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-300 font-mono">
                  <div className="flex justify-between">
                    <span>Prompt Tokens ({selectedEvent.promptTokens}):</span>
                    <span>${((selectedEvent.promptTokens / 1000) * 0.002).toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completion Tokens ({selectedEvent.completionTokens}):</span>
                    <span>${((selectedEvent.completionTokens / 1000) * 0.006).toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-400 pt-2 border-t border-slate-800">
                    <span>Total Estimated Spend:</span>
                    <span>${selectedEvent.estimatedCostUsd?.toFixed(5)}</span>
                  </div>
                  {selectedEvent.providerReportedCostUsd !== null && (
                    <div className="flex justify-between text-cyan-400 pt-1">
                      <span>Provider Invoice Cost:</span>
                      <span>${selectedEvent.providerReportedCostUsd?.toFixed(5)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Fallback & Diagnostics */}
              {selectedEvent.fallbackActivated && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Fallback Triggered
                  </div>
                  <p>
                    Primary route failed due to upstream latency/rate-limit. Request was rescued by secondary fallback model{' '}
                    <strong className="text-white font-mono">{selectedEvent.model}</strong> without disruption to caller.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
