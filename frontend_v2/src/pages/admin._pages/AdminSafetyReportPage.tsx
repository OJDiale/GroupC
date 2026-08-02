import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, ArrowUpDown } from 'lucide-react';
import AdminShell from '@/components/AdminShell';
import ReportExportButtons from '@/components/ReportExportButtons';
import { usePageTitle } from '@/lib/usePageTitle';

const CONFIG = {
  API_BASE_URL: (window as unknown as { CONFIG?: { API_BASE_URL?: string } }).CONFIG?.API_BASE_URL || 'https://mapper-backend-brkn.onrender.com',
};

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
  usePageTitle("Safety Report");
  const [report, setReport] = useState<SafetyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [source, setSource] = useState('');
  const [sortBy, setSortBy] = useState<'count' | 'name'>('count');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (from && to) { params.set('from', from); params.set('to', to); }
    if (source) params.set('source', source);
    params.set('sortBy', sortBy);
    params.set('sortDir', sortDir);
    return params.toString();
  }, [from, to, source, sortBy, sortDir]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/reports/safety?${queryString}`, { headers: getAuthHeaders() });
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

  useEffect(() => { load(); }, [queryString]);

  const toggleSortDir = () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));

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
        <div className="flex items-center gap-2 flex-wrap">
          <ReportExportButtons basePath={`/api/reports/safety?${queryString}`} filename="safety_report" />
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-ink text-white text-sm font-semibold hover:bg-brand-blue-dark"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      }
    >
      <div className="flex items-end gap-3 flex-wrap mb-6 bg-white border border-brand-border rounded-2xl p-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-brand-border rounded-lg px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-brand-border rounded-lg px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted mb-1">Sort By</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'count' | 'name')} className="border border-brand-border rounded-lg px-3 py-1.5 text-sm">
            <option value="count">Count</option>
            <option value="name">Name</option>
          </select>
        </div>
        <button
          onClick={toggleSortDir}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border text-sm font-semibold hover:border-brand-blue/40"
          title="Toggle sort direction"
        >
          <ArrowUpDown size={14} /> {sortDir === 'asc' ? 'Ascending' : 'Descending'}
        </button>
        {(from || to || source) && (
          <button
            onClick={() => { setFrom(''); setTo(''); setSource(''); }}
            className="text-sm text-brand-muted hover:text-brand-ink underline"
          >
            Clear filters
          </button>
        )}

        <div className="w-full pt-3 border-t border-brand-border flex items-center gap-4 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wide text-brand-muted">Source</span>
          {[
            { value: '', label: 'All' },
            { value: 'citizen', label: 'Citizen' },
            { value: 'traffic_authority', label: 'Traffic Authority' },
            { value: 'security_agency', label: 'Security Agency' },
            { value: 'ai_confirmed', label: 'AI Confirmed' },
          ].map((opt) => (
            <label key={opt.value || 'all'} className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
              <input
                type="radio"
                name="source-filter"
                checked={source === opt.value}
                onChange={() => setSource(opt.value)}
                className="accent-brand-blue"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

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
