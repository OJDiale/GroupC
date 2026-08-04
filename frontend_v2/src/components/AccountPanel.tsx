import { UserCircle2, Mail, MapPin, History, X, Lock, Save, RotateCcw, Navigation, Loader2, ChevronDown, Download, LogOut } from "lucide-react"
import { useAccountPanel, type DestinationLog, formatRelativeTime } from "./useAccountPanel";

interface AccountPanelProps {
    initialData: any;
    /** Renders a close (X) button in the top-right corner and calls this
     * instead of navigating when the panel is shown inside a modal. */
    onClose?: () => void;
}

/**
 * The actual profile UI — extracted from AccountHolder so it can be reused
 * both as the full-page /account route and inside AdminProfileModal's
 * overlay. Owns all of its own state/handlers; callers only need to supply
 * the initially-loaded user record.
 */
export default function AccountPanel({ initialData, onClose }: AccountPanelProps) {
    const {
        data, navigate,
        isDeleteOpen, setIsDeleteOpen,
        isEmailModalOpen, setIsEmailModalOpen,
        isPasswordModalOpen, setIsPasswordModalOpen,
        showDestinations,
        destinations, loadingDestinations,
        hasChanges, editForm, setEditForm,
        newEmail, setNewEmail,
        newPassword, setNewPassword,
        handleToggleDestinations, handleDownloadTripLogsPdf,
        handleUpdateProfile, handleReset,
        handleChangeEmail, handleChangePassword,
        handleConfirmDeletion, handleLogout,
    } = useAccountPanel(initialData);

    return (
        <div className="w-full bg-[#05070f] bg-gradient-to-b from-[#080d1a] via-[#05070f] to-[#030408] text-slate-300 font-sans antialiased flex flex-col justify-between p-6 pb-10 relative overflow-hidden rounded-2xl">

            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-[20%] right-[-10%] w-[250px] h-[250px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none z-0" />

            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 text-slate-500 hover:text-white transition-colors bg-slate-900/60 rounded-full p-1.5"
                    aria-label="Close profile"
                >
                    <X size={16} />
                </button>
            )}

            {/* MAIN CONTAINER */}
            <div className="w-full max-w-sm mx-auto space-y-6 pt-2 relative z-10">

                {/* PAGE HEADER */}
                <h1 className="text-lg font-semibold tracking-tight text-white text-left">My Profile</h1>

                {/* PROFILE ICON + USERNAME (left-aligned) */}
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                        <UserCircle2 size={28} className="text-slate-400" />
                    </div>
                    <span className="text-base font-semibold text-white truncate">{data?.username}</span>
                </div>

                {/* FIRST NAME / LAST NAME */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-medium px-0.5">First Name</label>
                        <input
                            type="text"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            className="w-full bg-[#05070f] border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/10 transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-medium px-0.5">Last Name</label>
                        <input
                            type="text"
                            value={editForm.lastName}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            className="w-full bg-[#05070f] border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/10 transition-all"
                        />
                    </div>
                </div>

                {/* ACCOUNT SECURITY */}
                <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-semibold text-white tracking-tight border-b border-white/[0.04] pb-2">Account Security</h3>

                    <div className="flex items-end gap-3">
                        <div className="flex-1 space-y-1.5 min-w-0">
                            <label className="text-xs text-slate-400 font-medium px-0.5">Email</label>
                            <div className="relative flex items-center">
                                <Mail size={14} className="absolute left-3 text-slate-600" />
                                <input
                                    type="email"
                                    value={data?.email || ""}
                                    readOnly
                                    className="w-full bg-[#05070f] border border-white/5 rounded-xl p-3 pl-9 text-sm text-slate-400 truncate cursor-not-allowed"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => { setNewEmail(data?.email || ""); setIsEmailModalOpen(true); }}
                            className="shrink-0 py-3 px-4 bg-slate-900 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.97]"
                        >
                            Change email
                        </button>
                    </div>

                    <div className="flex items-end gap-3">
                        <div className="flex-1 space-y-1.5 min-w-0">
                            <label className="text-xs text-slate-400 font-medium px-0.5">Password</label>
                            <div className="relative flex items-center">
                                <Lock size={14} className="absolute left-3 text-slate-600" />
                                <input
                                    type="password"
                                    value="••••••••"
                                    readOnly
                                    className="w-full bg-[#05070f] border border-white/5 rounded-xl p-3 pl-9 text-sm text-slate-400 cursor-not-allowed"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="shrink-0 py-3 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            Change password
                        </button>
                    </div>
                </div>

                {/* APP SHUTTLE */}
                <button
                    type="button"
                    onClick={() => navigate("/map")}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/10 rounded-xl active:scale-[0.98] transition-all font-medium text-xs tracking-wide"
                >
                    <MapPin size={14} />
                    Launch Map
                </button>

                {/* TRIP LOGS DROPDOWN */}
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={handleToggleDestinations}
                        className="w-full flex items-center justify-between py-3.5 px-4 bg-slate-900/40 border border-white/[0.02] hover:bg-slate-900/60 rounded-xl transition-all"
                    >
                        <span className="flex items-center gap-2.5 text-xs font-medium text-slate-300">
                            <History size={14} />
                            Trip Logs
                        </span>
                        {loadingDestinations ? (
                            <Loader2 size={14} className="animate-spin text-slate-400" />
                        ) : (
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${showDestinations ? "rotate-180" : ""}`} />
                        )}
                    </button>

                    {showDestinations && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between px-1">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monitored Stations & Safe Hubs</p>
                                <button
                                    type="button"
                                    onClick={handleDownloadTripLogsPdf}
                                    disabled={destinations.length === 0}
                                    className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-400 hover:text-blue-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors shrink-0"
                                >
                                    <Download size={12} />
                                    Download PDF
                                </button>
                            </div>

                            {destinations.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-white/5 rounded-2xl bg-slate-900/5">
                                    <MapPin size={16} className="mx-auto text-slate-600 mb-1.5" />
                                    <p className="text-xs text-slate-500">No telemetry log variants matching historical route records.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {destinations.map((dest: DestinationLog, idx: number) => (
                                        <div
                                            key={dest.id || idx}
                                            className="flex items-center justify-between p-3 bg-slate-900/10 border border-white/[0.02] rounded-xl hover:border-white/10 transition-all"
                                        >
                                          <div className="flex items-center gap-3 overflow-hidden w-full">

                                                <div className="p-2 bg-blue-600/5 border border-blue-500/5 text-blue-400/80 rounded-lg shrink-0">
                                                    <Navigation size={12} />
                                                </div>

                                                <div className="overflow-hidden min-w-0 flex-1">
                                                    <p className="text-xs font-medium text-white truncate">
                                                        {dest.startLocation} <b className="text-slate-500 font-normal mx-0.5">to</b> {dest.endLocation}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 truncate font-mono">
                                                        {formatRelativeTime(dest.createdAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            {dest.safetyRating && (
                                                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                                    dest.safetyRating === 'secure' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                                                    dest.safetyRating === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                                                    'bg-slate-500/10 text-slate-400 border border-white/5'
                                                }`}>
                                                    {dest.safetyRating}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
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

                <button
                    type="button"
                    onClick={() => setIsDeleteOpen(true)}
                    className="w-full py-1 text-center font-medium text-[11px] text-slate-600 hover:text-red-400/80 tracking-wider transition-colors cursor-pointer"
                >
                    Close Account Permanently
                </button>
            </div>

            {/* CHANGE EMAIL MODAL */}
            {isEmailModalOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <form
                        onSubmit={handleChangeEmail}
                        className="bg-[#090d16] border border-white/5 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left"
                    >
                        <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                            <h3 className="text-sm font-semibold text-white tracking-tight">Change Email</h3>
                            <button
                                type="button"
                                onClick={() => setIsEmailModalOpen(false)}
                                className="text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs text-slate-400 font-medium px-0.5">New Email Address</label>
                            <div className="relative flex items-center">
                                <Mail size={14} className="absolute left-3 text-slate-600" />
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="w-full bg-[#05070f] border border-white/5 rounded-xl p-3 pl-9 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all font-mono"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsEmailModalOpen(false)}
                                className="flex-1 py-3 bg-slate-900 border border-white/5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.97]"
                            >
                                Save Email
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* CHANGE PASSWORD MODAL */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <form
                        onSubmit={handleChangePassword}
                        className="bg-[#090d16] border border-white/5 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left"
                    >
                        <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                            <h3 className="text-sm font-semibold text-white tracking-tight">Change Password</h3>
                            <button
                                type="button"
                                onClick={() => { setIsPasswordModalOpen(false); setNewPassword(""); }}
                                className="text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5 px-0.5">
                                <Lock size={12} className="text-slate-500" /> New Password
                            </label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-[#05070f] border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/60 placeholder:text-slate-700 transition-all"
                                required
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => { setIsPasswordModalOpen(false); setNewPassword(""); }}
                                className="flex-1 py-3 bg-slate-900 border border-white/5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.97]"
                            >
                                Save Password
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* STICKY FLOATING PERSISTENT SAVE NOTIFICATION BAR (first/last name) */}
            <div className={`fixed bottom-6 inset-x-6 z-40 max-w-sm mx-auto flex items-center justify-between bg-slate-900 border border-white/10 shadow-2xl p-3 rounded-2xl transition-all duration-300 ${hasChanges ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95 pointer-events-none'}`}>
                <div className="pl-2">
                    <p className="text-xs font-semibold text-white">Unsaved Changes</p>
                    <p className="text-[10px] text-slate-400">Modify properties detected</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="p-2.5 text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <RotateCcw size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={handleUpdateProfile}
                        className="flex items-center gap-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.97]"
                    >
                        <Save size={12} />
                        Save
                    </button>
                </div>
            </div>

            {/* CONFIRM ACCOUNT DELETION OVERLAY */}
            {isDeleteOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-[#140c0e] border border-red-500/20 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150">
                        <div className="mx-auto w-11 h-11 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 border border-red-500/10">
                            <X size={20} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-semibold text-red-200">Delete Account Permanently?</h3>
                            <p className="text-xs text-slate-500 max-w-[250px] mx-auto leading-relaxed">
                                This action cannot be undone. All user nodes will be unlinked.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsDeleteOpen(false)}
                                className="flex-1 py-3 bg-slate-950 border border-white/5 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors"
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
        </div>
    )
}
