"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { User, Mail, Calendar, Edit3, Save, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export default function ProfilePage() {
    const { data: session, update } = useSession()
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: session?.user?.name || "",
        email: session?.user?.email || "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const response = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                await update({ name: formData.name })
                setIsEditing(false)
                toast.success("Profile updated successfully!")
            } else {
                throw new Error("Failed to update profile")
            }
        } catch (error) {
            toast.error("Failed to update profile. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        setFormData({
            name: session?.user?.name || "",
            email: session?.user?.email || "",
        })
        setIsEditing(false)
    }

    if (!session) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Profile</h1>
                    <p className="text-neutral-400">Manage your account information</p>
                </div>
                {!isEditing && (
                    <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                    >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Profile
                    </Button>
                )}
            </div>

            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                        <Avatar className="w-16 h-16">
                            <AvatarFallback className="bg-neutral-700 text-white text-xl">
                                {session.user.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-white">{session.user.name}</CardTitle>
                            <p className="text-neutral-400">{session.user.email}</p>
                        </div>
                    </div>
                </CardHeader>

                <Separator className="bg-neutral-800" />

                <CardContent className="pt-6">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-neutral-300 text-sm flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Full Name
                                </Label>
                                {isEditing ? (
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="bg-neutral-800 border-neutral-700 text-white focus:border-neutral-600"
                                        placeholder="Enter your full name"
                                    />
                                ) : (
                                    <div className="p-3 bg-neutral-800 rounded-md text-white">
                                        {session.user.name || "Not provided"}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-neutral-300 text-sm flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Email Address
                                </Label>
                                <div className="p-3 bg-neutral-800 rounded-md text-neutral-400">
                                    {session.user.email}
                                    <span className="text-xs block mt-1">Email cannot be changed</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-neutral-300 text-sm flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Member Since
                            </Label>
                            <div className="p-3 bg-neutral-800 rounded-md text-white">
                                {new Date().toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex gap-3 pt-4">
                                <Button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="bg-white text-black hover:bg-neutral-200"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={handleCancel}
                                    variant="outline"
                                    className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}