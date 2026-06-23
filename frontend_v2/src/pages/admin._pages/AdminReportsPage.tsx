import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Trash2, ArrowLeft, Pencil, Check, X } from 'lucide-react';

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
  API_BASE_URL: (window as any).CONFIG?.API_BASE_URL || 'https://mapper-backend-brkn.onrender.com',
};

const API = `${CONFIG.API_BASE_URL}/api/hazards`;

export default function HazardReports() {
  const [allReports, setAllReports] = useState<HazardReport[]>([]);

  // Filter fields
  const [searchHazardType, setSearchHazardType] = useState('');
  const [filterHazardId, setFilterHazardId] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterUserEmail, setFilterUserEmail] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Inline edit state for hazardType
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

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

  // GET /api/hazards returns a raw array, not { success, reports } —
  // branch on res.ok instead of a body flag.
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

  // Backend expects { hazardType } (camelCase), matching the POST route's
  // own body shape in hazards.route.js — not { hazard_type }.
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
          Hazard Reports
        </h1>
        <a
          href="/admin"
          className="inline-block mb-7 text-[#f0c040] text-[0.85rem] font-medium tracking-[1px] no-underline transition-colors duration-200 hover:text-white"
        >
          <ArrowLeft className="inline-block w-4 h-4 mr-1 align-baseline" /> Go Back to Home
        </a>

        <h2 className="font-['Oswald',sans-serif] text-[1.35rem] font-semibold uppercase tracking-[1px] mb-3.5">
          Report List
        </h2>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <input
            type="text"
            placeholder="Search by hazard type"
            value={searchHazardType}
            onChange={(e) => setSearchHazardType(e.target.value)}
            className="min-w-[260px] p-[9px_12px] bg-white/90 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none"
          />
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="inline-flex items-center gap-1.5 p-[8px_18px] border border-white/25 font-['Oswald',sans-serif] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer transition-colors duration-200 bg-white/18 text-white hover:bg-white/28"
          >
            <Settings className="w-3.5 h-3.5" /> Filter
          </button>
        </div>

        {/* Filter Panel Drawer */}
        {isFilterOpen && (
          <div className="bg-black/60 border border-white/18 p-[18px_22px] mb-4 w-fit max-w-full text-white">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5">
              <div>
                <label className="font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                  Hazard ID
                </label>
                <input
                  type="number"
                  placeholder="Hazard ID"
                  value={filterHazardId}
                  onChange={(e) => setFilterHazardId(e.target.value)}
                  className="w-full p-[8px_10px] bg-white/90 border-none font-['Roboto'] text-[0.86rem] text-[#333] outline-none"
                />
              </div>
              <div>
                <label className="font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                  User ID
                </label>
                <input
                  type="number"
                  placeholder="User ID"
                  value={filterUserId}
                  onChange={(e) => setFilterUserId(e.target.value)}
                  className="w-full p-[8px_10px] bg-white/90 border-none font-['Roboto'] text-[0.86rem] text-[#333] outline-none"
                />
              </div>
              <div>
                <label className="font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                  User Email
                </label>
                <input
                  type="text"
                  placeholder="Email contains..."
                  value={filterUserEmail}
                  onChange={(e) => setFilterUserEmail(e.target.value)}
                  className="w-full p-[8px_10px] bg-white/90 border-none font-['Roboto'] text-[0.86rem] text-[#333] outline-none"
                />
              </div>
            </div>

            <span className="block font-['Oswald',sans-serif] text-[0.8rem] text-[#f0c040] uppercase tracking-[1.5px] mt-3.5 mb-2">
              Date Range (Reported)
            </span>
            <div className="mb-2.5 text-white text-[0.85rem] flex flex-wrap gap-2 items-center">
              From: <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="p-[4px_8px] text-[#333] bg-white/90" />
              To: <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="p-[4px_8px] text-[#333] bg-white/90" />
            </div>

            <div className="mt-2">
              <button
                onClick={clearFilters}
                className="inline-block p-[8px_18px] border border-white/25 font-['Oswald',sans-serif] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer bg-white/18 text-white hover:bg-white/28"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Reports Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse bg-black/35 mt-2.5 text-left min-w-[850px]">
            <thead>
              <tr className="bg-black/55 text-white font-['Oswald',sans-serif] text-[0.88rem] font-semibold uppercase tracking-[1px]">
                <th className="p-[11px_13px] border border-white/15">ID</th>
                <th className="p-[11px_13px] border border-white/15">User ID</th>
                <th className="p-[11px_13px] border border-white/15">Username</th>
                <th className="p-[11px_13px] border border-white/15">Email</th>
                <th className="p-[11px_13px] border border-white/15">Latitude</th>
                <th className="p-[11px_13px] border border-white/15">Longitude</th>
                <th className="p-[11px_13px] border border-white/15">Hazard Type</th>
                <th className="p-[11px_13px] border border-white/15">Reported At</th>
                <th className="p-[11px_13px] border border-white/15">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-white/50 italic p-4 text-[0.88rem]">
                    No hazard reports found.
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-white/12 hover:bg-white/9 transition-colors odd:bg-transparent even:bg-white/5 text-[0.85rem] align-middle"
                  >
                    <td className="p-2.5 border border-white/12">{r.id}</td>
                    <td className="p-2.5 border border-white/12">{r.user_id}</td>
                    <td className="p-2.5 border border-white/12">{r.username || 'N/A'}</td>
                    <td className="p-2.5 border border-white/12">{r.email || 'N/A'}</td>
                    <td className="p-2.5 border border-white/12">{r.latitude}</td>
                    <td className="p-2.5 border border-white/12">{r.longitude}</td>
                    <td className="p-2.5 border border-white/12">
                      {editingId === r.id ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="p-[6px_8px] bg-white/92 border-none font-['Roboto'] text-[0.85rem] text-[#333] outline-none"
                        >
                          {HAZARD_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      ) : (
                        r.hazardType
                      )}
                    </td>
                    <td className="p-2.5 border border-white/12">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="p-2.5 border border-white/12 whitespace-nowrap">
                      {editingId === r.id ? (
                        <>
                          <button
                            onClick={() => saveHazardType(r.id)}
                            className="inline-flex items-center gap-1 p-[6px_12px] bg-[#1a5fa8] text-white text-[0.75rem] uppercase tracking-wider font-semibold hover:bg-[#2272c3] mr-1"
                          >
                            <Check className="w-3 h-3" /> Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1 p-[6px_12px] border border-white/25 text-white/80 text-[0.75rem] uppercase tracking-wider font-semibold hover:bg-white/10"
                          >
                            <X className="w-3 h-3" /> Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(r)}
                            className="inline-flex items-center gap-1 p-[6px_12px] bg-[#1a5fa8] text-white text-[0.75rem] uppercase tracking-wider font-semibold hover:bg-[#2272c3] mr-1"
                          >
                            <Pencil className="w-3 h-3" /> Edit Type
                          </button>
                          <button
                            onClick={() => deleteReport(r.id)}
                            className="inline-flex items-center gap-1 p-[6px_12px] bg-[#cc2222] text-white text-[0.75rem] uppercase tracking-wider font-semibold hover:bg-[#ee3333]"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
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

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 text-white p-[11px_20px] font-['Oswald'] text-[0.88rem] tracking-[1px] z-[999] transition-all duration-300 ${
            toast.type === 'success' ? 'bg-[#1a7a3a]' : 'bg-[#cc2222]'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
