import { useEffect, useState } from "react";
import { ArrowLeft, UserCircle2, Mail, Lock, Download, Navigation, Loader2, MapPin, X, Save, RotateCcw, LogOut } from "lucide-react";
import { userData } from "../database/auth.js";
import { useAccountPanel, type DestinationLog, formatRelativeTime } from "./useAccountPanel";

interface MapProfilePanelProps {
    onClose: () => void;
}

/**
 * Profile popup opened from the map page's own toolbar (replaces the old
 * "back to landing page" link). Overlays the right 60% of the map and uses
 * the shared brand/auth/admin light theme instead of AccountPanel's dark
 * glass look, since it sits alongside the map rather than replacing it.
 */
export default function MapProfilePanel({ onClose }: MapProfilePanelProps) {
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
        <div className="fixed inset-0 z-[1100] flex justify-end">
            {/* Scrim over the remaining visible map, click to close */}
            <div className="flex-1 bg-slate-950/20 backdrop-blur-[1px] cursor-pointer" onClick={onClose} />

            <div className="relative w-[60%] h-full min-w-[320px] bg-brand-bg border-l border-brand-border shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">

                {/* BACK BUTTON — sits to the left of the popup, over the map */}
                <button
                    type="button"
                    onClick={onClose}
                    title="Back to map"
                    aria-label="Back to map"
                    className="absolute -left-14 top-6 flex items-center justify-center size-11 rounded-full bg-white shadow-2xl border border-brand-border text-brand-ink hover:text-brand-blue transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>

                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 size={24} className="animate-spin text-brand-blue" />
                    </div>
                ) : (
                    <MapProfilePanelContent initialData={initialData} />
                )}
            </div>
        </div>
    );
}

function MapProfilePanelContent({ initialData }: { initialData: any }) {
    const {
        data,
        isEmailModalOpen, setIsEmailModalOpen,
        isPasswordModalOpen, setIsPasswordModalOpen,
        destinations, loadingDestinations, loadDestinations,
        hasChanges, editForm, setEditForm,
        newEmail, setNewEmail,
        newPassword, setNewPassword,
        handleDownloadTripLogsPdf,
        handleUpdateProfile, handleReset,
        handleChangeEmail, handleChangePassword,
        handleLogout,
    } = useAccountPanel(initialData);

    useEffect(() => {
        loadDestinations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="p-8 pb-16">
            <h1 className="text-xl font-semibold tracking-tight text-brand-ink mb-6">My Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                {/* LEFT COLUMN — identity & account security */}
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

                    {/* LOGOUT (centered, matches admin sidebar logout styling) */}
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
                </div>

                {/* RIGHT COLUMN — trip logs + PDF export */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-brand-ink tracking-tight">Trip Logs</h3>
                        <button
                            type="button"
                            onClick={handleDownloadTripLogsPdf}
                            disabled={destinations.length === 0}
                            className="flex items-center gap-2 py-2 px-4 bg-brand-ink hover:bg-brand-blue-dark disabled:bg-brand-muted disabled:cursor-not-allowed text-white rounded-full text-xs font-semibold transition-all active:scale-[0.97]"
                        >
                            <Download size={14} />
                            Download PDF
                        </button>
                    </div>

                    {loadingDestinations ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 size={20} className="animate-spin text-brand-blue" />
                        </div>
                    ) : destinations.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-brand-border rounded-2xl bg-white">
                            <MapPin size={16} className="mx-auto text-brand-muted mb-1.5" />
                            <p className="text-xs text-brand-muted">No trip logs recorded yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {destinations.map((dest: DestinationLog, idx: number) => (
                                <div
                                    key={dest.id || idx}
                                    className="flex items-center justify-between p-3 bg-white border border-brand-border rounded-xl hover:border-brand-blue/40 transition-all"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden w-full">
                                        <div className="p-2 bg-brand-blue-soft text-brand-blue rounded-lg shrink-0">
                                            <Navigation size={12} />
                                        </div>
                                        <div className="overflow-hidden min-w-0 flex-1">
                                            <p className="text-xs font-medium text-brand-ink truncate">
                                                {dest.startLocation} <b className="text-brand-muted font-normal mx-0.5">to</b> {dest.endLocation}
                                            </p>
                                            <p className="text-[10px] text-brand-muted truncate font-mono">
                                                {formatRelativeTime(dest.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {dest.safetyRating && (
                                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                            dest.safetyRating === 'secure' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                            dest.safetyRating === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                            'bg-brand-bg text-brand-muted border border-brand-border'
                                        }`}>
                                            {dest.safetyRating}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* CHANGE EMAIL MODAL */}
            {isEmailModalOpen && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[1200]">
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
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[1200]">
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

            {/* UNSAVED CHANGES BAR (first/last name) */}
            <div className={`fixed bottom-6 right-8 z-[1150] flex items-center justify-between bg-white border border-brand-border shadow-2xl p-3 rounded-2xl transition-all duration-300 ${hasChanges ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95 pointer-events-none'}`}>
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
