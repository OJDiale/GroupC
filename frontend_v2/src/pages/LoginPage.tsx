import { Link, Form, useSearchParams, useNavigation, redirect } from "react-router"
import { EyeIcon, InfoIcon, EyeOff } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { type ActionProps } from "@/lib/types"
import { loginWithEmailAndPassword, checkForAdmin, dashboardPathForRole } from "../database/auth.js"

//form action
// eslint-disable-next-line react-refresh/only-export-components
export async function action({ request }: ActionProps) {
    //data collection from the form
    const formData = await request.formData()
    const email: string = String(formData.get("email"))
    const password: string = String(formData.get("password"))

    try {
        //submit data of form and display toast then go to the map
        const user = await loginWithEmailAndPassword(email, password)
        const token = user.token
        const userType = user.userType
        localStorage.setItem("token", token)
        localStorage.setItem("userType", userType)
        const isAdmin = await checkForAdmin(userType)
        localStorage.setItem("isAdmin", JSON.stringify(isAdmin))
        toast.success("Logged in successfully")
        //redirects each role to its own dashboard (admin, traffic authority,
        //security agency, data analyst all land somewhere other than /map)
        return redirect(dashboardPathForRole(userType))
    } catch (err) {
        //surface the real reason login failed instead of a generic message
        const message = err instanceof Error ? err.message : "Login failed. Please try again."
        toast.error(message)
        return null
    }
}

export default function Login() {
    //state for toggling between input type of text and password in order to hide and show it check label A below
    const [showPassword, setShowPassword] = useState<boolean>(false)
    //searchParams to grap message send from the redirect("/login?message=this is to set the url with a message") check labels B
    const [searchParams, setSearchParams] = useSearchParams()
    const message = searchParams.get("message")
    //states of the form e.g loading ,idle and submitting check label c
    const navigation = useNavigation()

    //useEffect usecase here avoides a infinate loop
    useEffect(() => {
        //after 2 sec deletes the message on url bar (label B1)
        const timer = setTimeout(() => {
            setSearchParams(pre => {
                if (pre.get("message")) pre.delete("message")
                return pre
            })
        }, 4000)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="w-full max-w-sm">
            <h1 className="text-3xl font-extrabold text-brand-ink mb-1">Welcome back</h1>
            <p className="text-brand-muted text-sm mb-6">Login to continue to your account.</p>

            {/**if user tries to use the map without logging in this message will display for a few secs  label B2*/}
            {message && (
                <p className="text-amber-800 flex gap-2 items-center rounded-xl px-3 py-2 mb-4 bg-amber-50 border border-amber-200 text-xs font-medium">
                    <InfoIcon size={14} className="shrink-0" />{message}
                </p>
            )}
            <p className="text-brand-muted text-sm mb-6">
                Don't have an account? <Link to="signin" className="text-brand-blue font-semibold hover:underline">Sign up</Link>
            </p>
            <Form method="POST" replace className="space-y-4">
                <input
                    type="email"
                    name="email"
                    required
                    placeholder="Email"
                    className="block h-11 px-4 text-brand-ink bg-white border border-brand-border w-full rounded-xl placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue"
                />
                <div className="w-full bg-white border border-brand-border
                                flex justify-between
                                focus-within:ring-2
                                focus-within:ring-brand-blue/40
                                focus-within:border-brand-blue
                                items-center rounded-xl text-brand-ink">
                    <input
                        /**label A */
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
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

                <button
                    className={`${navigation.state === "submitting" ? "bg-slate-400 cursor-not-allowed" : "bg-brand-ink hover:bg-brand-blue-dark cursor-pointer"} w-full
                             text-white font-semibold py-3 px-4
                              rounded-xl transition-colors`}
                    disabled={navigation.state === "submitting"}
                >{navigation.state === "submitting" ? "Logging in…" : "Login"}</button>
            </Form>
        </div>
    )
}
