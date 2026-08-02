import React, { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { registerStaffAccount } from '../../database/auth.js';

const ROLES = [
  { value: 'admin', label: 'System Administrator' },
  { value: 'traffic_authority', label: 'Traffic Authority' },
  { value: 'security_agency', label: 'Security Agency' },
  { value: 'data_analyst', label: 'Data Analyst' },
];

export default function AdminStaffPage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', username: '', password: '', role: 'traffic_authority',
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [created, setCreated] = useState<{ email: string; role: string }[]>([]);

  const showToast = (msg: string, type = '') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await registerStaffAccount(form.email, form.password, form.username, form.firstName, form.lastName, form.role);
      showToast(`${ROLES.find(r => r.value === form.role)?.label} account created.`, 'success');
      setCreated((prev) => [{ email: form.email, role: form.role }, ...prev]);
      setForm({ firstName: '', lastName: '', email: '', username: '', password: '', role: form.role });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create account.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full p-[9px_12px] bg-white/90 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none";
  const labelClass = "font-['Oswald',sans-serif] text-[0.72rem] text-[#f0c040] block mb-1 tracking-[1px] uppercase";

  return (
    <div className="relative min-h-screen bg-[#1a1a1a] font-['Roboto',sans-serif] text-white overflow-x-hidden">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url('background-image.jpeg')`, filter: 'brightness(0.52) saturate(0.8)' }}
      />

      <div className="relative z-10 p-9 max-w-[700px] mx-auto">
        <h1 className="font-['Oswald',sans-serif] text-[2.8rem] font-bold uppercase tracking-[2px] mb-1">
          Staff Accounts
        </h1>
        <Link
          to="/admin"
          className="inline-block mb-7 text-[#f0c040] text-[0.85rem] font-medium tracking-[1px] no-underline transition-colors duration-200 hover:text-white"
        >
          <ArrowLeft className="inline-block w-4 h-4 mr-1 align-baseline" /> Go Back to Home
        </Link>

        <p className="text-white/60 text-[0.9rem] mb-6">
          Create accounts for Traffic Authority, Security Agency, Data Analyst or additional System Administrator staff.
          Drivers self-register from the public sign-up page — this is only for the roles you manage directly.
        </p>

        <form onSubmit={submit} className="bg-black/35 border border-white/15 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First name</label>
              <input required className={inputClass} value={form.firstName} onChange={update('firstName')} />
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input required className={inputClass} value={form.lastName} onChange={update('lastName')} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input required type="email" className={inputClass} value={form.email} onChange={update('email')} />
          </div>
          <div>
            <label className={labelClass}>Username</label>
            <input required className={inputClass} value={form.username} onChange={update('username')} />
          </div>
          <div>
            <label className={labelClass}>Temporary password</label>
            <input required minLength={6} type="text" className={inputClass} value={form.password} onChange={update('password')} />
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <select className={inputClass} value={form.role} onChange={update('role')}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 p-[10px_22px] bg-[#1a5fa8] text-white font-['Oswald',sans-serif] text-[0.85rem] font-semibold tracking-[1.5px] uppercase cursor-pointer transition-colors duration-200 hover:bg-[#2272c3] disabled:opacity-50"
          >
            <UserPlus size={16} /> {submitting ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        {created.length > 0 && (
          <div className="mt-6">
            <h2 className="font-['Oswald',sans-serif] text-[1rem] font-semibold uppercase tracking-[1px] mb-2 text-white/70">
              Created this session
            </h2>
            <ul className="text-sm text-white/60 space-y-1">
              {created.map((c, i) => (
                <li key={i}>{c.email} — {ROLES.find(r => r.value === c.role)?.label}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

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
