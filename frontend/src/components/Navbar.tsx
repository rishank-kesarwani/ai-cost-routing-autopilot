'use client';

import React, { useState } from 'react';
import { Database, Shield, RefreshCw } from 'lucide-react';

export function Navbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const [tenant, setTenant] = useState('tenant-acme');
  const [seeding, setSeeding] = useState(false);
  const [seededMsg, setSeedMsg] = useState('');

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    try {
      const res = await fetch('http://localhost:4000/api/v1/seed', {
        method: 'POST',
      });
      if (res.ok) {
        setSeedMsg('Seeded!');
      } else {
        setSeedMsg('Demo Ready');
      }
    } catch {
      setSeedMsg('Demo Mode Active');
    } finally {
      setTimeout(() => {
        setSeeding(false);
      }, 600);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-base font-semibold text-white tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-400 font-normal">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Tenant selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
          <Database className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] text-slate-400">Tenant:</span>
          <select
            value={tenant}
            onChange={(e) => setTenant(e.target.value)}
            className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer font-medium"
          >
            <option value="tenant-acme" className="bg-slate-900">Acme Corp (Primary)</option>
            <option value="tenant-globex" className="bg-slate-900">Globex Labs</option>
            <option value="*" className="bg-slate-900">All Tenants (*)</option>
          </select>
        </div>

        {/* Demo Mode Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
          <Shield className="w-3.5 h-3.5" />
          <span>Public Demo</span>
        </div>

        {/* Quick Seed Button */}
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm active:scale-95"
          title="Seed realistic production-like demo data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
          <span>{seededMsg || (seeding ? 'Seeding...' : 'Seed Demo Data')}</span>
        </button>
      </div>
    </header>
  );
}
