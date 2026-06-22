import React, { useState, useEffect } from 'react';
import { Settings, Trash2, ArrowLeft } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- TypeScript Interfaces ---
interface SavedRoute {
  route_id: number;
  user_id: number;
  start_location_id: number;
  end_location_id: number;
  distance: number | null;
  estimated_time: number | null;
  date_generated: string;
}

// Global Configuration Mock
const CONFIG = {
  API_BASE_URL: (window as any).CONFIG?.API_BASE_URL || 'http://localhost:5000',
};

const API = `${CONFIG.API_BASE_URL}/api/saved-routes`;

export default function SavedRoutes() {
  // --- State Hooks ---
  const [allRoutes, setAllRoutes] = useState<SavedRoute[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<SavedRoute[]>([]);
  
  // Filter Inputs State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterDistMin, setFilterDistMin] = useState('');
  const [filterDistMax, setFilterDistMax] = useState('');
  const [filterTimeMin, setFilterTimeMin] = useState('');
  const [filterTimeMax, setFilterTimeMax] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // --- API: Load Remote Saved Routes ---
  const loadRoutes = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      if (data.success) {
        setAllRoutes(data.saved_routes);
      } else {
        // Explicit ID prevents duplicate alerts if tracking falls back here
        toast.error(`Failed to load routes: ${data.error}`, { id: 'fetch-status' });
      }
    } catch (e) {
      console.log('We got here');
      toast.error('Could not connect to server.', { id: 'fetch-status' });
    }
  };

  // --- API: Delete Target Saved Route ---
  const deleteRoute = async (id: number) => {
    if (!confirm(`Are you sure you want to delete route ${id}?`)) return;

    // Use a loading toast bound to an 'action-status' ID
    toast.loading('Deleting route...', { id: 'action-status' });

    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        // Reuses the same ID to instantly replace the loader with success feedback
        toast.success('Route deleted.', { id: 'action-status' });
        loadRoutes();
      } else {
        toast.error(`Failed to delete route: ${data.error}`, { id: 'action-status' });
      }
    } catch (e) {
      toast.error('Delete failed.', { id: 'action-status' });
    }
  };

  // --- Lifecycle Initial Load ---
  useEffect(() => {
    loadRoutes();
  }, []);

  // --- Dynamic Filter Engine ---
  useEffect(() => {
    const filtered = allRoutes.filter((r) => {
      if (searchQuery && !String(r.user_id).toLowerCase().includes(searchQuery.toLowerCase())) return false;

      if (filterDateFrom && new Date(r.date_generated) < new Date(filterDateFrom)) return false;
      if (filterDateTo && new Date(r.date_generated) > new Date(filterDateTo)) return false;

      if (filterDistMin && (r.distance === null || parseFloat(r.distance.toString()) < parseFloat(filterDistMin))) return false;
      if (filterDistMax && (r.distance === null || parseFloat(r.distance.toString()) > parseFloat(filterDistMax))) return false;

      if (filterTimeMin && (r.estimated_time === null || parseInt(r.estimated_time.toString()) < parseInt(filterTimeMin))) return false;
      if (filterTimeMax && (r.estimated_time === null || parseInt(r.estimated_time.toString()) > parseInt(filterTimeMax))) return false;

      return true;
    });

    setFilteredRoutes(filtered);
  }, [allRoutes, searchQuery, filterDateFrom, filterDateTo, filterDistMin, filterDistMax, filterTimeMin, filterTimeMax]);

  // --- Clear Filter State Modifiers ---
  const clearFilters = () => {
    setSearchQuery('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDistMin('');
    setFilterDistMax('');
    setFilterTimeMin('');
    setFilterTimeMax('');
  };

  return (
    <div className="relative min-h-screen bg-[#1a1a1a] font-['Roboto',sans-serif] text-white overflow-x-hidden">
    

      {/* Styled Background Mask Layer */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center" 
        style={{ 
          backgroundImage: `url('background-image.jpeg')`,
          filter: 'brightness(0.52) saturate(0.8)'
        }} 
      />

      <div className="relative z-10 p-9 max-w-[1200px] mx-auto">
        <h1 className="font-['Oswald',sans-serif] text-[2.8rem] font-bold uppercase tracking-[2px] mb-1 text-white">
          Saved Routes
        </h1>
        <a 
          href="/admin" 
          className="inline-block mb-7 text-[#f0c040] text-[0.85rem] font-medium tracking-[1px] no-underline transition-colors duration-200 hover:text-white"
        >
          <ArrowLeft className="inline-block w-4 h-4 mr-1 alignment-baseline" /> Go Back to Home
        </a>

        <h2 className="font-['Oswald',sans-serif] text-[1.35rem] font-semibold uppercase tracking-[1px] mb-3.5 text-white">
          Route List
        </h2>

        {/* Toolbar & Filter Triggers */}
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <input 
            type="text" 
            placeholder="Search by user ID" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-[260px] p-[9px_12px] bg-white/92 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none"
          />
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)} 
            className="inline-flex items-center gap-1.5 p-[8px_18px] border border-white/25 font-['Oswald',sans-serif] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer transition-colors duration-200 bg-white/18 text-white hover:bg-white/28"
          >
            <Settings className="w-3.5 h-3.5" /> Filter
          </button>
        </div>

        {/* Filter Drawer Panel */}
        {isFilterOpen && (
          <div className="bg-black/60 border border-white/18 p-[18px_22px] mb-4 w-fit max-w-full text-white">
            <div className="mb-3">
              <span className="block font-['Oswald',sans-serif] text-[0.8rem] text-[#f0c040] uppercase tracking-[1.5px] mt-3 mb-2">
                Date Generated
              </span>
              <div className="text-white text-[0.85rem] flex flex-wrap gap-2 items-center">
                From: <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="p-[9px_12px] text-[#333] bg-white/92 border-none font-['Roboto'] text-[0.88rem] outline-none" />
                To: <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="p-[9px_12px] text-[#333] bg-white/92 border-none font-['Roboto'] text-[0.88rem] outline-none" />
              </div>
            </div>

            <div className="mb-3">
              <span className="block font-['Oswald',sans-serif] text-[0.8rem] text-[#f0c040] uppercase tracking-[1.5px] mt-3 mb-2">
                Distance (km)
              </span>
              <div className="text-white text-[0.85rem] flex flex-wrap gap-2 items-center">
                Min: <input type="number" min="0" step="0.1" value={filterDistMin} onChange={(e) => setFilterDistMin(e.target.value)} className="w-20 p-[9px_12px] text-[#333] bg-white/92 border-none font-['Roboto'] text-[0.88rem] outline-none" />
                Max: <input type="number" min="0" step="0.1" value={filterDistMax} onChange={(e) => setFilterDistMax(e.target.value)} className="w-20 p-[9px_12px] text-[#333] bg-white/92 border-none font-['Roboto'] text-[0.88rem] outline-none" />
              </div>
            </div>

            <div className="mb-3">
              <span className="block font-['Oswald',sans-serif] text-[0.8rem] text-[#f0c040] uppercase tracking-[1.5px] mt-3 mb-2">
                Estimated Time (minutes)
              </span>
              <div className="text-white text-[0.85rem] flex flex-wrap gap-2 items-center">
                Min: <input type="number" min="0" value={filterTimeMin} onChange={(e) => setFilterTimeMin(e.target.value)} className="w-20 p-[9px_12px] text-[#333] bg-white/92 border-none font-['Roboto'] text-[0.88rem] outline-none" />
                Max: <input type="number" min="0" value={filterTimeMax} onChange={(e) => setFilterTimeMax(e.target.value)} className="w-20 p-[9px_12px] text-[#333] bg-white/92 border-none font-['Roboto'] text-[0.88rem] outline-none" />
              </div>
            </div>

            <div className="mt-[15px]">
              <button 
                onClick={clearFilters} 
                className="inline-block p-[8px_18px] border border-white/25 font-['Oswald',sans-serif] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer bg-white/18 text-white hover:bg-white/28"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Data Layout Table */}
        <table className="w-full border-collapse bg-black/35 mt-2.5 text-left">
          <thead>
            <tr className="bg-black/55 text-white font-['Oswald',sans-serif] text-[0.88rem] font-semibold uppercase tracking-[1px]">
              <th className="p-[11px_13px] border border-white/15">ID</th>
              <th className="p-[11px_13px] border border-white/15">User ID</th>
              <th className="p-[11px_13px] border border-white/15">Start Location ID</th>
              <th className="p-[11px_13px] border border-white/15">End Location ID</th>
              <th className="p-[11px_13px] border border-white/15">Distance (km)</th>
              <th className="p-[11px_13px] border border-white/15">Estimated Time (min)</th>
              <th className="p-[11px_13px] border border-white/15">Date Generated</th>
              <th className="p-[11px_13px] border border-white/15">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoutes.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-white/50 italic p-4 text-[0.88rem]">
                  No saved routes.
                </td>
              </tr>
            ) : (
              filteredRoutes.map((r) => (
                <tr 
                  key={r.route_id} 
                  className="border-b border-white/12 hover:bg-white/9 transition-colors odd:bg-transparent even:bg-white/5 text-[0.85rem] vertical-middle"
                >
                  <td className="p-2.5 border border-white/12">{r.route_id}</td>
                  <td className="p-2.5 border border-white/12">{r.user_id}</td>
                  <td className="p-2.5 border border-white/12">{r.start_location_id}</td>
                  <td className="p-2.5 border border-white/12">{r.end_location_id}</td>
                  <td className="p-2.5 border border-white/12">
                    {r.distance !== null ? parseFloat(r.distance.toString()).toFixed(2) : 'N/A'}
                  </td>
                  <td className="p-2.5 border border-white/12">
                    {r.estimated_time !== null ? r.estimated_time : 'N/A'}
                  </td>
                  <td className="p-2.5 border border-white/12">
                    {r.date_generated ? new Date(r.date_generated).toLocaleString() : 'N/A'}
                  </td>
                  <td className="p-2.5 border border-white/12">
                    <button 
                      onClick={() => deleteRoute(r.route_id)} 
                      className="inline-flex items-center gap-1 p-[6px_12px] bg-[#cc2222] text-white text-[0.75rem] uppercase tracking-wider font-semibold hover:bg-[#ee3333] border-none cursor-pointer transition-colors"
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
    </div>
  );
}