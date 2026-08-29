'use client';

import React, { useEffect, useState } from 'react';
import { CreateLinkForm } from '../components/CreateLinkForm';
import { LinksTable } from '../components/LinksTable';
import { fetchLinks, ShortLink } from '../lib/api';
import { Zap, ShieldCheck, BarChart3, Activity } from 'lucide-react';

export default function HomePage() {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLinks = async () => {
    try {
      const data = await fetchLinks();
      setLinks(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const handleLinkCreated = (newLink: ShortLink) => {
    setLinks((prev) => [newLink, ...prev]);
  };

  const handleLinkDeleted = (deletedCode: string) => {
    setLinks((prev) => prev.filter((l) => l.short_code !== deletedCode));
  };

  return (
    <div className="space-y-12">
      {/* Hero / Creator Form Section */}
      <section className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
          <span>Ultra-Fast Redirections & Real-time Analytics</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto">
          Shorten Links with <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Sub-Millisecond</span> Speed.
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
          Powered by Redis Cache-Aside routing, BullMQ asynchronous queue workers, and Supabase Cloud PostgreSQL.
        </p>

        <div className="pt-4">
          <CreateLinkForm onLinkCreated={handleLinkCreated} />
        </div>
      </section>

      {/* Feature Badges */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Redis Memory Cache</h4>
            <p className="text-xs text-slate-500 mt-0.5">Redirect latency dropped from 80ms to &lt;1ms in RAM.</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">BullMQ Analytics</h4>
            <p className="text-xs text-slate-500 mt-0.5">Async queue logging visitors without slowing down redirects.</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Sliding Rate Limiter</h4>
            <p className="text-xs text-slate-500 mt-0.5">Redis Sorted Sets block scraper bots and DDoS attacks.</p>
          </div>
        </div>
      </section>

      {/* Links List Section */}
      <section className="max-w-5xl mx-auto">
        <LinksTable links={links} onLinkDeleted={handleLinkDeleted} />
      </section>
    </div>
  );
}
