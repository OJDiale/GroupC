import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Trash2, KeyRound, AlertTriangle, X, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * BACKEND ENDPOINTS (Express + MySQL) — confirmed against user.routes.js
 * ------------------------------------------------------------------
 * GET    /api/users/drivers          (authenticateToken, adminWare)
 *    -> { success: true, drivers: Driver[] }
 *    Joins `driver` to `user`; admins never appear in this list.
 *
 * PUT    /api/users/:user_id/password  (authenticateToken, adminWare)
 *    body: { password: string }
 *    -> { success: true, message?: string }
 *    Updates ONLY the password column on `user`.
 *
 * DELETE /api/users/:user_id          (authenticateToken, adminWare)
 *    -> { success: true, message?: string }
 *    Deletes the row from `user`; FK cascades remove the matching
 *    `driver` row automatically.
 * ------------------------------------------------------------------
 */

interface Driver {
  driver_id: number;
  user_id: number;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  date_created: string;
  last_login: string | null;
}

interface FilterState {
  driverId: string;
  userId: string;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
}

const EMPTY_FILTERS: FilterState = {
  driverId: '',
  userId: '',
  username: '',
  email: '',
  firstname: '',
  lastname: '',
};

const CONFIG = {
  API_BASE_URL: (window as any).CONFIG?.API_BASE_URL || 'https://mapper-backend-brkn.onrender.com',
};

const DRIVERS_API = `${CONFIG.API_BASE_URL}/api/users/drivers`;
const USERS_API = `${CONFIG.API_BASE_URL}/api/users`;

