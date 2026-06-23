import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, Trash2, Edit2, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  user_id: number;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  date_created: string;
  last_login: string | null;
}

const CONFIG = {
  API_BASE_URL: (window as any).CONFIG?.API_BASE_URL || 'https://mapper-backend-brkn.onrender.com',
};

const API = `${CONFIG.API_BASE_URL}/api/users`;

export default function UserManagement() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; targetUser: User | null }>({
    isOpen: false,
    targetUser: null,
  });

  const [newUser, setNewUser] = useState({
    firstname: '',
    lastname: '',
    username: '',
    email: '',
    password: '',
  });

  const [openPanels, setOpenPanels] = useState<{ [userId: number]: boolean }>({});
  const [updateInputs, setUpdateInputs] = useState<{ [key: string]: string }>({});

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API}/all`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setAllUsers(data.users || []);
      } else {
        toast.error(`Failed to load users: ${data.message || 'Unauthorized Access'}`, { id: 'user-fetch' });
      }
    } catch (e) {
      toast.error('Could not connect to backend engine.', { id: 'user-fetch' });
    }
  };

  const addUser = async () => {
    const { firstname, lastname, username, email, password } = newUser;
    if (!firstname || !lastname || !username || !email || !password) {
      toast.error('Please fill all fields.', { id: 'validation' });
      return;
    }

    toast.loading('Creating user account...', { id: 'user-action' });

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('User added successfully!', { id: 'user-action' });
        setNewUser({
          firstname: '',
          lastname: '',
          username: '',
          email: '',
          password: '',
        });
        loadUsers();
      } else {
        toast.error(`Failed to add user: ${data.message || 'Operation Denied'}`, { id: 'user-action' });
      }
    } catch (e) {
      toast.error('Insert routine failure.', { id: 'user-action' });
    }
  };

  const updateField = async (userId: number, field: string) => {
    const inputKey = `${userId}_${field}`;
    const value = updateInputs[inputKey];

    if (!value) {
      toast.error('Please enter a value.', { id: 'validation' });
      return;
    }

    toast.loading(`Updating ${field}...`, { id: 'user-action' });

    try {
      const res = await fetch(`${API}/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Profile parameter updated!', { id: 'user-action' });
        setUpdateInputs(prev => ({ ...prev, [inputKey]: '' }));
        loadUsers();
      } else {
        toast.error(`Failed to update: ${data.message || 'Operation Denied'}`, { id: 'user-action' });
      }
    } catch (e) {
      toast.error('Update operational exception.', { id: 'user-action' });
    }
  };

  const executeDeleteUser = async () => {
    if (!deleteModal.targetUser) return;
    const userId = deleteModal.targetUser.user_id;

    toast.loading('Executing destructive user purge...', { id: 'user-action' });

    try {
      const res = await fetch(`${API}/${userId}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'User data purged.', { id: 'user-action' });
        setDeleteModal({ isOpen: false, targetUser: null });
        loadUsers();
      } else {
        toast.error(`Purge rejected: ${data.message || 'Forbidden execution'}`, { id: 'user-action' });
      }
    } catch (e) {
      toast.error('Delete routine failure.', { id: 'user-action' });
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!allUsers) return;
    setFilteredUsers(
      allUsers.filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allUsers, searchQuery]);

  const toggleUpdatePanel = (userId: number) => {
    setOpenPanels(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleInputChange = (userId: number, field: string, val: string) => {
    setUpdateInputs(prev => ({ ...prev, [`${userId}_${field}`]: val }));
  };

  const updateFieldsConfig = [
    { key: 'firstname', label: 'First Name', type: 'text' },
    { key: 'lastname', label: 'Last Name', type: 'text' },
    { key: 'username', label: 'Username', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'password', label: 'Password', type: 'password' },
  ];

  return (
    <div className="relative min-h-screen bg-[#1a1a1a] font-['Roboto',sans-serif] text-white overflow-x-hidden">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center" 
        style={{ 
          backgroundImage: `url('background-image.jpeg')`,
          filter: 'brightness(0.52) saturate(0.8)'
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
          Add User
        </h2>
        
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5 mb-3.5">
          <input 
            type="text" placeholder="First Name" value={newUser.firstname}
            onChange={e => setNewUser({ ...newUser, firstname: e.target.value })}
            className="p-[9px_12px] bg-white/92 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none placeholder-[#888]"
          />
          <input 
            type="text" placeholder="Last Name" value={newUser.lastname}
            onChange={e => setNewUser({ ...newUser, lastname: e.target.value })}
            className="p-[9px_12px] bg-white/92 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none placeholder-[#888]"
          />
          <input 
            type="text" placeholder="Username" value={newUser.username}
            onChange={e => setNewUser({ ...newUser, username: e.target.value })}
            className="p-[9px_12px] bg-white/92 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none placeholder-[#888]"
          />
          <input 
            type="email" placeholder="Email" value={newUser.email}
            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
            className="p-[9px_12px] bg-white/92 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none placeholder-[#888]"
          />
          <input 
            type="password" placeholder="Password" value={newUser.password}
            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
            className="p-[9px_12px] bg-white/92 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none placeholder-[#888]"
          />
        </div>
        <button 
          onClick={addUser}
          className="inline-flex items-center gap-1.5 p-[7px_13px] bg-[#b8860b] text-white font-['Oswald',sans-serif] text-[0.75rem] font-semibold tracking-[1.5px] uppercase cursor-pointer hover:bg-[#d4a017] border-none transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" /> Add User
        </button>

        <hr className="border-none border-t border-white/15 my-7" />

        <h2 className="font-['Oswald',sans-serif] text-[1.35rem] font-semibold uppercase tracking-[1px] mb-3.5">
          User List
        </h2>
        <input 
          type="text" 
          placeholder="Search by username" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="min-w-[260px] mb-3.5 p-[9px_12px] bg-white/92 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none placeholder-[#888]"
        />

        <div className="w-full overflow-x-auto">
          {/* Column count adjusted to 8 */}
          <table className="w-full border-collapse bg-black/35 text-left min-w-[800px]">
            <thead>
              <tr className="bg-black/55 text-white font-['Oswald',sans-serif] text-[0.85rem] font-semibold uppercase tracking-[1px]">
                <th className="p-[10px_12px] border border-white/15">ID</th>
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
                  <td colSpan={8} className="text-center text-white/55 italic p-4 text-[0.84rem]">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <React.Fragment key={u.user_id}>
                    <tr className="hover:bg-white/9 border-b border-white/12 transition-colors odd:bg-transparent even:bg-white/5 text-[0.84rem] align-middle">
                      <td className="p-[9px_12px] border border-white/12">{u.user_id}</td>
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
                          onClick={() => toggleUpdatePanel(u.user_id)}
                          className="inline-flex items-center gap-1 p-[7px_13px] bg-[#1a5fa8] text-white font-['Oswald'] text-[0.75rem] font-semibold tracking-[1.5px] uppercase cursor-pointer hover:bg-[#2272c3] border-none mr-1 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" /> Update
                        </button>
                        <button 
                          onClick={() => setDeleteModal({ isOpen: true, targetUser: u })}
                          className="inline-flex items-center gap-1 p-[7px_13px] bg-[#cc2222] text-white font-['Oswald'] text-[0.75rem] font-semibold tracking-[1.5px] uppercase cursor-pointer hover:bg-[#ee3333] border-none transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </td>
                    </tr>

                    {openPanels[u.user_id] && (
                      <tr className="bg-black/50">
                        {/* colSpan updated to 8 to maintain horizontal matrix integrity */}
                        <td colSpan={8} className="p-[14px_16px] border border-white/12 bg-black/50">
                          <div className="flex flex-wrap gap-2.5 items-end">
                            {updateFieldsConfig.map(f => (
                              <div key={f.key} className="inline-block m-[4px_10px_4px_0]">
                                <label className="font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-0.5 tracking-[1px] uppercase">
                                  {f.label}
                                </label>
                                <div className="flex items-center">
                                  <input 
                                    type={f.type} 
                                    placeholder={`New ${f.label}`}
                                    value={updateInputs[`${u.user_id}_${f.key}`] || ''}
                                    onChange={e => handleInputChange(u.user_id, f.key, e.target.value)}
                                    className="w-[160px] p-[9px_12px] bg-white/92 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none mr-1.5"
                                  />
                                  <button 
                                    onClick={() => updateField(u.user_id, f.key)}
                                    className="p-[7px_13px] bg-[#1a5fa8] text-white font-['Oswald'] text-[0.75rem] font-semibold tracking-[1.5px] uppercase hover:bg-[#2272c3] border-none cursor-pointer transition-colors"
                                  >
                                    Update
                                  </button>
                                </div>
                              </div>
                            ))}
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

      {/* --- Overlay Modal Dialog Component --- */}
      {deleteModal.isOpen && deleteModal.targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
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
                  Confirm Destruction
                </h3>
                <p className="text-sm text-white/60 mt-1 leading-relaxed">
                  Are you absolutely sure you want to permanently delete user account <span className="text-[#f0c040] font-mono font-bold">@{deleteModal.targetUser.username}</span>? This action cannot be undone.
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
                <Trash2 className="w-3.5 h-3.5" /> Purge Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
