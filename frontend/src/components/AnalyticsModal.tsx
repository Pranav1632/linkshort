'use client';

import React, { useEffect, useState } from 'react';
import { X, Globe2, Smartphone, Monitor, ExternalLink, Loader2, MousePointerClick, Calendar } from 'lucide-react';
import { fetchAnalytics, AnalyticsData } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  shortCode: string;
  onClose: () => void;
}

const COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899'];

export function AnalyticsModal({ shortCode, onClose }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics(shortCode)
      .then(setData)
      .finally(() => setLoading(false));
  }, [shortCode]);

  const deviceChartData = data?.devices.map((d) => ({
    name: d.device,
    count: Number(d.count),
  })) || [];

  const browserChartData = data?.browsers.map((b) => ({
    name: b.browser,
    count: Number(b.count),
  })) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Analytics Report
              </span>
              <a
                href={`http://localhost:5000/${shortCode}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
              >
                <span>localhost:5000/{shortCode}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              Link Insights: /{shortCode}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
              <p className="text-sm font-medium">Crunching analytics from Supabase & Redis...</p>
            </div>
          ) : !data ? (
            <div className="text-center py-12 text-slate-500 font-medium">
              No analytics recorded yet. Click the short link to generate analytics!
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                    <MousePointerClick className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                      Total Clicks
                    </span>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900">
                      {data.totalClicks.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                    <Globe2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Top Country
                    </span>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                      {data.countries[0]?.country || 'None'}
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Top Device
                    </span>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                      {data.devices[0]?.device || 'None'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Device Breakdown */}
                <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-emerald-600" />
                    <span>Device Breakdown</span>
                  </h4>
                  <div className="h-48">
                    {deviceChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deviceChartData}>
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {deviceChartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-slate-400 text-center pt-16">No device data</p>
                    )}
                  </div>
                </div>

                {/* Browser Breakdown */}
                <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-indigo-600" />
                    <span>Browser Breakdown</span>
                  </h4>
                  <div className="h-48">
                    {browserChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={browserChartData}>
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {browserChartData.map((_, index) => (
                              <Cell key={`cell-b-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-slate-400 text-center pt-16">No browser data</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Click Log */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-sm text-slate-800">
                  Recent Visitor Stream (BullMQ Queue)
                </div>
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/75 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Time</th>
                        <th className="py-2.5 px-4">Device</th>
                        <th className="py-2.5 px-4">Browser</th>
                        <th className="py-2.5 px-4">Country</th>
                        <th className="py-2.5 px-4">Referrer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {data.recentClicks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            No clicks recorded yet.
                          </td>
                        </tr>
                      ) : (
                        data.recentClicks.map((click) => (
                          <tr key={click.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-4 font-mono text-slate-500">
                              {new Date(click.created_at).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 px-4 font-medium">{click.device}</td>
                            <td className="py-2.5 px-4 font-medium">{click.browser}</td>
                            <td className="py-2.5 px-4">{click.country}</td>
                            <td className="py-2.5 px-4 max-w-[150px] truncate text-slate-500">
                              {click.referrer || 'Direct'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
