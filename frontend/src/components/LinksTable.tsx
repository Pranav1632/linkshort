'use client';

import React, { useState } from 'react';
import { ShortLink, deleteLink } from '../lib/api';
import { Copy, Check, BarChart2, Trash2, ExternalLink, MousePointerClick } from 'lucide-react';
import { AnalyticsModal } from './AnalyticsModal';

interface Props {
  links: ShortLink[];
  onLinkDeleted: (shortCode: string) => void;
}

export function LinksTable({ links, onLinkDeleted }: Props) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedAnalytics, setSelectedAnalytics] = useState<string | null>(null);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    const url = `http://localhost:5000/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Are you sure you want to delete /${code}?`)) return;
    setDeletingCode(code);
    try {
      const success = await deleteLink(code);
      if (success) {
        onLinkDeleted(code);
      }
    } finally {
      setDeletingCode(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Your Short Links</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Active redirects cached in Redis & tracked with BullMQ
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
          {links.length} {links.length === 1 ? 'Link' : 'Links'}
        </span>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <MousePointerClick className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">No links created yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Use the form above to shorten your first long destination URL!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-6">Short Link</th>
                <th className="py-3 px-6">Destination</th>
                <th className="py-3 px-6 text-center">Clicks</th>
                <th className="py-3 px-6">Created</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="py-4 px-6 font-semibold">
                    <div className="flex items-center gap-2">
                      <a
                        href={`http://localhost:5000/${link.short_code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:text-emerald-800 hover:underline font-mono font-bold flex items-center gap-1"
                      >
                        <span>/{link.short_code}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </a>
                    </div>
                  </td>

                  <td className="py-4 px-6 max-w-xs truncate text-slate-500" title={link.original_url}>
                    {link.original_url}
                  </td>

                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      <MousePointerClick className="w-3 h-3" />
                      <span>{Number(link.click_count || 0).toLocaleString()}</span>
                    </span>
                  </td>

                  <td className="py-4 px-6 text-xs text-slate-400">
                    {new Date(link.created_at).toLocaleDateString()}
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleCopy(link.short_code)}
                        title="Copy to Clipboard"
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        {copiedCode === link.short_code ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => setSelectedAnalytics(link.short_code)}
                        title="View Detailed Analytics"
                        className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      >
                        <BarChart2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(link.short_code)}
                        disabled={deletingCode === link.short_code}
                        title="Delete Link"
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedAnalytics && (
        <AnalyticsModal
          shortCode={selectedAnalytics}
          onClose={() => setSelectedAnalytics(null)}
        />
      )}
    </div>
  );
}
