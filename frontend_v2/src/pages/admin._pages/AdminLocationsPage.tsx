import React, { useState, useEffect, useMemo } from 'react';

/**
 * BACKEND ENDPOINT (Express + MySQL) — confirmed against destination.routes.js
 * ------------------------------------------------------------------
 * GET /api/admin-user/destinations
 *    Mounted with (authenticateToken, authenticateAdmin) in server.js,
 *    so this call MUST send a Bearer token or it will 401/403.
 *    -> raw array, NOT wrapped in { success }:
 *       [{ id, userId, username, email, firstname, lastname,
 *          startLocation, endLocation, hazardBypassed, createdAt }, ...]
 *
 * This page is view-only by design (Task 3) — no PUT/DELETE calls are
 * made here even though a DELETE /api/admin-user/destinations/:id route
 * exists on the backend.
 * ------------------------------------------------------------------
 */

interface Destination {
  id: number;
  userId: number;
  username?: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  startLocation: string;
  endLocation: string;
  hazardBypassed: number;
  createdAt: string;
}

interface FilterState {
  userId: string;
  destinationId: string;
  email: string;
  username: string;
  firstname: string;
  lastname: string;
}

const EMPTY_FILTERS: FilterState = {
  userId: '',
  destinationId: '',
  email: '',
  username: '',
  firstname: '',
  lastname: '',
};

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | '';
}

const API_BASE_URL = (window as any).CONFIG?.API_BASE_URL || 'http://localhost:5000';
const API = `${API_BASE_URL}/api/admin-user/destinations`;

