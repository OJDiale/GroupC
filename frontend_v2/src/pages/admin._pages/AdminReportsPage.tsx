import { useState, useEffect, useMemo } from 'react';
import { Trash2, Pencil, Check, X, Download, Filter as FilterIcon } from 'lucide-react';
import { usePageTitle } from '@/lib/usePageTitle';
import { API_BASE_URL } from "@/lib/apiConfig";
import { downloadReportPdf } from '@/lib/pdfReport';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 7;

function formatReportedAt(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yy} ~ ${hh}:${min}`;
}

/**
 * BACKEND ENDPOINTS (Express + MySQL) — confirmed against hazards.route.js
 * ------------------------------------------------------------------
 * GET    /api/hazards   (no auth middleware on this route currently)
 *    -> raw array, NOT wrapped in { success }:
 *       [{ id, user_id, username, email, latitude, longitude,
 *          hazardType, createdAt }, ...]
 *    Success/failure is read off the HTTP status, not a body flag.
 *
 * PUT    /api/hazards/:id   (authenticateToken, adminWare)
 *    body: { hazardType: string }   <- camelCase, matches this file's
 *    own POST route convention, NOT hazard_type.
 *    -> { success: true, message?: string }
 *
 * DELETE /api/hazards/:id   (authenticateToken, adminWare)
 *    -> { success: true, message?: string }
 * ------------------------------------------------------------------
 */

interface HazardReport {
  id: number;
  user_id: number;
  username?: string;
  email?: string;
  latitude: number;
  longitude: number;
  hazardType: string;
  createdAt: string;
}

// Adjust this list to match whatever hazard categories the system actually uses.
const HAZARD_TYPES = ['pothole', 'flooding', 'accident', 'debris', 'construction', 'roadblock', 'other'];

const CONFIG = {
  API_BASE_URL,
};

const API = `${CONFIG.API_BASE_URL}/api/hazards`;

const inputClass = "w-full h-10 px-3 bg-white border border-brand-border rounded-lg text-sm text-brand-ink placeholder:text-brand-muted outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue";
const labelClass = "text-[11px] font-bold uppercase tracking-wide text-brand-muted block mb-1";

export default function HazardReports() {
  usePageTitle("Hazard Reports");
  const [allReports, setAllReports] = useState<HazardReport[]>([]);

  const [searchHazardType, setSearchHazardType] = useState('');
  const [filterHazardId, setFilterHazardId] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterUserEmail, setFilterUserEmail] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [page, setPage] = useState(1);

  const showToast = (msg: string, type = '') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const loadReports = async () => {
    try {
      const res = await fetch(API, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) {
        setAllReports(Array.isArray(data) ? data : []);
      } else {
        alert('Failed to load hazard reports: ' + (data.message || data.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Could not connect to server.');
    }
  };

  const deleteReport = async (id: number) => {
    if (!confirm(`Are you sure you want to delete hazard report ${id}?`)) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Hazard report deleted.', 'success');
        loadReports();
      } else {
        showToast('Failed to delete: ' + (data.message || 'Operation denied'), 'error');
      }
    } catch (e) {
      showToast('Delete request failed.', 'error');
    }
  };

  const startEdit = (report: HazardReport) => {
    setEditingId(report.id);
    setEditValue(report.hazardType);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveHazardType = async (id: number) => {
    if (!editValue) {
      showToast('Hazard type cannot be empty.', 'error');
      return;
    }
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ hazardType: editValue }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Hazard type updated.', 'success');
        setEditingId(null);
        loadReports();
      } else {
        showToast('Failed to update: ' + (data.message || 'Operation denied'), 'error');
      }
    } catch (e) {
      showToast('Update request failed.', 'error');
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // FK dropdown: derived from the reports already loaded (each row carries
  // its reporter's username/email) instead of a raw numeric ID the admin
  // would have to already know.
  const userOptions = useMemo(() => {
    const seen = new Map<number, string>();
    allReports.forEach((r) => {
      if (!seen.has(r.user_id)) {
        seen.set(r.user_id, `${r.username || 'unknown'} (${r.email || 'no email'})`);
      }
    });
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [allReports]);

  const filteredReports = useMemo(() => {
    return allReports.filter((r) => {
      if (searchHazardType && !r.hazardType?.toLowerCase().includes(searchHazardType.toLowerCase())) return false;
      if (filterHazardId && String(r.id) !== filterHazardId) return false;
      if (filterUserId && String(r.user_id) !== filterUserId) return false;
      if (filterUserEmail && !r.email?.toLowerCase().includes(filterUserEmail.toLowerCase())) return false;
      if (filterDateFrom && new Date(r.createdAt) < new Date(filterDateFrom)) return false;
      if (filterDateTo && new Date(r.createdAt) > new Date(filterDateTo)) return false;
      return true;
    });
  }, [allReports, searchHazardType, filterHazardId, filterUserId, filterUserEmail, filterDateFrom, filterDateTo]);

  const clearFilters = () => {
    setSearchHazardType('');
    setFilterHazardId('');
    setFilterUserId('');
    setFilterUserEmail('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const pageCount = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  useEffect(() => { setPage(1); }, [searchHazardType, filterHazardId, filterUserId, filterUserEmail, filterDateFrom, filterDateTo]);
  const pagedReports = filteredReports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <p className="text-brand-muted text-sm">Edit hazard categories or remove reports from the risk database.</p>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by hazard type"
          value={searchHazardType}
          onChange={(e) => setSearchHazardType(e.target.value)}
          className={`${inputClass} max-w-sm`}
        />
        <div className="flex gap-2">
          <button
            onClick={() => downloadReportPdf({
              title: 'Hazard Reports', filename: 'hazard-reports.pdf',
              columns: ['ID', 'User ID', 'Username', 'Email', 'Latitude', 'Longitude', 'Hazard type', 'Reported at'],
              rows: filteredReports.map((report) => [report.id, report.user_id, report.username, report.email, report.latitude, report.longitude, report.hazardType, report.createdAt]),
            })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-ink text-white text-sm font-semibold hover:bg-brand-blue-dark"
          >
            <Download size={14} /> Download PDF
          </button>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-ink text-white text-sm font-semibold hover:bg-brand-blue-dark"
          >
            <FilterIcon size={14} /> Filter
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Hazard ID</label>
              <input type="number" placeholder="Hazard ID" value={filterHazardId} onChange={(e) => setFilterHazardId(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Reported By</label>
              <select value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)} className={inputClass}>
                <option value="">All users</option>
                {userOptions.map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>User Email</label>
              <input type="text" placeholder="Email contains..." value={filterUserEmail} onChange={(e) => setFilterUserEmail(e.target.value)} className={inputClass} />
            </div>
          </div>

          <span className={`${labelClass} mt-4 block`}>Date Range (Reported)</span>
          <div className="flex flex-wrap gap-3 items-center text-sm">
            <label className="flex items-center gap-2">From <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="h-9 px-2 rounded-lg border border-brand-border" /></label>
            <label className="flex items-center gap-2">To <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="h-9 px-2 rounded-lg border border-brand-border" /></label>
          </div>

          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 rounded-lg border border-brand-border text-sm font-semibold text-brand-muted hover:text-brand-ink hover:border-brand-ink"
          >
            Clear Filters
          </button>
        </div>
      )}

      <div className="border border-brand-border rounded-2xl overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[850px]">
            <thead>
              <tr className="bg-brand-bg text-brand-muted text-[10px] font-bold uppercase tracking-wide">
                <th className="p-2">ID</th>
                <th className="p-2">User ID</th>
                <th className="p-2">Username</th>
                <th className="p-2">Email</th>
                <th className="p-2">Latitude</th>
                <th className="p-2">Longitude</th>
                <th className="p-2">Hazard Type</th>
                <th className="p-2">Reported At</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {pagedReports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-brand-muted italic p-6 text-xs">
                    No hazard reports found.
                  </td>
                </tr>
              ) : (
                pagedReports.map((r) => (
                  <tr key={r.id} className="hover:bg-brand-bg/60 transition-colors text-xs align-middle">
                    <td className="p-2">{r.id}</td>
                    <td className="p-2">{r.user_id}</td>
                    <td className="p-2">{r.username || 'N/A'}</td>
                    <td className="p-2">{r.email || 'N/A'}</td>
                    <td className="p-2">{r.latitude}</td>
                    <td className="p-2">{r.longitude}</td>
                    <td className="p-2">
                      {editingId === r.id ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-9 px-2 rounded-lg border border-brand-border text-sm"
                        >
                          {HAZARD_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="capitalize">{r.hazardType}</span>
                      )}
                    </td>
                    <td className="p-2">
                      {r.createdAt ? formatReportedAt(r.createdAt) : 'N/A'}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {editingId === r.id ? (
                        <>
                          <button
                            onClick={() => saveHazardType(r.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-ink text-white text-[11px] font-bold hover:bg-brand-blue-dark mr-1.5"
                          >
                            <Check size={11} /> Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-brand-border text-brand-muted text-[11px] font-bold hover:text-brand-ink"
                          >
                            <X size={11} /> Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-blue-soft text-brand-blue text-[11px] font-bold hover:bg-brand-blue hover:text-white mr-1.5 transition-colors"
                          >
                            <Pencil size={11} /> Edit Type
                          </button>
                          <button
                            onClick={() => deleteReport(r.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-[11px] font-bold hover:bg-red-600 hover:text-white transition-colors"
                          >
                            <Trash2 size={11} /> Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-xl z-[999] ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
