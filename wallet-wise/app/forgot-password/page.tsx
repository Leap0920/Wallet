"use client"

import { useState } from "react"
import Link from "next/link"
import { Wallet, Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            // Always show success to prevent email enumeration
            setIsSubmitted(true)
        } catch {
            // Still show success
            setIsSubmitted(true)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="dark min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float" />
            </div>

            <Card className="w-full max-w-md glass-dark border-white/10 shadow-2xl relative z-10">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                        {isSubmitted ? (
                            <CheckCircle className="w-8 h-8 text-white" />
                        ) : (
                            <Wallet className="w-8 h-8 text-white" />
                        )}
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-white">
                            {isSubmitted ? "Check Your Email" : "Reset Password"}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            {isSubmitted
                                ? "If an account exists with this email, you'll receive a password reset link."
                                : "Enter your email to receive a password reset link"
                            }
                        </CardDescription>
                    </div>
                </CardHeader>

                {!isSubmitted ? (
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4">
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Mail className="w-4 h-4 mr-2" />
                                )}
                                {isLoading ? "Sending..." : "Send Reset Link"}
                            </Button>

                            <Link
                                href="/login"
                                className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sign In
                            </Link>
                        </CardFooter>
                    </form>
                ) : (
                    <CardFooter className="flex flex-col gap-4">
                        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
                            <p>We&apos;ve sent a password reset link to <strong>{email}</strong></p>
                            <p className="mt-2 text-xs text-slate-500">
                                (Note: This is a demo. In production, you would receive an actual email.)
                            </p>
                        </div>

                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
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
