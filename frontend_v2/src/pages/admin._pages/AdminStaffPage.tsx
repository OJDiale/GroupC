import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { registerStaffAccount } from '../../database/auth.js';
import { usePageTitle } from '@/lib/usePageTitle';

const ROLES = [
  { value: 'admin', label: 'System Administrator' },
  { value: 'traffic_authority', label: 'Traffic Authority' },
  { value: 'security_agency', label: 'Security Agency' },
  { value: 'data_analyst', label: 'Data Analyst' },
];

const inputClass = "w-full h-9 px-3 bg-white border border-brand-border rounded-lg text-sm text-brand-ink outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue";
const labelClass = "text-[11px] font-bold uppercase tracking-wide text-brand-muted block mb-1";

export default function AdminStaffPage() {
  usePageTitle("Staff Accounts");
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

  return (
    <div className="space-y-6">
      <p className="text-brand-muted text-sm max-w-2xl mx-auto text-center">
        Traffic Authority, Security Agency, Data Analyst and additional System Administrator accounts are created here.
        Drivers self-register from the public sign-up page — this is only for the roles you manage directly.
      </p>

      <form onSubmit={submit} className="bg-white border border-brand-border rounded-2xl p-6 space-y-3 max-w-lg mx-auto">
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

        <div className="flex justify-center pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-ink text-white text-sm font-semibold hover:bg-brand-blue-dark disabled:opacity-50"
          >
            <UserPlus size={16} /> {submitting ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      </form>

      {created.length > 0 && (
        <div className="max-w-lg mx-auto">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-2">
            Created this session
          </h2>
          <ul className="text-sm text-brand-ink space-y-1 bg-white border border-brand-border rounded-2xl p-4">
            {created.map((c, i) => (
              <li key={i}>{c.email} — {ROLES.find(r => r.value === c.role)?.label}</li>
            ))}
          </ul>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-xl z-[999] ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
