import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { userData } from "../database/auth.js";
import AccountPanel from "./AccountPanel";

interface AdminProfileModalProps {
    onClose: () => void;
}

/**
 * Same profile UI every user gets at /account, opened as an overlay instead
 * of a full-page navigation so the admin sidebar/header stay mounted behind
 * it (point 2c of the admin portal spec — clicking the header profile
 * "pulls up" this panel rather than leaving the portal).
 */
export default function AdminProfileModal({ onClose }: AdminProfileModalProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        userData()
            .then((details: any) => { if (!cancelled) setData(details); })
            .catch(() => { if (!cancelled) setData({}); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                {loading ? (
                    <div className="bg-[#05070f] rounded-2xl p-16 flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-slate-500" />
                    </div>
                ) : (
                    <AccountPanel initialData={data} onClose={onClose} />
                )}
            </div>
        </div>
    );
}
