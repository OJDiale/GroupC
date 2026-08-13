import { Link, redirect } from "react-router"
import { Form, useNavigation } from "react-router"
import { addUser } from "../database/auth.js"
import type { ActionProps } from "@/lib/types"
import toast from "react-hot-toast"
import { usePageTitle } from "@/lib/usePageTitle"
import AuthBackButton from "@/components/auth/AuthBackButton"
import AuthInput from "@/components/auth/AuthInput"
import AuthButton from "@/components/auth/AuthButton"

// eslint-disable-next-line react-refresh/only-export-components
export async function action({ request }: ActionProps) {
    try {
        const formData = await request.formData()
        const username: string = String(formData.get("username"))
        const firstName: string = String(formData.get("first_name"))
        const lastName: string = String(formData.get("last_name"))
        const email: string = String(formData.get("email"))
        const password: string = String(formData.get("password"))

        const user = await addUser(email, password, username, firstName, lastName)
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
    const navigation = useNavigation()

    return (
        <div className="w-[90%]">
            <div className="w-full flex justify-start mb-2">
                <AuthBackButton to="/login" />
            </div>

            <h1 className="w-full text-3xl font-bold text-black text-center mb-2">Create Your Account</h1>
            <p className="w-full text-gray-400 text-center mb-6">Register to access Mapper</p>

            <Form method="POST" replace className="w-full">
                <div className="mx-auto w-[70%] space-y-4">
                    <AuthInput label="Username" name="username" placeholder="Enter Username" />

                    <div className="flex gap-[16%]">
                        <AuthInput label="First Name" name="first_name" placeholder="Enter First Name" className="flex-1" />
                        <AuthInput label="Last Name" name="last_name" placeholder="Enter Last Name" className="flex-1" />
                    </div>

                    <AuthInput label="Email" name="email" type="email" placeholder="Enter Email" />

                    <AuthInput label="Password" name="password" type="password" placeholder="Enter Password" />

                    <p className="text-gray-400 text-sm text-right">
                        Already have an account?{" "}
                        <Link to="/login" className="text-auth-link hover:text-auth-link-hover transition-colors font-semibold">
                            Sign in
                        </Link>
                    </p>
                </div>

                <div className="mx-auto w-[40%] mt-4">
                    <AuthButton disabled={navigation.state === "submitting"}>
                        {navigation.state === "submitting" ? "Creating Account…" : "Create Account"}
                    </AuthButton>
                </div>
            </Form>
        </div>
    )
}
