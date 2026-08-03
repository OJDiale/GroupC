import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, KeyRound, AlertTriangle, X, Filter as FilterIcon, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePageTitle } from '@/lib/usePageTitle';
import { API_BASE_URL } from "@/lib/apiConfig";
import { downloadReportPdf } from '@/lib/pdfReport';
import Pagination from '@/components/Pagination';
import { formatDateTime } from '@/lib/formatDate';

const PAGE_SIZE = 7;

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
  API_BASE_URL,
};

const DRIVERS_API = `${CONFIG.API_BASE_URL}/api/users/drivers`;
const USERS_API = `${CONFIG.API_BASE_URL}/api/users`;

const inputClass = "w-full h-10 px-3 bg-white border border-brand-border rounded-lg text-sm text-brand-ink placeholder:text-brand-muted outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue";
const labelClass = "text-[11px] font-bold uppercase tracking-wide text-brand-muted block mb-1";

export default function DriverManagement() {
  usePageTitle("Driver Management");
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

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

  const pageCount = Math.max(1, Math.ceil(filteredDrivers.length / PAGE_SIZE));
  useEffect(() => { setPage(1); }, [filters]);
  const pagedDrivers = filteredDrivers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    <div className="space-y-4">
      <p className="text-brand-muted text-sm">Reset passwords and remove driver accounts.</p>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <input
          type="text"
          name="driver-quick-search"
          placeholder="Quick search by username"
          value={filters.username}
          onChange={(e) => setFilters((prev) => ({ ...prev, username: e.target.value }))}
          className={`${inputClass} max-w-sm`}
          autoComplete="off"
        />
        <div className="flex gap-2">
          <button
            onClick={() => downloadReportPdf({
              title: 'Driver Management Report', filename: 'driver-management-report.pdf',
              columns: ['Driver ID', 'User ID', 'First name', 'Last name', 'Username', 'Email', 'Created at', 'Last login'],
              rows: filteredDrivers.map((driver) => [driver.driver_id, driver.user_id, driver.firstname, driver.lastname, driver.username, driver.email, driver.date_created, driver.last_login]),
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
              <label className={labelClass}>Driver ID</label>
              <input type="number" placeholder="Driver ID" value={filters.driverId} onChange={(e) => setFilters((prev) => ({ ...prev, driverId: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>User ID</label>
              <input type="number" placeholder="User ID" value={filters.userId} onChange={(e) => setFilters((prev) => ({ ...prev, userId: e.target.value }))} className={inputClass} />
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

      <div className="border border-brand-border rounded-2xl overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[800px]">
            <thead>
              <tr className="bg-brand-bg text-brand-muted text-[10px] font-bold uppercase tracking-wide">
                <th className="p-2">Driver ID</th>
                <th className="p-2">User ID</th>
                <th className="p-2">First Name</th>
                <th className="p-2">Last Name</th>
                <th className="p-2">Username</th>
                <th className="p-2">Email</th>
                <th className="p-2">Created At</th>
                <th className="p-2">Last Login</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {pagedDrivers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-brand-muted italic p-6 text-xs">
                    No drivers found.
                  </td>
                </tr>
              ) : (
                pagedDrivers.map((d) => (
                  <React.Fragment key={d.driver_id}>
                    <tr className="hover:bg-brand-bg/60 transition-colors text-xs align-middle">
                      <td className="p-2">{d.driver_id}</td>
                      <td className="p-2">{d.user_id}</td>
                      <td className="p-2">{d.firstname}</td>
                      <td className="p-2">{d.lastname}</td>
                      <td className="p-2">{d.username}</td>
                      <td className="p-2">{d.email}</td>
                      <td className="p-2">
                        {formatDateTime(d.date_created)}
                      </td>
                      <td className="p-2">
                        {d.last_login ? formatDateTime(d.last_login) : 'Never'}
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        <button
                          onClick={() => togglePasswordPanel(d.user_id)}
                          title="password"
                          aria-label="password"
                          className="inline-flex items-center justify-center p-1.5 rounded-lg bg-brand-blue-soft text-brand-blue hover:bg-brand-blue hover:text-white mr-1.5 transition-colors"
                        >
                          <KeyRound size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, targetDriver: d })}
                          title="delete"
                          aria-label="delete"
                          className="inline-flex items-center justify-center p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>

                    {openPasswordPanel[d.user_id] && (
                      <tr className="bg-brand-bg/60">
                        <td colSpan={9} className="p-4">
                          {/* Its own <form> boundary + autoComplete="new-password" stops
                              Chrome's page-wide credential-autofill heuristic from reaching
                              into the unrelated search box above and filling it with the
                              admin's own saved login. */}
                          <form
                            onSubmit={(e) => { e.preventDefault(); updatePassword(d.user_id); }}
                            className="flex flex-wrap gap-3 items-end"
                          >
                            <div>
                              <label className={labelClass}>New Password</label>
                              <input
                                type="password"
                                name="new-password"
                                autoComplete="new-password"
                                placeholder="New password"
                                value={passwordInputs[d.user_id]?.password || ''}
                                onChange={(e) => handlePasswordInput(d.user_id, 'password', e.target.value)}
                                className={`${inputClass} w-44`}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Confirm Password</label>
                              <input
                                type="password"
                                name="confirm-password"
                                autoComplete="new-password"
                                placeholder="Confirm password"
                                value={passwordInputs[d.user_id]?.confirm || ''}
                                onChange={(e) => handlePasswordInput(d.user_id, 'confirm', e.target.value)}
                                className={`${inputClass} w-44`}
                              />
                            </div>
                            <button
                              type="submit"
                              className="h-10 px-4 rounded-lg bg-brand-ink text-white text-sm font-semibold hover:bg-brand-blue-dark"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => togglePasswordPanel(d.user_id)}
                              className="h-10 px-4 rounded-lg border border-brand-border text-sm font-semibold text-brand-muted hover:text-brand-ink"
                            >
                              Cancel
                            </button>
                          </form>
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
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.targetDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-brand-border p-6 shadow-2xl text-left">
            <button
              onClick={() => setDeleteModal({ isOpen: false, targetDriver: null })}
              className="absolute top-4 right-4 text-brand-muted hover:text-brand-ink transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Confirm Deletion</h3>
                <p className="text-sm text-brand-muted mt-1 leading-relaxed">
                  Are you sure you want to permanently delete driver account{' '}
                  <span className="text-brand-ink font-mono font-bold">@{deleteModal.targetDriver.username}</span>?
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-brand-border">
              <button
                onClick={() => setDeleteModal({ isOpen: false, targetDriver: null })}
                className="px-4 py-2 text-sm font-semibold text-brand-muted hover:text-brand-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteUser}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                <Trash2 size={14} /> Delete Driver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
