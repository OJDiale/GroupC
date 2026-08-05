import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Trash2, KeyRound, AlertTriangle, X, Settings, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/apiConfig';
import { usePageTitle } from '@/lib/usePageTitle';
import ReportExportButtons from '@/components/admin/ReportExportButtons';

/**
 * BACKEND ENDPOINTS (Express + MySQL) — confirmed against user.routes.js
 * ------------------------------------------------------------------
 * GET    /api/users/all               (authenticateToken, adminWare)
 *    -> { success: true, users: User[] }  each row includes a computed
 *       `role` field ('admin' | 'driver')
 *
 * POST   /api/users                   (authenticateToken, adminWare)
 *    body: { email, password, username, firstName, lastName, role }
 *    -> { success: true, userId: number }
 *
 * PUT    /api/users/:user_id/password  (authenticateToken, adminWare)
 *    body: { password: string }
 *    -> { success: true, message?: string }
 *
 * DELETE /api/users/:user_id          (authenticateToken, adminWare)
 *    -> { success: true, message?: string }
 * ------------------------------------------------------------------
 */

interface User {
  user_id: number;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  role: 'admin' | 'driver';
  date_created: string;
  last_login: string | null;
}

interface FilterState {
  userId: string;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  role: string;
}

const EMPTY_FILTERS: FilterState = {
  userId: '',
  username: '',
  email: '',
  firstname: '',
  lastname: '',
  role: '',
};

const EMPTY_ADD_FORM = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  role: 'driver' as 'driver' | 'admin',
};

const USERS_ALL_API = `${API_BASE_URL}/api/users/all`;
const USERS_API = `${API_BASE_URL}/api/users`;

