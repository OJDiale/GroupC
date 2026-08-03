import { redirect, useLoaderData } from "react-router"
import { userData } from "../database/auth.js"
import { toast } from "react-hot-toast";
import { usePageTitle } from "@/lib/usePageTitle";
import AccountPanel from "@/components/AccountPanel";

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
    usePageTitle("My Account");
    const loaderData = useLoaderData() as any;

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <AccountPanel initialData={loaderData} />
            </div>
        </div>
    )
}