export default function DriverManagement() {
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [openPasswordPanel, setOpenPasswordPanel] = useState<{ [userId: number]: boolean }>({});
  const [passwordInputs, setPasswordInputs] = useState<{ [userId: number]: { password: string; confirm: string } }>({});

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; targetDriver: Driver | null }>({
    isOpen: false,
    targetDriver: null,
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const loadDrivers = async () => {
    try {
      const res = await fetch(DRIVERS_API, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAllDrivers(data.drivers || []);
      } else {
        toast.error(`Failed to load drivers: ${data.message || data.error || 'Unauthorized access'}`, { id: 'driver-fetch' });
      }
    } catch (e) {
      toast.error('Could not connect to backend.', { id: 'driver-fetch' });
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  // --- Filtering ---
  const filteredDrivers = useMemo(() => {
    return allDrivers.filter((d) => {
      if (filters.driverId && String(d.driver_id) !== filters.driverId) return false;
      if (filters.userId && String(d.user_id) !== filters.userId) return false;
      if (filters.username && !d.username?.toLowerCase().includes(filters.username.toLowerCase())) return false;
      if (filters.email && !d.email?.toLowerCase().includes(filters.email.toLowerCase())) return false;
      if (filters.firstname && !d.firstname?.toLowerCase().includes(filters.firstname.toLowerCase())) return false;
      if (filters.lastname && !d.lastname?.toLowerCase().includes(filters.lastname.toLowerCase())) return false;
      return true;
    });
  }, [allDrivers, filters]);

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  // --- Password update (the only editable field) ---
  const togglePasswordPanel = (userId: number) => {
    setOpenPasswordPanel((prev) => ({ ...prev, [userId]: !prev[userId] }));
    setPasswordInputs((prev) => ({ ...prev, [userId]: { password: '', confirm: '' } }));
  };

  const handlePasswordInput = (userId: number, field: 'password' | 'confirm', value: string) => {
    setPasswordInputs((prev) => ({
      ...prev,
      [userId]: { ...(prev[userId] || { password: '', confirm: '' }), [field]: value },
    }));
  };

  const updatePassword = async (userId: number) => {
    const entry = passwordInputs[userId] || { password: '', confirm: '' };

    if (!entry.password || entry.password.length < 6) {
      toast.error('Password must be at least 6 characters.', { id: 'validation' });
      return;
    }
    if (entry.password !== entry.confirm) {
      toast.error('Passwords do not match.', { id: 'validation' });
      return;
    }

    toast.loading('Updating password...', { id: 'driver-action' });

    try {
      const res = await fetch(`${USERS_API}/${userId}/password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ password: entry.password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Password updated.', { id: 'driver-action' });
        setOpenPasswordPanel((prev) => ({ ...prev, [userId]: false }));
        setPasswordInputs((prev) => ({ ...prev, [userId]: { password: '', confirm: '' } }));
      } else {
        toast.error(`Failed to update password: ${data.message || data.error || 'Operation denied'}`, { id: 'driver-action' });
      }
    } catch (e) {
      toast.error('Update request failed.', { id: 'driver-action' });
    }
  };

  // --- Delete ---
  const executeDeleteUser = async () => {
    if (!deleteModal.targetDriver) return;
    const userId = deleteModal.targetDriver.user_id;

    toast.loading('Deleting driver account...', { id: 'driver-action' });

    try {
      const res = await fetch(`${USERS_API}/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || 'Driver account deleted.', { id: 'driver-action' });
        setDeleteModal({ isOpen: false, targetDriver: null });
        loadDrivers();
      } else {
        toast.error(`Delete rejected: ${data.message || data.error || 'Forbidden'}`, { id: 'driver-action' });
      }
    } catch (e) {
      toast.error('Delete request failed.', { id: 'driver-action' });
    }
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

      <div className="relative z-10 p-9 max-w-[1300px] mx-auto">
        <h1 className="font-['Oswald',sans-serif] text-[2.8rem] font-bold uppercase tracking-[2px] mb-1">
          Driver Management
        </h1>
        <a
          href="/admin"
          className="inline-block mb-7 text-[#f0c040] text-[0.85rem] font-medium tracking-[1px] no-underline transition-colors duration-200 hover:text-white"
        >
          <ArrowLeft className="inline-block w-4 h-4 mr-1 align-baseline" /> Go Back to Home
        </a>

        <h2 className="font-['Oswald',sans-serif] text-[1.35rem] font-semibold uppercase tracking-[1px] mb-3.5">
          Driver List
        </h2>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <input
            type="text"
            placeholder="Quick search by username"
            value={filters.username}
            onChange={(e) => setFilters((prev) => ({ ...prev, username: e.target.value }))}
            className="min-w-[260px] p-[9px_12px] bg-white/92 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none placeholder-[#888]"
          />
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="inline-flex items-center gap-1.5 p-[8px_18px] border border-white/25 font-['Oswald',sans-serif] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer transition-colors duration-200 bg-white/18 text-white hover:bg-white/28"
          >
            <Settings className="w-3.5 h-3.5" /> Filter
          </button>
        </div>

        {/* Filter Drawer */}
        {isFilterOpen && (
          <div className="bg-black/60 border border-white/18 p-[18px_22px] mb-4 w-fit max-w-full text-white">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5">
              <div>
                <label className="font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                  Driver ID
                </label>
                <input
                  type="number"
                  placeholder="Driver ID"
                  value={filters.driverId}
                  onChange={(e) => setFilters((prev) => ({ ...prev, driverId: e.target.value }))}
                  className="w-full p-[8px_10px] bg-white/92 border-none font-['Roboto'] text-[0.86rem] text-[#333] outline-none"
                />
              </div>
              <div>
                <label className="font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                  User ID
                </label>
                <input
                  type="number"
                  placeholder="User ID"
                  value={filters.userId}
                  onChange={(e) => setFilters((prev) => ({ ...prev, userId: e.target.value }))}
                  className="w-full p-[8px_10px] bg-white/92 border-none font-['Roboto'] text-[0.86rem] text-[#333] outline-none"
                />
              </div>
              <div>
                <label className="font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                  Email
                </label>
                <input
                  type="text"
                  placeholder="Email contains..."
                  value={filters.email}
                  onChange={(e) => setFilters((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full p-[8px_10px] bg-white/92 border-none font-['Roboto'] text-[0.86rem] text-[#333] outline-none"
                />
              </div>
              <div>
                <label className="font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="First name contains..."
                  value={filters.firstname}
                  onChange={(e) => setFilters((prev) => ({ ...prev, firstname: e.target.value }))}
                  className="w-full p-[8px_10px] bg-white/92 border-none font-['Roboto'] text-[0.86rem] text-[#333] outline-none"
                />
              </div>
              <div>
                <label className="font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Last name contains..."
                  value={filters.lastname}
                  onChange={(e) => setFilters((prev) => ({ ...prev, lastname: e.target.value }))}
                  className="w-full p-[8px_10px] bg-white/92 border-none font-['Roboto'] text-[0.86rem] text-[#333] outline-none"
                />
              </div>
            </div>

            <div className="mt-3.5">
              <button
                onClick={clearFilters}
                className="inline-block p-[8px_18px] border border-white/25 font-['Oswald',sans-serif] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer bg-white/18 text-white hover:bg-white/28"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse bg-black/35 text-left min-w-[800px]">
            <thead>
              <tr className="bg-black/55 text-white font-['Oswald',sans-serif] text-[0.85rem] font-semibold uppercase tracking-[1px]">
                <th className="p-[10px_12px] border border-white/15">Driver ID</th>
                <th className="p-[10px_12px] border border-white/15">User ID</th>
                <th className="p-[10px_12px] border border-white/15">First Name</th>
                <th className="p-[10px_12px] border border-white/15">Last Name</th>
                <th className="p-[10px_12px] border border-white/15">Username</th>
                <th className="p-[10px_12px] border border-white/15">Email</th>
                <th className="p-[10px_12px] border border-white/15">Created At</th>
                <th className="p-[10px_12px] border border-white/15">Last Login</th>
                <th className="p-[10px_12px] border border-white/15">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-white/55 italic p-4 text-[0.84rem]">
                    No drivers found.
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((d) => (
                  <React.Fragment key={d.driver_id}>
                    <tr className="hover:bg-white/9 border-b border-white/12 transition-colors odd:bg-transparent even:bg-white/5 text-[0.84rem] align-middle">
                      <td className="p-[9px_12px] border border-white/12">{d.driver_id}</td>
                      <td className="p-[9px_12px] border border-white/12">{d.user_id}</td>
                      <td className="p-[9px_12px] border border-white/12">{d.firstname}</td>
                      <td className="p-[9px_12px] border border-white/12">{d.lastname}</td>
                      <td className="p-[9px_12px] border border-white/12">{d.username}</td>
                      <td className="p-[9px_12px] border border-white/12">{d.email}</td>
                      <td className="p-[9px_12px] border border-white/12">
                        {d.date_created ? new Date(d.date_created).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-[9px_12px] border border-white/12">
                        {d.last_login ? new Date(d.last_login).toLocaleString() : 'Never'}
                      </td>
                      <td className="p-[9px_12px] border border-white/12 whitespace-nowrap">
                        <button
                          onClick={() => togglePasswordPanel(d.user_id)}
                          className="inline-flex items-center gap-1 p-[7px_13px] bg-[#1a5fa8] text-white font-['Oswald'] text-[0.75rem] font-semibold tracking-[1.5px] uppercase cursor-pointer hover:bg-[#2272c3] border-none mr-1 transition-colors"
                        >
                          <KeyRound className="w-3 h-3" /> Password
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, targetDriver: d })}
                          className="inline-flex items-center gap-1 p-[7px_13px] bg-[#cc2222] text-white font-['Oswald'] text-[0.75rem] font-semibold tracking-[1.5px] uppercase cursor-pointer hover:bg-[#ee3333] border-none transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </td>
                    </tr>

                    {openPasswordPanel[d.user_id] && (
                      <tr className="bg-black/50">
                        <td colSpan={9} className="p-[14px_16px] border border-white/12 bg-black/50">
                          <div className="flex flex-wrap gap-2.5 items-end">
                            <div className="inline-block m-[4px_10px_4px_0]">
                              <label className="font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-0.5 tracking-[1px] uppercase">
                                New Password
                              </label>
                              <input
                                type="password"
                                placeholder="New password"
                                value={passwordInputs[d.user_id]?.password || ''}
                                onChange={(e) => handlePasswordInput(d.user_id, 'password', e.target.value)}
                                className="w-[180px] p-[9px_12px] bg-white/92 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none"
                              />
                            </div>
                            <div className="inline-block m-[4px_10px_4px_0]">
                              <label className="font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-0.5 tracking-[1px] uppercase">
                                Confirm Password
                              </label>
                              <input
                                type="password"
                                placeholder="Confirm password"
                                value={passwordInputs[d.user_id]?.confirm || ''}
                                onChange={(e) => handlePasswordInput(d.user_id, 'confirm', e.target.value)}
                                className="w-[180px] p-[9px_12px] bg-white/92 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none"
                              />
                            </div>
                            <button
                              onClick={() => updatePassword(d.user_id)}
                              className="p-[9px_16px] bg-[#1a5fa8] text-white font-['Oswald'] text-[0.75rem] font-semibold tracking-[1.5px] uppercase hover:bg-[#2272c3] border-none cursor-pointer transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => togglePasswordPanel(d.user_id)}
                              className="p-[9px_16px] bg-transparent text-white/70 hover:text-white font-['Oswald'] text-[0.75rem] font-semibold tracking-[1.5px] uppercase border border-white/25 cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.targetDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#222] border border-white/10 p-6 shadow-2xl text-left">
            <button
              onClick={() => setDeleteModal({ isOpen: false, targetDriver: null })}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-950 text-red-400 rounded-lg shrink-0 border border-red-900/50">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-['Oswald',sans-serif] text-xl font-semibold uppercase tracking-[1px] text-white">
                  Confirm Deletion
                </h3>
                <p className="text-sm text-white/60 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete driver account{' '}
                  <span className="text-[#f0c040] font-mono font-bold">@{deleteModal.targetDriver.username}</span>?
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
              <button
                onClick={() => setDeleteModal({ isOpen: false, targetDriver: null })}
                className="px-4 py-2 bg-transparent text-white/70 hover:text-white text-xs tracking-[1px] font-semibold uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteUser}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#cc2222] hover:bg-[#ee3333] text-white font-['Oswald'] text-xs font-semibold tracking-[1.5px] uppercase transition-colors shadow-lg shadow-red-900/20"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Driver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