export default function DriverManagement() {
  usePageTitle('User Management');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [openPasswordPanel, setOpenPasswordPanel] = useState<{ [userId: number]: boolean }>({});
  const [passwordInputs, setPasswordInputs] = useState<{ [userId: number]: { password: string; confirm: string } }>({});

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; targetUser: User | null }>({
    isOpen: false,
    targetUser: null,
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const loadUsers = async () => {
    try {
      const res = await fetch(USERS_ALL_API, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setAllUsers(data.users || []);
      } else {
        toast.error(`Failed to load users: ${data.message || data.error || 'Unauthorized access'}`, { id: 'user-fetch' });
      }
    } catch (e) {
      toast.error('Could not connect to backend.', { id: 'user-fetch' });
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // --- Filtering ---
  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      if (filters.userId && String(u.user_id) !== filters.userId) return false;
      if (filters.username && !u.username?.toLowerCase().includes(filters.username.toLowerCase())) return false;
      if (filters.email && !u.email?.toLowerCase().includes(filters.email.toLowerCase())) return false;
      if (filters.firstname && !u.firstname?.toLowerCase().includes(filters.firstname.toLowerCase())) return false;
      if (filters.lastname && !u.lastname?.toLowerCase().includes(filters.lastname.toLowerCase())) return false;
      if (filters.role && u.role !== filters.role) return false;
      return true;
    });
  }, [allUsers, filters]);

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  // --- Add user ---
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSubmitting(true);
    try {
      const res = await fetch(USERS_API, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('User created.', { id: 'user-action' });
        setIsAddOpen(false);
        setAddForm(EMPTY_ADD_FORM);
        loadUsers();
      } else {
        toast.error(`Failed to create user: ${data.message || 'Operation denied'}`, { id: 'user-action' });
      }
    } catch (e) {
      toast.error('Create request failed.', { id: 'user-action' });
    } finally {
      setAddSubmitting(false);
    }
  };

  // --- Password update ---
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

    toast.loading('Updating password...', { id: 'user-action' });

    try {
      const res = await fetch(`${USERS_API}/${userId}/password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ password: entry.password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Password updated.', { id: 'user-action' });
        setOpenPasswordPanel((prev) => ({ ...prev, [userId]: false }));
        setPasswordInputs((prev) => ({ ...prev, [userId]: { password: '', confirm: '' } }));
      } else {
        toast.error(`Failed to update password: ${data.message || data.error || 'Operation denied'}`, { id: 'user-action' });
      }
    } catch (e) {
      toast.error('Update request failed.', { id: 'user-action' });
    }
  };

  // --- Delete ---
  const executeDeleteUser = async () => {
    if (!deleteModal.targetUser) return;
    const userId = deleteModal.targetUser.user_id;

    toast.loading('Deleting user account...', { id: 'user-action' });

    try {
      const res = await fetch(`${USERS_API}/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || 'User account deleted.', { id: 'user-action' });
        setDeleteModal({ isOpen: false, targetUser: null });
        loadUsers();
      } else {
        toast.error(`Delete rejected: ${data.message || data.error || 'Forbidden'}`, { id: 'user-action' });
      }
    } catch (e) {
      toast.error('Delete request failed.', { id: 'user-action' });
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
          User Management
        </h1>
        <a
          href="/admin"
          className="inline-block mb-7 text-[#f0c040] text-[0.85rem] font-medium tracking-[1px] no-underline transition-colors duration-200 hover:text-white"
        >
          <ArrowLeft className="inline-block w-4 h-4 mr-1 align-baseline" /> Go Back to Home
        </a>

        <h2 className="font-['Oswald',sans-serif] text-[1.35rem] font-semibold uppercase tracking-[1px] mb-3.5">
          User List
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
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 p-[8px_18px] border border-[#f0c040]/60 font-['Oswald',sans-serif] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer transition-colors duration-200 bg-[#f0c040]/15 text-[#f0c040] hover:bg-[#f0c040]/25"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add User
          </button>
          <ReportExportButtons basePath="/api/users/all" filename="user_management" onError={(m) => toast.error(m, { id: 'export' })} />
        </div>

        {/* Filter Drawer */}
        {isFilterOpen && (
          <div className="bg-black/60 border border-white/18 p-[18px_22px] mb-4 w-fit max-w-full text-white">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5">
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
              <div>
                <label className="font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                  Role
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full p-[8px_10px] bg-white/92 border-none font-['Roboto'] text-[0.86rem] text-[#333] outline-none"
                >
                  <option value="">All roles</option>
                  <option value="driver">Driver</option>
                  <option value="admin">Admin</option>
                </select>
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
                <th className="p-[10px_12px] border border-white/15">User ID</th>
                <th className="p-[10px_12px] border border-white/15">Role</th>
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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-white/55 italic p-4 text-[0.84rem]">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <React.Fragment key={u.user_id}>
                    <tr className="hover:bg-white/9 border-b border-white/12 transition-colors odd:bg-transparent even:bg-white/5 text-[0.84rem] align-middle">
                      <td className="p-[9px_12px] border border-white/12">{u.user_id}</td>
                      <td className="p-[9px_12px] border border-white/12">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[0.68rem] font-bold uppercase tracking-wide ${
                            u.role === 'admin' ? 'bg-[#f0c040]/20 text-[#f0c040]' : 'bg-white/10 text-white/70'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-[9px_12px] border border-white/12">{u.firstname}</td>
                      <td className="p-[9px_12px] border border-white/12">{u.lastname}</td>
                      <td className="p-[9px_12px] border border-white/12">{u.username}</td>
                      <td className="p-[9px_12px] border border-white/12">{u.email}</td>
                      <td className="p-[9px_12px] border border-white/12">
                        {u.date_created ? new Date(u.date_created).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-[9px_12px] border border-white/12">
                        {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                      </td>
                      <td className="p-[9px_12px] border border-white/12 whitespace-nowrap">
                        <button
                          onClick={() => togglePasswordPanel(u.user_id)}
                          className="inline-flex items-center gap-1 p-[7px_13px] bg-[#1a5fa8] text-white font-['Oswald'] text-[0.75rem] font-semibold tracking-[1.5px] uppercase cursor-pointer hover:bg-[#2272c3] border-none mr-1 transition-colors"
                        >
                          <KeyRound className="w-3 h-3" /> Password
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, targetUser: u })}
                          className="inline-flex items-center gap-1 p-[7px_13px] bg-[#cc2222] text-white font-['Oswald'] text-[0.75rem] font-semibold tracking-[1.5px] uppercase cursor-pointer hover:bg-[#ee3333] border-none transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </td>
                    </tr>

                    {openPasswordPanel[u.user_id] && (
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
                                value={passwordInputs[u.user_id]?.password || ''}
                                onChange={(e) => handlePasswordInput(u.user_id, 'password', e.target.value)}
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
                                value={passwordInputs[u.user_id]?.confirm || ''}
                                onChange={(e) => handlePasswordInput(u.user_id, 'confirm', e.target.value)}
                                className="w-[180px] p-[9px_12px] bg-white/92 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none"
                              />
                            </div>
                            <button
                              onClick={() => updatePassword(u.user_id)}
                              className="p-[9px_16px] bg-[#1a5fa8] text-white font-['Oswald'] text-[0.75rem] font-semibold tracking-[1.5px] uppercase hover:bg-[#2272c3] border-none cursor-pointer transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => togglePasswordPanel(u.user_id)}
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

      {/* Add User Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleAddUser}
            className="relative w-full max-w-md bg-[#222] border border-white/10 p-6 shadow-2xl text-left space-y-3.5"
          >
            <button
              type="button"
              onClick={() => { setIsAddOpen(false); setAddForm(EMPTY_ADD_FORM); }}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-['Oswald',sans-serif] text-xl font-semibold uppercase tracking-[1px] text-white mb-1">
              Add New User
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                  First Name
                </label>
                <input
                  required
                  type="text"
                  value={addForm.firstName}
                  onChange={(e) => setAddForm((p) => ({ ...p, firstName: e.target.value }))}
                  className="w-full p-[9px_12px] bg-white/92 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none"
                />
              </div>
              <div>
                <label className="font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                  Last Name
                </label>
                <input
                  required
                  type="text"
                  value={addForm.lastName}
                  onChange={(e) => setAddForm((p) => ({ ...p, lastName: e.target.value }))}
                  className="w-full p-[9px_12px] bg-white/92 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                Username
              </label>
              <input
                required
                type="text"
                value={addForm.username}
                onChange={(e) => setAddForm((p) => ({ ...p, username: e.target.value }))}
                className="w-full p-[9px_12px] bg-white/92 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none"
              />
            </div>

            <div>
              <label className="font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                Email
              </label>
              <input
                required
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full p-[9px_12px] bg-white/92 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none"
              />
            </div>

            <div>
              <label className="font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                Password
              </label>
              <input
                required
                minLength={6}
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full p-[9px_12px] bg-white/92 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none"
              />
            </div>

            <div>
              <label className="font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase">
                Role
              </label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm((p) => ({ ...p, role: e.target.value as 'driver' | 'admin' }))}
                className="w-full p-[9px_12px] bg-white/92 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none"
              >
                <option value="driver">Driver</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => { setIsAddOpen(false); setAddForm(EMPTY_ADD_FORM); }}
                className="px-4 py-2 bg-transparent text-white/70 hover:text-white text-xs tracking-[1px] font-semibold uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1a5fa8] hover:bg-[#2272c3] disabled:opacity-50 text-white font-['Oswald'] text-xs font-semibold tracking-[1.5px] uppercase transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" /> {addSubmitting ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#222] border border-white/10 p-6 shadow-2xl text-left">
            <button
              onClick={() => setDeleteModal({ isOpen: false, targetUser: null })}
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
                  Are you sure you want to permanently delete the {deleteModal.targetUser.role} account{' '}
                  <span className="text-[#f0c040] font-mono font-bold">@{deleteModal.targetUser.username}</span>?
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
              <button
                onClick={() => setDeleteModal({ isOpen: false, targetUser: null })}
                className="px-4 py-2 bg-transparent text-white/70 hover:text-white text-xs tracking-[1px] font-semibold uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteUser}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#cc2222] hover:bg-[#ee3333] text-white font-['Oswald'] text-xs font-semibold tracking-[1.5px] uppercase transition-colors shadow-lg shadow-red-900/20"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
