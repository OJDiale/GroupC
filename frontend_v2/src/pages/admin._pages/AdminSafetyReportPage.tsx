import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, RefreshCw } from 'lucide-react';

const CONFIG = {
  API_BASE_URL: (window as unknown as { CONFIG?: { API_BASE_URL?: string } }).CONFIG?.API_BASE_URL || 'https://mapper-backend-brkn.onrender.com',
};
const API = `${CONFIG.API_BASE_URL}/api/reports/safety`;

interface SafetyReport {
  generatedAt: string;
  totals: {
    totalHazards: number;
    activeHazards: number;
    totalDrivers: number;
    totalTrips: number;
    tripsCompleted: number;
  };
  byType: { hazardType: string; count: number }[];
  bySource: { source: string; count: number }[];
  dailyTrend: { day: string; count: number }[];
}

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export default function AdminSafetyReportPage() {
  const [report, setReport] = useState<SafetyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setReport(data);
      } else {
        setError(data.message || 'Failed to load safety report.');
      }
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const statCard = (label: string, value: number | string) => (
    <div className="bg-black/35 border border-white/15 p-5">
      <div className="text-white/50 text-[0.72rem] uppercase tracking-[1.5px] font-['Oswald',sans-serif] mb-1">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#1a1a1a] font-['Roboto',sans-serif] text-white overflow-x-hidden">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url('background-image.jpeg')`, filter: 'brightness(0.52) saturate(0.8)' }}
      />

      <div className="relative z-10 p-9 max-w-[1000px] mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-['Oswald',sans-serif] text-[2.8rem] font-bold uppercase tracking-[2px]">
            Safety Report
          </h1>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 p-[8px_16px] border border-white/25 font-['Oswald',sans-serif] text-[0.8rem] font-semibold tracking-[1.5px] uppercase cursor-pointer bg-white/18 text-white hover:bg-white/28"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
        <Link
          to="/admin"
          className="inline-block mb-7 text-[#f0c040] text-[0.85rem] font-medium tracking-[1px] no-underline transition-colors duration-200 hover:text-white"
        >
          <ArrowLeft className="inline-block w-4 h-4 mr-1 align-baseline" /> Go Back to Home
        </Link>

        {loading && <p className="text-white/60">Generating report…</p>}
        {error && <p className="text-red-400">{error}</p>}

        {report && (
          <div className="space-y-8">
            <p className="text-white/40 text-xs">Generated {new Date(report.generatedAt).toLocaleString()}</p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {statCard('Total Hazards', report.totals.totalHazards)}
              {statCard('Active Hazards', report.totals.activeHazards)}
              {statCard('Registered Drivers', report.totals.totalDrivers)}
              {statCard('Trips Logged', report.totals.totalTrips)}
              {statCard('Trips Completed', report.totals.tripsCompleted)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="font-['Oswald',sans-serif] text-[1rem] font-semibold uppercase tracking-[1px] mb-3 text-white/70">
                  By Hazard Type
                </h2>
                <table className="w-full border-collapse bg-black/35 text-left text-sm">
                  <tbody>
                    {report.byType.length === 0 && (
                      <tr><td className="p-2.5 text-white/40 italic">No data yet.</td></tr>
                    )}
                    {report.byType.map((r) => (
                      <tr key={r.hazardType} className="border-b border-white/10">
                        <td className="p-2.5 capitalize">{r.hazardType.replace(/_/g, ' ')}</td>
                        <td className="p-2.5 text-right font-semibold">{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h2 className="font-['Oswald',sans-serif] text-[1rem] font-semibold uppercase tracking-[1px] mb-3 text-white/70">
                  By Source
                </h2>
                <table className="w-full border-collapse bg-black/35 text-left text-sm">
                  <tbody>
                    {report.bySource.length === 0 && (
                      <tr><td className="p-2.5 text-white/40 italic">No data yet.</td></tr>
                    )}
                    {report.bySource.map((r) => (
                      <tr key={r.source} className="border-b border-white/10">
                        <td className="p-2.5 capitalize">{r.source.replace(/_/g, ' ')}</td>
                        <td className="p-2.5 text-right font-semibold">{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="font-['Oswald',sans-serif] text-[1rem] font-semibold uppercase tracking-[1px] mb-3 text-white/70">
                Reports (last 14 days)
              </h2>
              {report.dailyTrend.length === 0 ? (
                <p className="text-white/40 italic text-sm">No reports in this window.</p>
              ) : (
                <div className="flex items-end gap-2 h-32 bg-black/35 border border-white/15 p-4">
                  {report.dailyTrend.map((d) => {
                    const max = Math.max(...report.dailyTrend.map((x) => x.count), 1);
                    return (
                      <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${d.count} on ${d.day}`}>
                        <div className="w-full bg-[#1a5fa8]" style={{ height: `${(d.count / max) * 100}%`, minHeight: 4 }} />
                        <span className="text-[9px] text-white/40">{new Date(d.day).getDate()}</span>
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
