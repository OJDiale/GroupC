import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, ArrowLeft, Settings } from 'lucide-react';
import { API_BASE_URL } from '@/lib/apiConfig';
import { usePageTitle } from '@/lib/usePageTitle';
import ReportExportButtons from '@/components/admin/ReportExportButtons';

/**
 * BACKEND ENDPOINT — GET /api/reports/safety (authenticateToken, adminWare)
 * Query: from, to (date range), source, sortBy=count|name, sortDir=asc|desc.
 * -> { success, generatedAt, totals: { totalHazards, activeHazards,
 *      totalDrivers, totalTrips }, byType: [{hazardType,count}],
 *      bySource: [{source,count}], dailyTrend: [{day,count}] }
 */

interface SafetyReport {
  generatedAt: string;
  totals: {
    totalHazards: number;
    activeHazards: number;
    totalDrivers: number;
    totalTrips: number;
  };
  byType: { hazardType: string; count: number }[];
  bySource: { source: string; count: number }[];
  dailyTrend: { day: string; count: number }[];
}

const API = `${API_BASE_URL}/api/reports/safety`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export default function AdminSafetyReportPage() {
  usePageTitle('Safety Report');
  const [report, setReport] = useState<SafetyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (from && to) {
      params.set('from', from);
      params.set('to', to);
    }
    return params.toString();
  }, [from, to]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}?${queryString}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setReport(data);
      } else {
        setError(data.message || 'Failed to load safety report.');
      }
    } catch (e) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const statCard = (label: string, value: number | string) => (
    <div className="bg-black/35 border border-white/15 p-4">
      <div className="font-['Oswald',sans-serif] text-[0.7rem] uppercase tracking-[1.5px] text-[#f0c040] mb-1.5">
        {label}
      </div>
      <div className="text-[1.8rem] font-bold">{value}</div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#1a1a1a] font-['Roboto',sans-serif] text-white overflow-x-hidden">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('background-image.jpeg')`,
          filter: 'brightness(0.52) saturate(0.8)',
        }}
      />

      <div className="relative z-10 p-9 max-w-[1200px] mx-auto">
        <h1 className="font-['Oswald',sans-serif] text-[2.8rem] font-bold uppercase tracking-[2px] mb-1">
          Safety Report
        </h1>
        <a
          href="/admin"
          className="inline-block mb-7 text-[#f0c040] text-[0.85rem] font-medium tracking-[1px] no-underline transition-colors duration-200 hover:text-white"
        >
          <ArrowLeft className="inline-block w-4 h-4 mr-1 align-baseline" /> Go Back to Home
        </a>

        <p className="text-white/50 text-[0.85rem] mb-4">
          {report ? `Generated ${new Date(report.generatedAt).toLocaleString()}` : 'Generating report…'}
        </p>

        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="inline-flex items-center gap-1.5 p-[8px_18px] border border-white/25 font-['Oswald',sans-serif] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer transition-colors duration-200 bg-white/18 text-white hover:bg-white/28"
          >
            <Settings className="w-3.5 h-3.5" /> Filter
          </button>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 p-[8px_18px] border border-white/25 font-['Oswald',sans-serif] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer transition-colors duration-200 bg-white/18 text-white hover:bg-white/28"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <ReportExportButtons basePath={`/api/reports/safety?${queryString}`} filename="safety_report" onError={(m) => setError(m)} />
        </div>

        {isFilterOpen && (
          <div className="bg-black/60 border border-white/18 p-[18px_22px] mb-4 w-fit max-w-full text-white">
            <div className="mb-2.5 text-white text-[0.85rem] flex flex-wrap gap-2 items-center">
              From:{' '}
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="p-[4px_8px] text-[#333] bg-white/90"
              />
              To:{' '}
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="p-[4px_8px] text-[#333] bg-white/90"
              />
            </div>
            {(from || to) && (
              <button
                onClick={() => {
                  setFrom('');
                  setTo('');
                }}
                className="inline-block p-[8px_18px] border border-white/25 font-['Oswald',sans-serif] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer bg-white/18 text-white hover:bg-white/28"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {loading && <p className="text-white/50 text-[0.85rem]">Generating report…</p>}
        {error && <p className="text-[#ff6b6b] text-[0.85rem]">{error}</p>}

        {report && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {statCard('Total Hazards', report.totals.totalHazards)}
              {statCard('Active Hazards', report.totals.activeHazards)}
              {statCard('Registered Drivers', report.totals.totalDrivers)}
              {statCard('Destinations Logged', report.totals.totalTrips)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="font-['Oswald',sans-serif] text-[1rem] font-semibold uppercase tracking-[1px] mb-2.5 text-[#f0c040]">
                  By Hazard Type
                </h2>
                <table className="w-full border-collapse bg-black/35 text-left text-[0.85rem]">
                  <tbody>
                    {report.byType.length === 0 && (
                      <tr>
                        <td className="p-3 border border-white/12 text-white/50 italic">No data yet.</td>
                      </tr>
                    )}
                    {report.byType.map((r) => (
                      <tr key={r.hazardType} className="border-b border-white/12 hover:bg-white/9">
                        <td className="p-2.5 border border-white/12 capitalize">{r.hazardType.replace(/_/g, ' ')}</td>
                        <td className="p-2.5 border border-white/12 text-right font-bold">{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h2 className="font-['Oswald',sans-serif] text-[1rem] font-semibold uppercase tracking-[1px] mb-2.5 text-[#f0c040]">
                  By Source
                </h2>
                <table className="w-full border-collapse bg-black/35 text-left text-[0.85rem]">
                  <tbody>
                    {report.bySource.length === 0 && (
                      <tr>
                        <td className="p-3 border border-white/12 text-white/50 italic">No data yet.</td>
                      </tr>
                    )}
                    {report.bySource.map((r) => (
                      <tr key={r.source} className="border-b border-white/12 hover:bg-white/9">
                        <td className="p-2.5 border border-white/12 capitalize">{r.source.replace(/_/g, ' ')}</td>
                        <td className="p-2.5 border border-white/12 text-right font-bold">{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="font-['Oswald',sans-serif] text-[1rem] font-semibold uppercase tracking-[1px] mb-2.5 text-[#f0c040]">
                Reports (last 14 days)
              </h2>
              {report.dailyTrend.length === 0 ? (
                <p className="text-white/50 italic text-[0.85rem]">No reports in this window.</p>
              ) : (
                <div className="flex items-end gap-2 h-32 bg-black/35 border border-white/15 p-4">
                  {report.dailyTrend.map((d) => {
                    const max = Math.max(...report.dailyTrend.map((x) => x.count), 1);
                    return (
                      <div
                        key={d.day}
                        className="flex-1 flex flex-col items-center justify-end h-full gap-1"
                        title={`${d.count} on ${d.day}`}
                      >
                        <div
                          className="w-full bg-[#f0c040]"
                          style={{ height: `${(d.count / max) * 100}%`, minHeight: 4 }}
                        />
                        <span className="text-[9px] text-white/50">{new Date(d.day).getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