const LocationsPage: React.FC = () => {
  const [allDestinations, setAllDestinations] = useState<Destination[]>([]);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: '' });

  const triggerToast = (message: string, type: 'success' | 'error' | '' = '') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2500);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  // This route requires authenticateToken + authenticateAdmin and returns
  // a raw array (no { success } wrapper) — branch on res.ok instead.
  const loadDestinations = async () => {
    try {
      const res = await fetch(API, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) {
        setAllDestinations(Array.isArray(data) ? data : []);
      } else {
        triggerToast('Failed to load destinations: ' + (data.message || 'Unauthorized'), 'error');
      }
    } catch (e) {
      triggerToast('Could not connect to server.', 'error');
    }
  };

  useEffect(() => {
    loadDestinations();
  }, []);

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  // Filter first, then group what's left by user so each user's
  // destinations stay batched together.
  const groupedByUser = useMemo(() => {
    const filtered = allDestinations.filter((dest) => {
      if (filters.userId && String(dest.userId) !== filters.userId) return false;
      if (filters.destinationId && String(dest.id) !== filters.destinationId) return false;
      if (filters.email && !dest.email?.toLowerCase().includes(filters.email.toLowerCase())) return false;
      if (filters.username && !dest.username?.toLowerCase().includes(filters.username.toLowerCase())) return false;
      if (filters.firstname && !dest.firstname?.toLowerCase().includes(filters.firstname.toLowerCase())) return false;
      if (filters.lastname && !dest.lastname?.toLowerCase().includes(filters.lastname.toLowerCase())) return false;
      return true;
    });

    const groups = new Map<number, { user: Destination; destinations: Destination[] }>();
    filtered.forEach((dest) => {
      if (!groups.has(dest.userId)) {
        groups.set(dest.userId, { user: dest, destinations: [] });
      }
      groups.get(dest.userId)!.destinations.push(dest);
    });

    return Array.from(groups.values()).sort((a, b) => a.user.userId - b.user.userId);
  }, [allDestinations, filters]);

  return (
    <div className="relative min-h-screen font-sans bg-[#1a1a1a] overflow-x-hidden">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center brightness-[0.52] saturate-[0.8]"
        style={{ backgroundImage: `url('background-image.jpeg')` }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-12 py-9 max-md:px-6">
        <header>
          <h1 className="font-['Oswald'] text-[2.8rem] font-bold text-white uppercase tracking-[2px] mb-1 leading-tight">
            Destinations
          </h1>
          <a
            href="/admin"
            className="inline-block text-[#f0c040] text-[0.85rem] font-medium tracking-[1px] no-underline mb-7 transition-colors duration-200 hover:text-white"
          >
            &larr; Go Back to Home
          </a>
        </header>

        <main>
          <h2 className="font-['Oswald'] text-[1.35rem] font-semibold text-white uppercase tracking-[1px] mb-3">
            Logged Destinations
          </h2>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-2.5 items-center mb-3.5">
            <input
              type="text"
              placeholder="Search by username"
              value={filters.username}
              onChange={(e) => setFilters((prev) => ({ ...prev, username: e.target.value }))}
              className="min-w-[280px] p-[9px_12px] bg-white/92 border-none font-sans text-[0.88rem] text-[#333] placeholder-[#888] outline-none max-xs:min-w-full"
            />
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center gap-1.5 p-[8px_18px] border border-white/25 font-['Oswald'] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer transition-colors duration-200 bg-white/18 text-white hover:bg-white/28"
            >
              Filter
            </button>
          </div>

          {/* Filter Panel */}
          {isFilterOpen && (
            <div className="bg-black/60 border border-white/18 p-[18px_22px] mb-4 w-fit max-w-full text-white">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5">
                <div>
                  <label className="font-['Oswald'] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                    User ID
                  </label>
                  <input
                    type="number"
                    placeholder="User ID"
                    value={filters.userId}
                    onChange={(e) => setFilters((prev) => ({ ...prev, userId: e.target.value }))}
                    className="w-full p-[8px_10px] bg-white/92 border-none font-sans text-[0.86rem] text-[#333] outline-none"
                  />
                </div>
                <div>
                  <label className="font-['Oswald'] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                    Destination ID
                  </label>
                  <input
                    type="number"
                    placeholder="Destination ID"
                    value={filters.destinationId}
                    onChange={(e) => setFilters((prev) => ({ ...prev, destinationId: e.target.value }))}
                    className="w-full p-[8px_10px] bg-white/92 border-none font-sans text-[0.86rem] text-[#333] outline-none"
                  />
                </div>
                <div>
                  <label className="font-['Oswald'] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                    Email
                  </label>
                  <input
                    type="text"
                    placeholder="Email contains..."
                    value={filters.email}
                    onChange={(e) => setFilters((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full p-[8px_10px] bg-white/92 border-none font-sans text-[0.86rem] text-[#333] outline-none"
                  />
                </div>
                <div>
                  <label className="font-['Oswald'] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="First name contains..."
                    value={filters.firstname}
                    onChange={(e) => setFilters((prev) => ({ ...prev, firstname: e.target.value }))}
                    className="w-full p-[8px_10px] bg-white/92 border-none font-sans text-[0.86rem] text-[#333] outline-none"
                  />
                </div>
                <div>
                  <label className="font-['Oswald'] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Last name contains..."
                    value={filters.lastname}
                    onChange={(e) => setFilters((prev) => ({ ...prev, lastname: e.target.value }))}
                    className="w-full p-[8px_10px] bg-white/92 border-none font-sans text-[0.86rem] text-[#333] outline-none"
                  />
                </div>
              </div>

              <div className="mt-3.5">
                <button
                  onClick={clearFilters}
                  className="inline-block p-[8px_18px] border border-white/25 font-['Oswald'] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer bg-white/18 text-white hover:bg-white/28"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Grouped Destination Tables */}
          {groupedByUser.length === 0 ? (
            <div className="p-[14px_16px] text-center text-white/55 italic text-[0.88rem] bg-black/35 border border-white/12">
              No destinations found.
            </div>
          ) : (
            groupedByUser.map((group) => (
              <div key={group.user.userId} className="mb-6">
                {/* User header bar */}
                <div className="bg-[#f0c040]/15 border border-[#f0c040]/40 p-[10px_14px] mb-[-1px] flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="font-['Oswald'] text-[1rem] font-semibold text-[#f0c040] uppercase tracking-[1px]">
                    {group.user.firstname || ''} {group.user.lastname || ''}
                  </span>
                  <span className="text-white/80 text-[0.85rem]">@{group.user.username || 'unknown'}</span>
                  <span className="text-white/60 text-[0.85rem]">{group.user.email || 'no email'}</span>
                  <span className="text-white/50 text-[0.8rem]">User ID: {group.user.userId}</span>
                  <span className="text-white/50 text-[0.8rem] ml-auto">
                    {group.destinations.length} destination{group.destinations.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full border-collapse bg-black/35">
                    <thead>
                      <tr className="bg-black/50">
                        <th className="font-['Oswald'] text-[0.85rem] font-semibold text-white uppercase tracking-[1px] p-[10px_13px] text-left border border-white/15">Destination ID</th>
                        <th className="font-['Oswald'] text-[0.85rem] font-semibold text-white uppercase tracking-[1px] p-[10px_13px] text-left border border-white/15">Start Location</th>
                        <th className="font-['Oswald'] text-[0.85rem] font-semibold text-white uppercase tracking-[1px] p-[10px_13px] text-left border border-white/15">End Location</th>
                        <th className="font-['Oswald'] text-[0.85rem] font-semibold text-white uppercase tracking-[1px] p-[10px_13px] text-left border border-white/15">Hazards Bypassed</th>
                        <th className="font-['Oswald'] text-[0.85rem] font-semibold text-white uppercase tracking-[1px] p-[10px_13px] text-left border border-white/15">Logged At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.destinations.map((dest) => (
                        <tr key={dest.id} className="even:bg-white/5 hover:bg-white/9 transition-colors duration-150">
                          <td className="p-[10px_13px] text-white text-[0.86rem] border border-white/12 align-middle">{dest.id}</td>
                          <td className="p-[10px_13px] text-white text-[0.86rem] border border-white/12 align-middle">{dest.startLocation || 'N/A'}</td>
                          <td className="p-[10px_13px] text-white text-[0.86rem] border border-white/12 align-middle">{dest.endLocation || 'N/A'}</td>
                          <td className="p-[10px_13px] text-white text-[0.86rem] border border-white/12 align-middle">{dest.hazardBypassed}</td>
                          <td className="p-[10px_13px] text-white text-[0.86rem] border border-white/12 align-middle">
                            {dest.createdAt ? new Date(dest.createdAt).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </main>
      </div>

      {/* Toast */}
      <div
        className={`fixed bottom-6 right-6 p-[11px_20px] font-['Oswald'] text-[0.88rem] tracking-[1px] text-white z-[999] pointer-events-none transition-all duration-300 ${
          toast.type === 'success' ? 'bg-[#1a7a3a]' : 'bg-[#cc2222]'
        } ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      >
        {toast.message}
      </div>
    </div>
  );
};

export default LocationsPage;
