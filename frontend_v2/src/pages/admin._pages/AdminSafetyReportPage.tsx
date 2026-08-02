import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import AdminShell from '@/components/AdminShell';

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
    <div className="bg-white border border-brand-border rounded-2xl p-5">
      <div className="text-brand-muted text-[11px] uppercase tracking-wide font-bold mb-1">{label}</div>
      <div className="text-3xl font-extrabold">{value}</div>
    </div>
  );

  return (
    <AdminShell
      title="Safety Report"
      subtitle={report ? `Generated ${new Date(report.generatedAt).toLocaleString()}` : undefined}
      headerActions={
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-ink text-white text-sm font-semibold hover:bg-brand-blue-dark"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      }
    >
      {loading && <p className="text-brand-muted">Generating report…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {report && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {statCard('Total Hazards', report.totals.totalHazards)}
            {statCard('Active Hazards', report.totals.activeHazards)}
            {statCard('Registered Drivers', report.totals.totalDrivers)}
            {statCard('Trips Logged', report.totals.totalTrips)}
            {statCard('Trips Completed', report.totals.tripsCompleted)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-3">
                By Hazard Type
              </h2>
              <div className="border border-brand-border rounded-2xl overflow-hidden">
                <table className="w-full border-collapse text-left text-sm">
                  <tbody className="divide-y divide-brand-border">
                    {report.byType.length === 0 && (
                      <tr><td className="p-4 text-brand-muted italic">No data yet.</td></tr>
                    )}
                    {report.byType.map((r) => (
                      <tr key={r.hazardType} className="hover:bg-brand-bg/60">
                        <td className="p-3 capitalize">{r.hazardType.replace(/_/g, ' ')}</td>
                        <td className="p-3 text-right font-bold">{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-3">
                By Source
              </h2>
              <div className="border border-brand-border rounded-2xl overflow-hidden">
                <table className="w-full border-collapse text-left text-sm">
                  <tbody className="divide-y divide-brand-border">
                    {report.bySource.length === 0 && (
                      <tr><td className="p-4 text-brand-muted italic">No data yet.</td></tr>
                    )}
                    {report.bySource.map((r) => (
                      <tr key={r.source} className="hover:bg-brand-bg/60">
                        <td className="p-3 capitalize">{r.source.replace(/_/g, ' ')}</td>
                        <td className="p-3 text-right font-bold">{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-3">
              Reports (last 14 days)
            </h2>
            {report.dailyTrend.length === 0 ? (
              <p className="text-brand-muted italic text-sm">No reports in this window.</p>
            ) : (
              <div className="flex items-end gap-2 h-32 bg-white border border-brand-border rounded-2xl p-4">
                {report.dailyTrend.map((d) => {
                  const max = Math.max(...report.dailyTrend.map((x) => x.count), 1);
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${d.count} on ${d.day}`}>
                      <div className="w-full bg-brand-blue rounded-t" style={{ height: `${(d.count / max) * 100}%`, minHeight: 4 }} />
                      <span className="text-[9px] text-brand-muted">{new Date(d.day).getDate()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
