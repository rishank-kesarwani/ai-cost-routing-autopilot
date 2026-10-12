import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://ai-cost-routing-autopilot.vercel.app',
  ),
  title: {
    default: 'Cost Autopilot | LLM Routing & Spend Control',
    template: '%s | Cost Autopilot',
  },
  description:
    'Control LLM spend without losing sight of quality, latency, or reliability. Real-time cost analytics and intelligent routing for OpenAI, Anthropic, Gemini, and open models.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: '/logo.png',
    shortcut: '/icon.svg',
  },
  openGraph: {
    title: 'Cost Autopilot | LLM Routing & Spend Control',
    description:
      'Control LLM spend without losing sight of quality, latency, or reliability.',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Cost Autopilot Logo' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased overflow-x-hidden min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
