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
  X,
  ExternalLink,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useNavigation } from './NavigationContext';

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Usage Explorer', href: '/usage', icon: Layers },
  { name: 'Budget Policies', href: '/budgets', icon: Wallet },
  { name: 'Routing Policies', href: '/routing', icon: Network },
  { name: 'Route Simulator', href: '/simulator', icon: Cpu, badge: 'Dry-Run' },
  { name: 'Quality Gates', href: '/quality-gates', icon: ShieldCheck },
  { name: 'Incidents & Audit', href: '/incidents', icon: AlertTriangle },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isMobileOpen, closeMobile } = useNavigation();

  const navContent = (
    <>
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
              onClick={closeMobile}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-indigo-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-slate-300">Live Gateway</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
            v1.0
          </span>
        </div>
        <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
          <span>API Docs</span>
          <a
            href="https://ai-cost-routing-autopilot.onrender.com/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:underline flex items-center gap-1 font-mono"
          >
            Swagger <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 bg-[#090d16] border-r border-slate-800/80 h-screen sticky top-0 z-30">
        <div className="h-16 flex items-center px-5 border-b border-slate-800/80">
          <Logo size="sm" withLink={true} subtitle="Routing & Spend Autopilot" />
        </div>
        {navContent}
      </aside>

      {/* Mobile Drawer (visible only when isMobileOpen is true) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            onClick={closeMobile}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#090d16] border-r border-slate-800 flex flex-col h-full shadow-2xl z-50 animate-slide-in">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
              <Logo size="sm" withLink={true} subtitle="Routing & Spend Autopilot" />
              <button
                type="button"
                onClick={closeMobile}
                aria-label="Close navigation"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
