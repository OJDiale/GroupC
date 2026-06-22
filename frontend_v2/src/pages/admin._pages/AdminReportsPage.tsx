import React, { useState, useEffect } from 'react';
import { Settings, Trash2, ArrowLeft } from 'lucide-react';

// --- TypeScript Interfaces ---
interface Report {
  report_id: number;
  user_id: number;
  location_id: number;
  description: string;
  timestamp: string;
}

// Global Configuration Mock
const CONFIG = {
  API_BASE_URL: (window as any).CONFIG?.API_BASE_URL || 'http://localhost:5000',
};

const API = `${CONFIG.API_BASE_URL}/api/reports`;

export default function UserReports() {
  // --- State Hooks ---
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  
  // Filter Fields State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Notification Toast State
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  // --- Helper: Toast Alert System ---
  const showToast = (msg: string, type = '') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // --- API Actions ---
  const loadReports = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      if (data.success) {
        setAllReports(data.reports);
      } else {
        alert('Failed to load reports: ' + data.error);
      }
    } catch (e) {
      alert('Could not connect to server.');
    }
  };

  const deleteReport = async (id: number) => {
    if (!confirm(`Are you sure you want to delete report ${id}?`)) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Report deleted.');
        loadReports();
      } else {
        alert('Failed to delete report: ' + data.error);
      }
    } catch (e) {
      alert('Delete failed.');
    }
  };

  // --- Lifecycle Initial Load ---
  useEffect(() => {
    loadReports();
  }, []);

  // --- Dynamic Filter Engine ---
  useEffect(() => {
    const filtered = allReports.filter((r) => {
      if (searchQuery && !r.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filterDateFrom && new Date(r.timestamp) < new Date(filterDateFrom)) {
        return false;
      }
      if (filterDateTo && new Date(r.timestamp) > new Date(filterDateTo)) {
        return false;
      }
      if (filterUserId && String(r.user_id) !== filterUserId) {
        return false;
      }
      return true;
    });

    setFilteredReports(filtered);
  }, [allReports, searchQuery, filterDateFrom, filterDateTo, filterUserId]);

  // --- Clear Filter UI Action ---
  const clearFilters = () => {
    setSearchQuery('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterUserId('');
  };

  return (
    <div className="relative min-h-screen bg-[#1a1a1a] font-['Roboto',sans-serif] text-white overflow-x-hidden">
      {/* Background Layer matching your design specifications */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center" 
        style={{ 
          backgroundImage: `url('background-image.jpeg')`,
          filter: 'brightness(0.52) saturate(0.8)'
        }} 
      />

      <div className="relative z-10 p-9 max-w-[1200px] mx-auto">
        <h1 className="font-['Oswald',sans-serif] text-[2.8rem] font-bold uppercase tracking-[2px] mb-1">
          User Reports
        </h1>
        <a 
          href="/admin" 
          className="inline-block mb-7 text-[#f0c040] text-[0.85rem] font-medium tracking-[1px] no-underline transition-colors duration-200 hover:text-white"
        >
          <ArrowLeft className="inline-block w-4 h-4 mr-1 alignment-baseline" /> Go Back to Home
        </a>

        <h2 className="font-['Oswald',sans-serif] text-[1.35rem] font-semibold uppercase tracking-[1px] mb-3.5">
          Report List
        </h2>

        {/* Toolbar Component Structure */}
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <input 
            type="text" 
            placeholder="Search by description" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            <span className="block font-['Oswald',sans-serif] text-[0.8rem] text-[#f0c040] uppercase tracking-[1.5px] mt-3 mb-2">
              Date Range
            </span>
            <div className="mb-2.5 text-white text-[0.85rem] flex flex-wrap gap-2 items-center">
              From: <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="p-[4px_8px] text-[#333] bg-white/90" />
              To: <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="p-[4px_8px] text-[#333] bg-white/90" />
            </div>

            <span className="block font-['Oswald',sans-serif] text-[0.8rem] text-[#f0c040] uppercase tracking-[1.5px] mt-3 mb-2">
              User ID
            </span>
            <input 
              type="number" 
              placeholder="Filter by user ID" 
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="w-[140px] mb-3.5 p-[9px_12px] bg-white/90 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none"
            />

            <div>
              <button 
                onClick={clearFilters} 
                className="inline-block p-[8px_18px] border border-white/25 font-['Oswald',sans-serif] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer bg-white/18 text-white hover:bg-white/28"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Reports Core View Table */}
        <table className="w-full border-collapse bg-black/35 mt-2.5 text-left">
          <thead>
            <tr className="bg-black/55 text-white font-['Oswald',sans-serif] text-[0.88rem] font-semibold uppercase tracking-[1px]">
              <th className="p-[11px_13px] border border-white/15">ID</th>
              <th className="p-[11px_13px] border border-white/15">User ID</th>
              <th className="p-[11px_13px] border border-white/15">Location ID</th>
              <th className="p-[11px_13px] border border-white/15">Description</th>
              <th className="p-[11px_13px] border border-white/15">Timestamp</th>
              <th className="p-[11px_13px] border border-white/15">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-white/50 italic p-4 text-[0.88rem]">
                  No reports found.
                </td>
              </tr>
            ) : (
              filteredReports.map((r) => (
                <tr 
                  key={r.report_id} 
                  className="border-b border-white/12 hover:bg-white/9 transition-colors odd:bg-transparent even:bg-white/5 text-[0.85rem] vertical-middle"
                >
                  <td className="p-2.5 border border-white/12">{r.report_id}</td>
                  <td className="p-2.5 border border-white/12">{r.user_id}</td>
                  <td className="p-2.5 border border-white/12">{r.location_id}</td>
                  <td className="p-2.5 border border-white/12">{r.description}</td>
                  <td className="p-2.5 border border-white/12">
                    {r.timestamp ? new Date(r.timestamp).toLocaleString() : 'N/A'}
                  </td>
                  <td className="p-2.5 border border-white/12">
                    <button 
                      onClick={() => deleteReport(r.report_id)} 
                      className="inline-flex items-center gap-1 p-[6px_12px] bg-[#cc2222] text-white text-[0.75rem] uppercase tracking-wider font-semibold hover:bg-[#ee3333]"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Floating System Notification Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 text-white p-[11px_20px] font-['Oswald'] text-[0.88rem] tracking-[1px] z-[999] transition-all duration-300 ${
          toast.type === 'success' ? 'bg-[#1a7a3a]' : 'bg-[#cc2222]'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}