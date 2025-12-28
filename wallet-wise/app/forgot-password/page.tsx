"use client"

import { useState } from "react"
import Link from "next/link"
import { Wallet, Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Simulate API call - in production, implement actual password reset
            await new Promise(resolve => setTimeout(resolve, 1500))
            setIsSubmitted(true)
            toast.success("Password reset link sent!")
        } catch (error) {
            toast.error("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
            <Card className="w-full max-w-sm bg-neutral-900 border-neutral-800">
                <CardHeader className="text-center pb-2">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        {isSubmitted ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : (
                            <Wallet className="w-6 h-6 text-white" />
                        )}
                        <span className="font-semibold text-lg text-white">WalletWise</span>
                    </div>
                    <h1 className="text-xl font-semibold text-white">
                        {isSubmitted ? "Check Your Email" : "Reset Password"}
                    </h1>
                    <p className="text-sm text-neutral-500">
                        {isSubmitted
                            ? "We've sent a password reset link to your email"
                            : "Enter your email to receive a password reset link"
                        }
                    </p>
                </CardHeader>

                {!isSubmitted ? (
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                        Send Reset Link
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                ) : (
                    <CardContent>
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                            <p className="text-green-400 text-sm">
                                Password reset link sent to <strong>{email}</strong>
                            </p>
                            <p className="mt-2 text-xs text-neutral-500">
                                Check your inbox and follow the instructions to reset your password.
                            </p>
                        </div>
                    </CardContent>
                )}

                <CardFooter className="justify-center">
                    <Link
                        href="/login"
                        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sign In
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
