'use client';

import React from 'react';
import { NavigationProvider } from './NavigationContext';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <NavigationProvider>
      <div className="flex min-h-screen bg-[#090d16] text-slate-100 antialiased w-full overflow-x-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 w-full overflow-y-auto">
          {children}
        </div>
      </div>
    </NavigationProvider>
  );
}
