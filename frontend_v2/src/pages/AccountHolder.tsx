import { UserCircle2, Camera, Mail, MapPin, History, X, Lock, Save, RotateCcw, Navigation, Edit2, Loader2 } from "lucide-react"
import { redirect, useLoaderData, useNavigate } from "react-router"
import { userData, deleteUserAccount, updateUserInfo } from "../database/auth.js"
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import { fetchUserDestinationHistory, formatRelativeTime, type DestinationLog } from "@/lib/utils.js";



export async function loader() {
    const token = localStorage.getItem("token")
    if (!token) return redirect(`/login?message=Sign in to continue`)
    
    try {
        const userDetails = await userData()
        return userDetails
    } catch (err: any) {
        toast.error("Account sync error")
        return redirect("/login")
    }
}

export default function AccountHolder() {
    const loaderData = useLoaderData() as any;
    const [data, setData] = useState(loaderData || {})
    const navigate = useNavigate()

    // Control Overlays/Modals
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    
    // Destinations Visibility and State
    const [showDestinations, setShowDestinations] = useState(false)
    const [destinations, setDestinations] = useState<DestinationLog[]>([])
    const [loadingDestinations, setLoadingDestinations] = useState(false)

    const [hasChanges, setHasChanges] = useState(false)
    const [editForm, setEditForm] = useState({
        username: data?.username || "",
        firstName: data?.firstname || "",
        lastName: data?.lastname || "",
        email: data?.email || "",
        password: ""
    })

    // Track Form State Changes for Save Notification Bar
    useEffect(() => {
        const isChanged = 
            editForm.username !== (data?.username || "") ||
            editForm.firstName !== (data?.firstname || "") ||
            editForm.lastName !== (data?.lastname || "") ||
            editForm.email !== (data?.email || "") ||
            editForm.password !== "";
        
        setHasChanges(isChanged);
    }, [editForm, data]);

    // Handle Lazy Fetching / Toggle of Destinations Data
    const handleToggleDestinations = async () => {
        if (showDestinations) {
            setShowDestinations(false);
            return;
        }

        // Fetch explicitly from utility function using current storage token context
        if (destinations.length === 0) {
            setLoadingDestinations(true);
            const token = localStorage.getItem("token");
            
            if (token) {
                const history = await fetchUserDestinationHistory(token);
                setDestinations(history);
            } else {
                toast.error("Authentication session expired");
            }
            setLoadingDestinations(false);
        }
        setShowDestinations(true);
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                username: editForm.username,
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                email: editForm.email,
            };

            if (editForm.password.trim() !== "") {
                payload.password = editForm.password;
            }

            await updateUserInfo(payload);
            toast.success("Changes saved successfully!");
            
            setData((prev: any) => ({
                ...prev,
                username: editForm.username,
                firstname: editForm.firstName,
                lastname: editForm.lastName,
                email: editForm.email
            }))
            
            setEditForm(prev => ({ ...prev, password: "" }))
            setIsEditOpen(false);
        } catch (err: any) {
            toast.error("Failed to update profile");
            console.error(err);
        }
    }

    const handleReset = () => {
        setEditForm({
            username: data?.username || "",
            firstName: data?.firstname || "",
            lastName: data?.lastname || "",
            email: data?.email || "",
            password: ""
        })
        toast.success("Changes discarded");
    }

    const handleConfirmDeletion = async () => {
        try {
            await deleteUserAccount();
            setIsDeleteOpen(false);
            toast.success("Account permanently closed");
            navigate("/login");
        } catch (err) {
            toast.error("Could not delete account");
            console.error(err);
        }
    }

    const profileDisplayName = data?.firstname || data?.lastname 
        ? `${data.firstname || ""} ${data.lastname || ""}`.trim() 
        : data?.username;

    return (
        <div className="min-h-screen bg-[#05070f] bg-gradient-to-b from-[#080d1a] via-[#05070f] to-[#030408] text-slate-300 font-sans antialiased flex flex-col justify-between p-6 pb-24 relative overflow-hidden">
            
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-[20%] right-[-10%] w-[250px] h-[250px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none z-0" />
            
            {/* MAIN CONTAINER */}
            <div className="w-full max-w-sm mx-auto space-y-6 pt-8 relative z-10">
                
                {/* PROFILE HUB HERO */}
                <div className="flex items-center justify-between bg-slate-900/20 border border-white/[0.02] p-4 rounded-2xl">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className="relative group w-14 h-14 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                            <UserCircle2 size={28} className="text-slate-400" />
                            <button type="button" className="absolute -bottom-0.5 -right-0.5 bg-blue-600 p-1 rounded-full text-white border-2 border-[#05070f] hover:bg-blue-500 transition-colors">
                                <Camera size={10} />
                            </button>
                        </div>
                        <div className="space-y-0.5 overflow-hidden">
                            <h2 className="text-xl font-semibold tracking-tight text-white truncate">{profileDisplayName}</h2>
                            <p className="text-xs text-slate-500 font-mono truncate">@{data?.username}</p>
                        </div>
                    </div>

                    <button 
                        type="button"
                        onClick={() => setIsEditOpen(true)}
                        className="p-2.5 bg-slate-900 border border-white/5 hover:border-white/10 text-slate-400 hover:text-white rounded-xl transition-all active:scale-[0.95]"
                    >
                        <Edit2 size={14} />
                    </button>
                </div>

                {/* APP SHUTTLES */}
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        type="button"
                        onClick={() => navigate("/map")}
                        className="flex items-center justify-center gap-2.5 py-3.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/10 rounded-xl active:scale-[0.98] transition-all font-medium text-xs tracking-wide"
                    >
                        <MapPin size={14} />
                        Launch Map
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={handleToggleDestinations}
                        className={`flex items-center justify-center gap-2.5 py-3.5 border text-xs font-medium rounded-xl active:scale-[0.98] transition-all ${
                            showDestinations 
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                                : 'bg-slate-900/40 border-white/[0.02] text-slate-400 hover:bg-slate-900/60'
                        }`}
                    >
                        {loadingDestinations ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <History size={14} />
                        )}
                        Trip Logs
                    </button>
                </div>

                {/* CONDITIONAL LAZY-LOADED DESTINATIONS DISPLAY */}
                {showDestinations && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Monitored Stations & Safe Hubs</p>
                        
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

                {/* SIGN OUT & ESCAPE PLACEMENT */}
                <div className="space-y-3 pt-4">
                    <button 
                        type="button"
                        onClick={() => { localStorage.clear(); navigate("/"); }}
                        className="w-full py-3.5 text-center font-medium text-sm bg-slate-900 border border-white/10 hover:bg-[#0c101a] hover:border-white/20 text-slate-300 rounded-xl active:scale-[0.99] transition-all cursor-pointer"
                    >
                        Sign Out
                    </button>

                    <button 
                        type="button"
                        onClick={() => setIsDeleteOpen(true)}
                        className="w-full py-1 text-center font-medium text-[11px] text-slate-600 hover:text-red-400/80 tracking-wider transition-colors cursor-pointer"
                    >
                        Close Account Permanently
                    </button>
                </div>
            </div>

            {/* DYNAMIC EDIT SPECIFICATIONS MODAL */}
            {isEditOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <form 
                        onSubmit={handleUpdateProfile}
                        className="bg-[#090d16] border border-white/5 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left"
                    >
                        <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                            <h3 className="text-sm font-semibold text-white tracking-tight">Identity Specifications</h3>
                            <button 
                                type="button" 
                                onClick={() => { setIsEditOpen(false); handleReset(); }}
                                className="text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-xs text-slate-400 font-medium px-0.5">Username</label>
                                <input 
                                    type="text" 
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                                    className="w-full bg-[#05070f] border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/10 transition-all font-mono" 
                                    required
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-400 font-medium px-0.5">First Name</label>
                                    <input 
                                        type="text" 
                                        value={editForm.firstName}
                                        onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                                        className="w-full bg-[#05070f] border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-400 font-medium px-0.5">Last Name</label>
                                    <input 
                                        type="text" 
                                        value={editForm.lastName}
                                        onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                                        className="w-full bg-[#05070f] border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs text-slate-400 font-medium px-0.5 flex items-center justify-between">
                                    <span>Email Address</span>
                                    <span className="text-[9px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md font-mono tracking-wider uppercase scale-90">Verified</span>
                                </label>
                                <div className="relative flex items-center">
                                    <Mail size={14} className="absolute left-3 text-slate-600" />
                                    <input 
                                        type="email" 
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                        className="w-full bg-[#05070f] border border-white/5 rounded-xl p-3 pl-9 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all font-mono" 
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 border-t border-white/[0.04] pt-3">
                                <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5 px-0.5">
                                    <Lock size={12} className="text-slate-500" /> Change Password
                                </label>
                                <input 
                                    type="password" 
                                    placeholder="••••••••"
                                    value={editForm.password}
                                    onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                                    className="w-full bg-[#05070f] border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/60 placeholder:text-slate-700 transition-all" 
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button"
                                onClick={() => { setIsEditOpen(false); handleReset(); }}
                                className="flex-1 py-3 bg-slate-900 border border-white/5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                Discard
                            </button>
                            <button 
                                type="submit"
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.97]"
                            >
                                Apply Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* STICKY FLOATING PERSISTENT SAVE NOTIFICATION BAR */}
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
