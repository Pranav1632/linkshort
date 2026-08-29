import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'LinkShort — Enterprise URL Shortener & Analytics',
  description: 'High-concurrency, low-latency URL shortener & real-time analytics engine inspired by Dub.co.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const content = (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
          <p>© 2026 LinkShort (Dub.co Clone). Built with Next.js, Express, Redis, Supabase, BullMQ & Docker.</p>
        </footer>
      </body>
    </html>
  );

  if (clerkKey) {
    return <ClerkProvider publishableKey={clerkKey}>{content}</ClerkProvider>;
  }

  return content;
}
