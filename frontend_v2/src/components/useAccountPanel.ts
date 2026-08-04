import { useNavigate } from "react-router"
import { deleteUserAccount, updateUserInfo } from "../database/auth.js"
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import { fetchUserDestinationHistory, formatRelativeTime, type DestinationLog } from "@/lib/utils.js";
import { downloadReportPdf } from "@/lib/pdfReport";

export type { DestinationLog };
export { formatRelativeTime };

/**
 * All profile-panel state/handlers (edit identity, change email/password,
 * trip logs, sign out, delete account) extracted so both the dark-glass
 * AccountPanel (used at /account and inside AdminProfileModal) and the
 * brand-styled map popup can share one source of truth instead of
 * duplicating logic per presentation.
 */
export function useAccountPanel(initialData: any) {
    const [data, setData] = useState(initialData || {})
    const navigate = useNavigate()

    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

    const [showDestinations, setShowDestinations] = useState(false)
    const [destinations, setDestinations] = useState<DestinationLog[]>([])
    const [loadingDestinations, setLoadingDestinations] = useState(false)

    const [hasChanges, setHasChanges] = useState(false)
    const [editForm, setEditForm] = useState({
        firstName: data?.firstname || "",
        lastName: data?.lastname || "",
    })

    const [newEmail, setNewEmail] = useState(data?.email || "")
    const [newPassword, setNewPassword] = useState("")

    useEffect(() => {
        const isChanged =
            editForm.firstName !== (data?.firstname || "") ||
            editForm.lastName !== (data?.lastname || "");

        setHasChanges(isChanged);
    }, [editForm, data]);

    const handleToggleDestinations = async () => {
        if (showDestinations) {
            setShowDestinations(false);
            return;
        }
        await loadDestinations();
        setShowDestinations(true);
    }

    const loadDestinations = async () => {
        if (destinations.length > 0) return;
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

    const handleDownloadTripLogsPdf = () => {
        downloadReportPdf({
            title: "Trip Logs Report",
            filename: `trip-logs-${data?.username || "user"}.pdf`,
            columns: ["Start", "End", "Date", "Safety"],
            rows: destinations.map((dest) => [
                dest.startLocation,
                dest.endLocation,
                formatRelativeTime(dest.createdAt),
                dest.safetyRating || "N/A",
            ]),
        });
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateUserInfo({
                firstName: editForm.firstName,
                lastName: editForm.lastName,
            });

            setData((prev: any) => ({
                ...prev,
                firstname: editForm.firstName,
                lastname: editForm.lastName,
            }))
        } catch (err: any) {
            console.error(err);
        }
    }

    const handleReset = () => {
        setEditForm({
            firstName: data?.firstname || "",
            lastName: data?.lastname || "",
        })
        toast.success("Changes discarded");
    }

    const handleChangeEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateUserInfo({ email: newEmail });
            setData((prev: any) => ({ ...prev, email: newEmail }));
            setIsEmailModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword.trim()) return;
        try {
            await updateUserInfo({ password: newPassword });
            setNewPassword("");
            setIsPasswordModalOpen(false);
        } catch (err) {
            console.error(err);
        }
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

    const handleLogout = () => { localStorage.clear(); navigate("/"); }

    return {
        data, navigate,
        isDeleteOpen, setIsDeleteOpen,
        isEmailModalOpen, setIsEmailModalOpen,
        isPasswordModalOpen, setIsPasswordModalOpen,
        showDestinations, setShowDestinations,
        destinations, loadingDestinations, loadDestinations,
        hasChanges, editForm, setEditForm,
        newEmail, setNewEmail,
        newPassword, setNewPassword,
        handleToggleDestinations, handleDownloadTripLogsPdf,
        handleUpdateProfile, handleReset,
        handleChangeEmail, handleChangePassword,
        handleConfirmDeletion, handleLogout,
    };
}
