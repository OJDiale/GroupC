import React, { useState, useEffect, useMemo } from 'react';
import { Filter as FilterIcon } from 'lucide-react';
import AdminShell from '@/components/AdminShell';

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

const API_BASE_URL = (window as unknown as { CONFIG?: { API_BASE_URL?: string } }).CONFIG?.API_BASE_URL || 'https://mapper-backend-brkn.onrender.com';
const API = `${API_BASE_URL}/api/admin-user/destinations`;

const inputClass = "w-full h-10 px-3 bg-white border border-brand-border rounded-lg text-sm text-brand-ink placeholder:text-brand-muted outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue";
const labelClass = "text-[11px] font-bold uppercase tracking-wide text-brand-muted block mb-1";

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
    <AdminShell
      title="Destinations"
      subtitle="Logged user destinations, grouped by driver."
      headerActions={
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-ink text-white text-sm font-semibold hover:bg-brand-blue-dark"
        >
          <FilterIcon size={14} /> Filter
        </button>
      }
    >
      <input
        type="text"
        placeholder="Search by username"
        value={filters.username}
        onChange={(e) => setFilters((prev) => ({ ...prev, username: e.target.value }))}
        className={`${inputClass} max-w-sm`}
      />

      {isFilterOpen && (
        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>User ID</label>
              <input type="number" placeholder="User ID" value={filters.userId} onChange={(e) => setFilters((prev) => ({ ...prev, userId: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Destination ID</label>
              <input type="number" placeholder="Destination ID" value={filters.destinationId} onChange={(e) => setFilters((prev) => ({ ...prev, destinationId: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="text" placeholder="Email contains..." value={filters.email} onChange={(e) => setFilters((prev) => ({ ...prev, email: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>First Name</label>
              <input type="text" placeholder="First name contains..." value={filters.firstname} onChange={(e) => setFilters((prev) => ({ ...prev, firstname: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input type="text" placeholder="Last name contains..." value={filters.lastname} onChange={(e) => setFilters((prev) => ({ ...prev, lastname: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 rounded-lg border border-brand-border text-sm font-semibold text-brand-muted hover:text-brand-ink hover:border-brand-ink"
          >
            Clear Filters
          </button>
        </div>
      )}

      {groupedByUser.length === 0 ? (
        <div className="p-6 text-center text-brand-muted italic text-sm bg-white border border-brand-border rounded-2xl">
          No destinations found.
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByUser.map((group) => (
            <div key={group.user.userId} className="border border-brand-border rounded-2xl overflow-hidden">
              <div className="bg-brand-blue-soft p-3 px-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-bold text-brand-ink">
                  {group.user.firstname || ''} {group.user.lastname || ''}
                </span>
                <span className="text-brand-ink/70 text-sm">@{group.user.username || 'unknown'}</span>
                <span className="text-brand-ink/60 text-sm">{group.user.email || 'no email'}</span>
                <span className="text-brand-ink/50 text-xs">User ID: {group.user.userId}</span>
                <span className="text-brand-ink/50 text-xs ml-auto">
                  {group.destinations.length} destination{group.destinations.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-left min-w-[640px]">
                  <thead>
                    <tr className="bg-brand-bg text-brand-muted text-[11px] font-bold uppercase tracking-wide">
                      <th className="p-3">Destination ID</th>
                      <th className="p-3">Start Location</th>
                      <th className="p-3">End Location</th>
                      <th className="p-3">Hazards Bypassed</th>
                      <th className="p-3">Logged At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {group.destinations.map((dest) => (
                      <tr key={dest.id} className="hover:bg-brand-bg/60 transition-colors text-sm">
                        <td className="p-3">{dest.id}</td>
                        <td className="p-3">{dest.startLocation || 'N/A'}</td>
                        <td className="p-3">{dest.endLocation || 'N/A'}</td>
                        <td className="p-3">{dest.hazardBypassed}</td>
                        <td className="p-3">
                          {dest.createdAt ? new Date(dest.createdAt).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      <div
        className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-xl z-[999] pointer-events-none transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      >
        {toast.message}
      </div>
    </AdminShell>
  );
};

export default LocationsPage;
