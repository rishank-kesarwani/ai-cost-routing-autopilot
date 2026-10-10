import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'LLM Cost & Routing Autopilot | Intelligent LLM Spend Control & Model Router',
  description:
    'Control LLM spend without losing sight of quality, latency, or reliability. LLM cost analytics and intelligent routing system for budgets, token usage, latency-aware model selection, quota enforcement, and resilient provider fallback.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 flex min-h-screen antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
