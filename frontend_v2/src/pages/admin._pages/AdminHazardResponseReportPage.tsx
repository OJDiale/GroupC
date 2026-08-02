import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, ArrowUpDown } from 'lucide-react';
import AdminShell from '@/components/AdminShell';
import ReportExportButtons from '@/components/ReportExportButtons';
import { usePageTitle } from '@/lib/usePageTitle';

const CONFIG = {
  API_BASE_URL: (window as unknown as { CONFIG?: { API_BASE_URL?: string } }).CONFIG?.API_BASE_URL || 'https://mapper-backend-brkn.onrender.com',
};

interface HazardResponse {
  logId: number;
  hazardId: number;
  hazardType: string;
  resolvedByUsername: string;
  previousStatus: string;
  newStatus: string;
  resolvedAt: string;
}

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const BACK_TO_BY_ROLE: Record<string, string> = {
  admin: '/admin',
  traffic_authority: '/traffic-authority',
  security_agency: '/security-agency',
  data_analyst: '/data-analyst',
};

export default function AdminHazardResponseReportPage() {
  usePageTitle("Hazard Response Report");
  const [responses, setResponses] = useState<HazardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [hazardType, setHazardType] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [sortBy, setSortBy] = useState<'resolvedAt' | 'hazardType'>('resolvedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const backTo = BACK_TO_BY_ROLE[localStorage.getItem('userType') || ''] || '/';

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (from && to) { params.set('from', from); params.set('to', to); }
    if (hazardType) params.set('hazardType', hazardType);
    if (newStatus) params.set('newStatus', newStatus);
    params.set('sortBy', sortBy);
    params.set('sortDir', sortDir);
    return params.toString();
  }, [from, to, hazardType, newStatus, sortBy, sortDir]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/reports/hazard-responses?${queryString}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setResponses(data.responses);
      } else {
        setError(data.message || 'Failed to load hazard response report.');
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
      title="Hazard Response Report"
      subtitle="Audit trail of every hazard status change — who resolved (or reopened) what, and when."
      backTo={backTo}
      headerActions={
        <div className="flex items-center gap-2 flex-wrap">
          <ReportExportButtons basePath={`/api/reports/hazard-responses?${queryString}`} filename="hazard_response_report" />
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
          <label className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted mb-1">Hazard Type</label>
          <input type="text" placeholder="e.g. pothole" value={hazardType} onChange={(e) => setHazardType(e.target.value)} className="border border-brand-border rounded-lg px-3 py-1.5 text-sm w-36" />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted mb-1">New Status</label>
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="border border-brand-border rounded-lg px-3 py-1.5 text-sm">
            <option value="">Any</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted mb-1">Sort By</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'resolvedAt' | 'hazardType')} className="border border-brand-border rounded-lg px-3 py-1.5 text-sm">
            <option value="resolvedAt">Resolved At</option>
            <option value="hazardType">Hazard Type</option>
          </select>
        </div>
        <button
          onClick={toggleSortDir}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border text-sm font-semibold hover:border-brand-blue/40"
          title="Toggle sort direction"
        >
          <ArrowUpDown size={14} /> {sortDir === 'asc' ? 'Ascending' : 'Descending'}
        </button>
        {(from || to || hazardType || newStatus) && (
          <button
            onClick={() => { setFrom(''); setTo(''); setHazardType(''); setNewStatus(''); }}
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
                <th className="p-3">Hazard</th>
                <th className="p-3">Type</th>
                <th className="p-3">Resolved By</th>
                <th className="p-3">Change</th>
                <th className="p-3">Resolved At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {responses.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-brand-muted italic">No status changes match these filters yet.</td></tr>
              )}
              {responses.map((r) => (
                <tr key={r.logId} className="hover:bg-brand-bg/60">
                  <td className="p-3 font-mono text-xs">{r.logId}</td>
                  <td className="p-3 font-mono text-xs">#{r.hazardId}</td>
                  <td className="p-3 capitalize">{r.hazardType.replace(/_/g, ' ')}</td>
                  <td className="p-3 font-semibold">{r.resolvedByUsername}</td>
                  <td className="p-3">
                    <span className="capitalize text-brand-muted">{r.previousStatus}</span>
                    {' → '}
                    <span className={`capitalize font-semibold ${r.newStatus === 'resolved' ? 'text-green-600' : 'text-amber-600'}`}>{r.newStatus}</span>
                  </td>
                  <td className="p-3 text-brand-muted">{new Date(r.resolvedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
