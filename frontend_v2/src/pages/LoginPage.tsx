import { Link, Form, useSearchParams, useNavigation, redirect } from "react-router"
import { InfoIcon } from "lucide-react"
import { useEffect } from "react"
import toast from "react-hot-toast"
import { type ActionProps } from "@/lib/types"
import { loginWithEmailAndPassword, checkForAdmin, dashboardPathForRole } from "../database/auth.js"
import { usePageTitle } from "@/lib/usePageTitle"
import AuthBackButton from "@/components/auth/AuthBackButton"
import AuthInput from "@/components/auth/AuthInput"
import AuthButton from "@/components/auth/AuthButton"

//form action
// eslint-disable-next-line react-refresh/only-export-components
export async function action({ request }: ActionProps) {
    //data collection from the form
    const formData = await request.formData()
    const identifier: string = String(formData.get("identifier"))
    const password: string = String(formData.get("password"))

    try {
        //submit data of form and display toast then go to the map
        const user = await loginWithEmailAndPassword(identifier, password)
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
    usePageTitle("Log In")
    //searchParams to grap message send from the redirect("/login?message=this is to set the url with a message") check labels B
    const [searchParams, setSearchParams] = useSearchParams()
    const message = searchParams.get("message")
    //states of the form e.g loading ,idle and submitting check label c
    const navigation = useNavigation()

    //useEffect usecase here avoides a infinate loop
    useEffect(() => {
        //after 4 sec deletes the message on url bar (label B1)
        const timer = setTimeout(() => {
            setSearchParams(pre => {
                if (pre.get("message")) pre.delete("message")
                return pre
            })
        }, 4000)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="w-[90%]">
            <div className="w-full flex justify-start mb-2">
                <AuthBackButton to="/" />
            </div>

            <h1 className="w-full text-3xl font-bold text-black text-center mb-2">Welcome</h1>
            <p className="w-full text-gray-400 text-center mb-6">Sign in to continue to Mapper</p>

            <Form method="POST" replace className="w-full">
                <div className="mx-auto w-[70%] space-y-4">
                    {/**if user tries to use the map without logging in this message will display for a few secs  label B2*/}
                    {message && (
                        <p className="w-full text-amber-800 flex gap-2 items-center rounded-xl px-3 py-2 bg-amber-50 border border-amber-200 text-xs font-medium">
                            <InfoIcon size={14} className="shrink-0" />{message}
                        </p>
                    )}

                    <AuthInput
                        label="Email or Username"
                        name="identifier"
                        placeholder="Enter Email or Username"
                    />
                    <div>
                        <AuthInput
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="Enter Password"
                        />
                        <div className="mt-2 text-right">
                            <Link to="/login/forgot-password" className="text-auth-link hover:text-auth-link-hover transition-colors text-sm font-medium">
                                Forgot Password
                            </Link>
                        </div>
                    </div>

                    <p className="w-full text-gray-400 text-sm text-center">
                        Don't have an account?{" "}
                        <Link to="/login/signin" className="text-auth-link hover:text-auth-link-hover transition-colors font-semibold">
                            Sign up
                        </Link>
                    </p>
                </div>

                <div className="mx-auto w-[40%] mt-4">
                    <AuthButton disabled={navigation.state === "submitting"}>
                        {navigation.state === "submitting" ? "Signing in…" : "Sign in"}
                    </AuthButton>
                </div>
            </Form>
        </div>
    )
}
