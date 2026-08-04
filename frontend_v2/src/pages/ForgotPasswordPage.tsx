import { Form, useNavigation, redirect } from "react-router"
import toast from "react-hot-toast"
import type { ActionProps } from "@/lib/types"
import { resetPassword } from "../database/auth.js"
import { usePageTitle } from "@/lib/usePageTitle"
import AuthBackButton from "@/components/auth/AuthBackButton"
import AuthInput from "@/components/auth/AuthInput"
import AuthButton from "@/components/auth/AuthButton"

// eslint-disable-next-line react-refresh/only-export-components
export async function action({ request }: ActionProps) {
    const formData = await request.formData()
    const username: string = String(formData.get("username"))
    const email: string = String(formData.get("email"))
    const password: string = String(formData.get("password"))
    const confirmPassword: string = String(formData.get("confirm_password"))

    if (password !== confirmPassword) {
        toast.error("Passwords do not match.")
        return null
    }

    try {
        await resetPassword(username, email, password, confirmPassword)
        toast.success("Password reset successfully. Please sign in.")
        return redirect("/login")
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to reset password."
        toast.error(message)
        return null
    }
}

export default function ForgotPassword() {
    usePageTitle("Reset Password")
    const navigation = useNavigation()

    return (
        <div className="w-[90%]">
            <div className="w-full flex justify-start mb-2">
                <AuthBackButton to="/login" />
            </div>

            <h1 className="w-full text-3xl font-bold text-black text-center mb-2">Reset Your Password</h1>
            <p className="w-full text-gray-400 text-center mb-6">
                Please enter your username and email to reset password
            </p>

            <Form method="POST" replace className="w-full space-y-4">
                <AuthInput label="Username" name="username" placeholder="Enter Username" />
                <AuthInput label="Email" name="email" type="email" placeholder="Enter Email" />
                <AuthInput label="Password" name="password" type="password" placeholder="Enter Password" />
                <AuthInput label="Confirm Password" name="confirm_password" type="password" placeholder="Enter Confirm Password" />

                <AuthButton disabled={navigation.state === "submitting"}>
                    {navigation.state === "submitting" ? "Resetting…" : "Reset Password"}
                </AuthButton>
            </Form>
        </div>
    )
}
