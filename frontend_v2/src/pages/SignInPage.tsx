import { useState } from "react"
import { Form, Link, redirect, useNavigate } from "react-router"
import { EyeIcon, EyeOff, ImagePlus } from "lucide-react"
import { addUser } from "../database/auth.js"
import type { ActionProps } from "@/lib/types"
import toast from "react-hot-toast"
import { usePageTitle } from "@/lib/usePageTitle"

// eslint-disable-next-line react-refresh/only-export-components
export async function action({ request }: ActionProps) {
    try {
        const formData = await request.formData()
        const email: string = String(formData.get("email"))
        const password: string = String(formData.get("password"))
        const name: string = String(formData.get("first_name"))
        const lastName: string = String(formData.get("last_name"))
        const username: string = String(formData.get("email")).split("@")[0]
        //email, password, username, firstName, lastName,

        const user = await addUser(email, password, username, name, lastName)
        toast.success("Account created successfully")
        localStorage.setItem("userType", user.userType)
        localStorage.setItem("token", user.token)
        return redirect("/map")
    } catch (error) {
        const message = error instanceof Error ? error.message : "Error creating account."
        toast.error(message)
        return null
    }
}

export default function Sigin() {
    usePageTitle("Create Account")
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [hasAgreed, setHasAgreed] = useState<boolean>(false)
    const [fileName, setFileName] = useState<string>("")
    const navigate = useNavigate()

    const inputClass = "h-11 px-4 bg-white border border-brand-border rounded-xl placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue"

    return (
        <div className="w-full max-w-sm">
            <h1 className="text-3xl font-extrabold text-brand-ink mb-1">Create an account</h1>
            <p className="text-brand-muted text-sm mb-6">
                Already have an account? <Link to="/login" className="text-brand-blue font-semibold hover:underline">Login</Link>
            </p>
            <Form method="POST" replace className="space-y-4">
                <div className="gap-3 flex">
                    <input required name="first_name" className={`${inputClass} w-1/2`} placeholder="First name" />
                    <input required name="last_name" className={`${inputClass} w-1/2`} placeholder="Last name" />
                </div>

                <label
                    htmlFor="profile-upload"
                    className="flex items-center gap-3 h-11 px-4 bg-white border border-brand-border rounded-xl cursor-pointer hover:border-brand-blue/50 transition-all active:scale-[0.98]"
                >
                    <ImagePlus className="size-5 text-brand-muted" />
                    <span className="text-brand-muted text-sm font-medium">
                        {fileName || "Profile picture (optional)"}
                    </span>
                    <input
                        id="profile-upload"
                        name="profile_picture"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setFileName(file.name);
                        }}
                    />
                </label>

                <input required name="email" type="email" placeholder="Email" className={`${inputClass} w-full block`} />

                <div className="w-full bg-white border border-brand-border
                                flex justify-between
                                focus-within:ring-2
                                focus-within:ring-brand-blue/40
                                focus-within:border-brand-blue
                                items-center rounded-xl text-brand-ink">
                    <input
                        required
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        className="min-w-20 bg-transparent text-brand-ink placeholder:text-brand-muted outline-none w-full h-11 px-4"
                    />
                    <button
                        type="button"
                        className="size-10 shrink-0 text-center flex items-center justify-center text-brand-muted hover:text-brand-ink"
                        onClick={() => setShowPassword(pre => !pre)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeIcon size={18} /> : <EyeOff size={18} />}
                    </button>
                </div>

                <label className="flex gap-2 items-start text-xs text-brand-muted">
                    <input className="size-4 mt-0.5" onChange={() => setHasAgreed(pre => !pre)} type="checkbox" />
                    <span>
                        I agree to the{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/conditions")}
                            className="text-brand-blue font-semibold hover:underline"
                        >
                            Terms &amp; Conditions
                        </button>
                    </span>
                </label>

                <button
                    disabled={!hasAgreed}
                    className={`w-full ${hasAgreed ? 'cursor-pointer bg-brand-ink hover:bg-brand-blue-dark' : 'cursor-not-allowed bg-slate-300'} text-white font-semibold py-3 px-4 rounded-xl transition-colors`}
                >Create account</button>
            </Form>
        </div>
    )
}
