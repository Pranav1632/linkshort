'use client';

import React, { useState } from 'react';
import { Link2, ArrowRight, Loader2, Check, Copy, Sparkles } from 'lucide-react';
import { createLink, ShortLink } from '../lib/api';

interface Props {
  onLinkCreated: (link: ShortLink) => void;
}

export function CreateLinkForm({ onLinkCreated }: Props) {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<ShortLink | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalUrl.trim()) return;

    setLoading(true);
    setError(null);
    setCreatedLink(null);

    try {
      let formattedUrl = originalUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }

      const link = await createLink(formattedUrl, customCode.trim() || undefined);
      setCreatedLink(link);
      setOriginalUrl('');
      setCustomCode('');
      onLinkCreated(link);
    } catch (err: any) {
      setError(err.message || 'Failed to shorten URL');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!createdLink) return;
    const shortUrl = `http://localhost:5000/${createdLink.short_code}`;
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-6 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-2">
        <Sparkles className="w-4 h-4" />
        <span>Enterprise URL Shortener</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">
        Shorten, Brand & Track Links at Scale
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Destination URL
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Link2 className="h-5 w-5" />
            </div>
            <input
              type="text"
              required
              placeholder="https://example.com/very-long-product-campaign-url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm sm:text-base outline-none bg-slate-50/50 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Custom Slug (Optional)
          </label>
          <div className="flex items-center rounded-xl shadow-sm border border-slate-300 bg-slate-50/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 overflow-hidden transition-all">
            <span className="pl-3.5 pr-2 py-3 text-xs sm:text-sm font-medium text-slate-400 select-none">
              localhost:5000/
            </span>
            <input
              type="text"
              placeholder="my-custom-slug"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
              className="block w-full pr-4 py-3 text-slate-900 text-sm sm:text-base outline-none bg-transparent"
            />
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !originalUrl.trim()}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating Short Link...</span>
            </>
          ) : (
            <>
              <span>Shorten URL</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {createdLink && (
        <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                Your Link is Ready!
              </span>
              <a
                href={`http://localhost:5000/${createdLink.short_code}`}
                target="_blank"
                rel="noreferrer"
                className="text-base sm:text-lg font-bold text-emerald-900 hover:underline truncate block"
              >
                http://localhost:5000/{createdLink.short_code}
              </a>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium shadow-sm transition-colors cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
