import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, ArrowUpDown } from 'lucide-react';
import AdminShell from '@/components/AdminShell';
import ReportExportButtons from '@/components/ReportExportButtons';
import { usePageTitle } from '@/lib/usePageTitle';

const CONFIG = {
  API_BASE_URL: (window as unknown as { CONFIG?: { API_BASE_URL?: string } }).CONFIG?.API_BASE_URL || 'https://mapper-backend-brkn.onrender.com',
};

interface Trip {
  summaryId: number;
  driverUsername: string;
  startLocation: string;
  endLocation: string;
  durationSeconds: number;
  startedAt: string;
  endedAt: string;
}

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function AdminTripReportPage() {
  usePageTitle("Trip Completion Report");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [minDuration, setMinDuration] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  const [sortBy, setSortBy] = useState<'startedAt' | 'durationSeconds'>('startedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const isAdmin = localStorage.getItem('userType') === 'admin';

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (from && to) { params.set('from', from); params.set('to', to); }
    if (minDuration) params.set('minDuration', minDuration);
    if (maxDuration) params.set('maxDuration', maxDuration);
    params.set('sortBy', sortBy);
    params.set('sortDir', sortDir);
    return params.toString();
  }, [from, to, minDuration, maxDuration, sortBy, sortDir]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/reports/trips?${queryString}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setTrips(data.trips);
      } else {
        setError(data.message || 'Failed to load trip completion report.');
      }
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [queryString]);

  const toggleSortDir = () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));

  return (
    <AdminShell
      title="Trip Completion Report"
      subtitle="Every trip a driver has marked as ended, with server-computed duration."
      backTo={isAdmin ? '/admin' : '/data-analyst'}
      headerActions={
        <div className="flex items-center gap-2 flex-wrap">
          <ReportExportButtons basePath={`/api/reports/trips?${queryString}`} filename="trip_completion_report" />
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-ink text-white text-sm font-semibold hover:bg-brand-blue-dark"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      }
    >
      <div className="flex items-end gap-3 flex-wrap bg-white border border-brand-border rounded-2xl p-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-brand-border rounded-lg px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-brand-border rounded-lg px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted mb-1">Min Duration (s)</label>
          <input type="number" min={0} value={minDuration} onChange={(e) => setMinDuration(e.target.value)} className="border border-brand-border rounded-lg px-3 py-1.5 text-sm w-28" />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted mb-1">Max Duration (s)</label>
          <input type="number" min={0} value={maxDuration} onChange={(e) => setMaxDuration(e.target.value)} className="border border-brand-border rounded-lg px-3 py-1.5 text-sm w-28" />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted mb-1">Sort By</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'startedAt' | 'durationSeconds')} className="border border-brand-border rounded-lg px-3 py-1.5 text-sm">
            <option value="startedAt">Started At</option>
            <option value="durationSeconds">Duration</option>
          </select>
        </div>
        <button
          onClick={toggleSortDir}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border text-sm font-semibold hover:border-brand-blue/40"
          title="Toggle sort direction"
        >
          <ArrowUpDown size={14} /> {sortDir === 'asc' ? 'Ascending' : 'Descending'}
        </button>
        {(from || to || minDuration || maxDuration) && (
          <button
            onClick={() => { setFrom(''); setTo(''); setMinDuration(''); setMaxDuration(''); }}
            className="text-sm text-brand-muted hover:text-brand-ink underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading && <p className="text-brand-muted">Generating report…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="border border-brand-border rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm min-w-[720px]">
            <thead className="bg-brand-bg">
              <tr className="text-[11px] uppercase tracking-wide text-brand-muted">
                <th className="p-3">ID</th>
                <th className="p-3">Driver</th>
                <th className="p-3">Start</th>
                <th className="p-3">End</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Started At</th>
                <th className="p-3">Ended At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {trips.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-brand-muted italic">No completed trips match these filters yet.</td></tr>
              )}
              {trips.map((t) => (
                <tr key={t.summaryId} className="hover:bg-brand-bg/60">
                  <td className="p-3 font-mono text-xs">{t.summaryId}</td>
                  <td className="p-3 font-semibold">{t.driverUsername}</td>
                  <td className="p-3">{t.startLocation}</td>
                  <td className="p-3">{t.endLocation}</td>
                  <td className="p-3">{formatDuration(t.durationSeconds)}</td>
                  <td className="p-3 text-brand-muted">{new Date(t.startedAt).toLocaleString()}</td>
                  <td className="p-3 text-brand-muted">{new Date(t.endedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
