'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  Wallet,
  Network,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Settings,
  Sparkles,
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Usage Explorer', href: '/usage', icon: Layers },
  { name: 'Budget Policies', href: '/budgets', icon: Wallet },
  { name: 'Routing Policies', href: '/routing', icon: Network },
  { name: 'Route Simulator', href: '/simulator', icon: Cpu },
  { name: 'Quality Gates', href: '/quality-gates', icon: ShieldCheck },
  { name: 'Incidents & Audit', href: '/incidents', icon: AlertTriangle },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-[#090d16] border-r border-slate-800/80 flex flex-col h-screen sticky top-0 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-wide text-white">
            Cost Autopilot
          </span>
          <span className="text-[11px] text-slate-400 tracking-wider uppercase font-mono">
            Routing & Budget
          </span>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
          Control Plane
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-slate-400'
                }`}
              />
              <span>{item.name}</span>
              {item.name === 'Route Simulator' && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                  Dry-Run
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 font-medium">Autopilot Engine</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Catalog: <span className="text-slate-300">2026.04-v1</span>
        </div>
      </div>
    </aside>
  );
}
