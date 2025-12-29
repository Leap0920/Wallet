"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Wallet, Mail, ArrowLeft, Loader2, CheckCircle, KeyRound, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { toast } from "sonner"

type Step = 'email' | 'verify' | 'reset' | 'success'

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [step, setStep] = useState<Step>('email')
    const [email, setEmail] = useState("")
    const [code, setCode] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [devCode, setDevCode] = useState<string | null>(null)

    // Step 1: Send verification code
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong')
            }

            if (data.devMode && data.devCode) {
                setDevCode(data.devCode)
                setCode(data.devCode)
                toast.info("Dev mode: email sending not configured. Using generated code.")
            } else {
                setDevCode(null)
                toast.success("Verification code sent to your email!")
            }
            setStep('verify')
        } catch (error: any) {
            toast.error(error.message || "Failed to send code. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    // Step 2: Verify code
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch('/api/auth/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Invalid code')
            }

            toast.success("Code verified!")
            setStep('reset')
        } catch (error: any) {
            toast.error(error.message || "Invalid or expired code")
        } finally {
            setIsLoading(false)
        }
    }

    // Step 3: Reset password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }

        setIsLoading(true)

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, newPassword }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to reset password')
            }

            toast.success("Password reset successfully!")
            setStep('success')
        } catch (error: any) {
            toast.error(error.message || "Failed to reset password")
        } finally {
            setIsLoading(false)
        }
    }

    // Resend code
    const handleResendCode = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            if (!res.ok) {
                throw new Error('Failed to resend code')
            }

            toast.success("New code sent to your email!")
            setCode("")
        } catch {
            toast.error("Failed to resend code")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
            <Card className="w-full max-w-sm bg-neutral-900 border-neutral-800">
                <CardHeader className="text-center pb-2">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        {step === 'success' ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : step === 'verify' ? (
                            <KeyRound className="w-6 h-6 text-white" />
                        ) : step === 'reset' ? (
                            <Lock className="w-6 h-6 text-white" />
                        ) : (
                            <Wallet className="w-6 h-6 text-white" />
                        )}
                        <span className="font-semibold text-lg text-white">WalletWise</span>
                    </div>
                    <h1 className="text-xl font-semibold text-white">
                        {step === 'email' && "Reset Password"}
                        {step === 'verify' && "Enter Verification Code"}
                        {step === 'reset' && "Create New Password"}
                        {step === 'success' && "Password Reset!"}
                    </h1>
                    <p className="text-sm text-neutral-500">
                        {step === 'email' && "Enter your email to receive a verification code"}
                        {step === 'verify' && `We sent a 6-digit code to ${email}`}
                        {step === 'reset' && "Enter your new password below"}
                        {step === 'success' && "Your password has been reset successfully"}
                    </p>
                </CardHeader>

                <CardContent>
                    {/* Step 1: Email */}
                    {step === 'email' && (
                        <form onSubmit={handleSendCode} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-neutral-300 text-sm">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-600"
                                        required
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-white text-black hover:bg-neutral-200"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Send Verification Code
                                    </>
                                )}
                            </Button>
                        </form>
                    )}

                    {/* Step 2: Verify Code */}
                    {step === 'verify' && (
                        <form onSubmit={handleVerifyCode} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-neutral-300 text-sm">Verification Code</Label>
                                <Input
                                    id="code"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Enter 6-digit code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="text-center text-2xl tracking-[0.5em] bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 placeholder:text-sm placeholder:tracking-normal focus:border-neutral-600"
                                    maxLength={6}
                                    required
                                />
                                {devCode && (
                                    <p className="text-xs text-neutral-500">Dev mode: code is prefilled ({devCode}).</p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-white text-black hover:bg-neutral-200"
                                disabled={isLoading || code.length !== 6}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Verify Code
                                    </>
                                )}
                            </Button>
                            <div className="flex items-center justify-between text-sm">
                                <button
                                    type="button"
                                    onClick={() => setStep('email')}
                                    className="text-neutral-500 hover:text-white transition-colors"
                                >
                                    ← Change email
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={isLoading}
                                    className="text-neutral-500 hover:text-white transition-colors disabled:opacity-50"
                                >
                                    Resend code
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: Reset Password */}
                    {step === 'reset' && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-neutral-300 text-sm">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                    <Input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="pl-10 pr-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-600"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-neutral-300 text-sm">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-600"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-white text-black hover:bg-neutral-200"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="mr-2 h-4 w-4" />
                                        Reset Password
                                    </>
                                )}
                            </Button>
                        </form>
                    )}

                    {/* Step 4: Success */}
                    {step === 'success' && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <p className="text-green-400 text-sm">
                                    Your password has been reset successfully!
                                </p>
                                <p className="mt-2 text-xs text-neutral-500">
                                    You can now sign in with your new password.
                                </p>
                            </div>
                            <Button
                                onClick={() => router.push('/login')}
                                className="w-full bg-white text-black hover:bg-neutral-200"
                            >
                                Go to Sign In
                            </Button>
                        </div>
                    )}
                </CardContent>

                {step !== 'success' && (
                    <CardFooter className="justify-center">
                        <Link
                            href="/login"
                            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Sign In
                        </Link>
                    </CardFooter>
                )}
            </Card>
        </div>
    )
}
