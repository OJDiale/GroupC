import { useEffect, useState } from "react";
import { Loader2, X, UserCircle2, Mail, Lock, Save, RotateCcw, LogOut } from "lucide-react";
import { userData } from "../database/auth.js";
import { useAccountPanel } from "./useAccountPanel";

interface AdminProfileModalProps {
    onClose: () => void;
}

/**
 * Admin's own profile overlay, opened from AdminSidebarLayout's header
 * button. Uses the same light brand theme as the driver-facing profile
 * panel on the map page (MapProfilePanel) instead of AccountPanel's dark
 * glass look, and drops Trip Logs / Launch Map since neither applies to an
 * admin account.
 */
export default function AdminProfileModal({ onClose }: AdminProfileModalProps) {
    const [initialData, setInitialData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        userData()
            .then((details: any) => { if (!cancelled) setInitialData(details); })
            .catch(() => { if (!cancelled) setInitialData({}); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 bg-white">
                {loading ? (
                    <div className="p-16 flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-brand-blue" />
                    </div>
                ) : (
                    <AdminProfileModalContent initialData={initialData} onClose={onClose} />
                )}
            </div>
        </div>
    );
}

function AdminProfileModalContent({ initialData, onClose }: { initialData: any; onClose: () => void }) {
    const {
        data,
        isDeleteOpen, setIsDeleteOpen,
        isEmailModalOpen, setIsEmailModalOpen,
        isPasswordModalOpen, setIsPasswordModalOpen,
        hasChanges, editForm, setEditForm,
        newEmail, setNewEmail,
        newPassword, setNewPassword,
        handleUpdateProfile, handleReset,
        handleChangeEmail, handleChangePassword,
        handleConfirmDeletion, handleLogout,
    } = useAccountPanel(initialData);

    return (
        <div className="p-6 relative">
            <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 z-20 text-brand-muted hover:text-brand-ink transition-colors bg-brand-bg rounded-full p-1.5"
                aria-label="Close profile"
            >
                <X size={16} />
            </button>

            <h1 className="text-lg font-semibold tracking-tight text-brand-ink mb-6">My Profile</h1>

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-brand-blue-soft border border-brand-border flex items-center justify-center shrink-0">
                        <UserCircle2 size={28} className="text-brand-blue" />
                    </div>
                    <span className="text-base font-semibold text-brand-ink truncate">{data?.username}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs text-brand-muted font-medium px-0.5">First Name</label>
                        <input
                            type="text"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            className="w-full bg-white border border-brand-border rounded-xl p-3 text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs text-brand-muted font-medium px-0.5">Last Name</label>
                        <input
                            type="text"
                            value={editForm.lastName}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            className="w-full bg-white border border-brand-border rounded-xl p-3 text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-semibold text-brand-ink tracking-tight border-b border-brand-border pb-2">Account Security</h3>

                    <div className="flex items-end gap-3">
                        <div className="flex-1 space-y-1.5 min-w-0">
                            <label className="text-xs text-brand-muted font-medium px-0.5">Email</label>
                            <div className="relative flex items-center">
                                <Mail size={14} className="absolute left-3 text-brand-muted" />
                                <input
                                    type="email"
                                    value={data?.email || ""}
                                    readOnly
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 pl-9 text-sm text-brand-muted truncate cursor-not-allowed"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => { setNewEmail(data?.email || ""); setIsEmailModalOpen(true); }}
                            className="shrink-0 py-3 px-4 bg-white border border-brand-border hover:border-brand-blue text-brand-ink hover:text-brand-blue rounded-xl text-xs font-semibold transition-all active:scale-[0.97]"
                        >
                            Change email
                        </button>
                    </div>

                    <div className="flex items-end gap-3">
                        <div className="flex-1 space-y-1.5 min-w-0">
                            <label className="text-xs text-brand-muted font-medium px-0.5">Password</label>
                            <div className="relative flex items-center">
                                <Lock size={14} className="absolute left-3 text-brand-muted" />
                                <input
                                    type="password"
                                    value="••••••••"
                                    readOnly
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 pl-9 text-sm text-brand-muted cursor-not-allowed"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="shrink-0 py-3 text-xs font-semibold text-brand-blue hover:text-brand-blue-dark transition-colors"
                        >
                            Change password
                        </button>
                    </div>
                </div>

                <div className="pt-4 flex justify-center">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-[90%] mx-auto flex items-center justify-center gap-2 py-1.5 rounded-xl font-normal text-white bg-[#171e5b] active:bg-white active:text-[#171e5b] transition-colors"
                    >
                        <LogOut size={14} />
                        <span className="text-sm">Log out</span>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setIsDeleteOpen(true)}
                    className="w-full py-1 text-center font-medium text-[11px] text-brand-muted hover:text-red-500 tracking-wider transition-colors cursor-pointer"
                >
                    Close Account Permanently
                </button>
            </div>

            {/* CHANGE EMAIL MODAL */}
            {isEmailModalOpen && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
                    <form
                        onSubmit={handleChangeEmail}
                        className="bg-white border border-brand-border w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left"
                    >
                        <div className="flex items-center justify-between border-b border-brand-border pb-3">
                            <h3 className="text-sm font-semibold text-brand-ink tracking-tight">Change Email</h3>
                            <button type="button" onClick={() => setIsEmailModalOpen(false)} className="text-brand-muted hover:text-brand-ink transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs text-brand-muted font-medium px-0.5">New Email Address</label>
                            <div className="relative flex items-center">
                                <Mail size={14} className="absolute left-3 text-brand-muted" />
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 pl-9 text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setIsEmailModalOpen(false)} className="flex-1 py-3 bg-white border border-brand-border rounded-xl text-xs font-semibold text-brand-muted hover:text-brand-ink transition-colors">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 py-3 bg-brand-ink hover:bg-brand-blue-dark text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.97]">
                                Save Email
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* CHANGE PASSWORD MODAL */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
                    <form
                        onSubmit={handleChangePassword}
                        className="bg-white border border-brand-border w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left"
                    >
                        <div className="flex items-center justify-between border-b border-brand-border pb-3">
                            <h3 className="text-sm font-semibold text-brand-ink tracking-tight">Change Password</h3>
                            <button type="button" onClick={() => { setIsPasswordModalOpen(false); setNewPassword(""); }} className="text-brand-muted hover:text-brand-ink transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs text-brand-muted font-medium flex items-center gap-1.5 px-0.5">
                                <Lock size={12} className="text-brand-muted" /> New Password
                            </label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue placeholder:text-brand-muted transition-all"
                                required
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => { setIsPasswordModalOpen(false); setNewPassword(""); }} className="flex-1 py-3 bg-white border border-brand-border rounded-xl text-xs font-semibold text-brand-muted hover:text-brand-ink transition-colors">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 py-3 bg-brand-ink hover:bg-brand-blue-dark text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.97]">
                                Save Password
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* CONFIRM ACCOUNT DELETION OVERLAY */}
            {isDeleteOpen && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
                    <div className="bg-white border border-red-200 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150">
                        <div className="mx-auto w-11 h-11 bg-red-50 rounded-full flex items-center justify-center text-red-500 border border-red-100">
                            <X size={20} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-semibold text-red-600">Delete Account Permanently?</h3>
                            <p className="text-xs text-brand-muted max-w-[250px] mx-auto leading-relaxed">
                                This action cannot be undone. All user nodes will be unlinked.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsDeleteOpen(false)}
                                className="flex-1 py-3 bg-white border border-brand-border rounded-xl text-sm font-semibold text-brand-muted hover:text-brand-ink transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDeletion}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 active:scale-[0.98] rounded-xl text-sm font-semibold text-white transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UNSAVED CHANGES BAR (first/last name) */}
            <div className={`fixed bottom-6 right-6 z-[150] flex items-center justify-between bg-white border border-brand-border shadow-2xl p-3 rounded-2xl transition-all duration-300 ${hasChanges ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95 pointer-events-none'}`}>
                <div className="pl-2 pr-4">
                    <p className="text-xs font-semibold text-brand-ink">Unsaved Changes</p>
                    <p className="text-[10px] text-brand-muted">Modify properties detected</p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={handleReset} className="p-2.5 text-brand-muted hover:text-brand-ink bg-brand-bg hover:bg-brand-blue-soft rounded-xl transition-colors">
                        <RotateCcw size={14} />
                    </button>
                    <button type="button" onClick={handleUpdateProfile} className="flex items-center gap-1.5 py-2 px-4 bg-brand-ink hover:bg-brand-blue-dark text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.97]">
                        <Save size={12} />
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
