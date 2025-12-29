"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect } from "react"
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

    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [backgroundFile, setBackgroundFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(session?.user?.image || null)
    const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null)
    const avatarInputRef = useRef<HTMLInputElement | null>(null)
    const backgroundInputRef = useRef<HTMLInputElement | null>(null)
    const router = useRouter()

    // Fetch latest profile data (avatar/background) from the server so saved images persist
    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                const res = await fetch('/api/user/profile')
                if (!res.ok) return
                const data = await res.json()
                if (!mounted) return
                if (data?.avatarUrl) setAvatarPreview(data.avatarUrl)
                if (data?.backgroundUrl) setBackgroundPreview(data.backgroundUrl)
                if (data?.name) setFormData((s) => ({ ...s, name: data.name }))
            } catch (e) {
                console.warn('Could not load profile data', e)
            }
        }
        load()
        return () => { mounted = false }
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "background") => {
        const file = e.target.files?.[0]
        if (!file) return

        const url = URL.createObjectURL(file)

        if (type === "avatar") {
            setAvatarFile(file)
            setAvatarPreview(url)
        } else {
            setBackgroundFile(file)
            setBackgroundPreview(url)
        }
    }

    const handleSave = async () => {
        setIsLoading(true)
        try {
            // compress/resize images client-side before converting to data URLs
            const compressImage = (file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.8) => new Promise<string | null>(async (resolve, reject) => {
                if (!file) return resolve(null)
                try {
                    const img = await createImageBitmap(file)
                    let { width, height } = img
                    const aspect = width / height
                    if (width > maxWidth) {
                        width = maxWidth
                        height = Math.round(maxWidth / aspect)
                    }
                    if (height > maxHeight) {
                        height = maxHeight
                        width = Math.round(maxHeight * aspect)
                    }

                    const canvas = document.createElement('canvas')
                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    if (!ctx) return resolve(null)
                    ctx.drawImage(img, 0, 0, width, height)
                    const dataUrl = canvas.toDataURL('image/jpeg', quality)
                    resolve(dataUrl)
                } catch (err) {
                    // fallback to basic FileReader if createImageBitmap fails
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                }
            })

            // Preferred flow: upload files to S3 (or S3-compatible) via presigned URLs, store only public URLs in DB
            const payload: any = { ...formData }

            const uploadToPresign = async (file: File, type: 'avatar' | 'background') => {
                try {
                    // ask server for a presigned URL
                    const res = await fetch('/api/user/profile/presign', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename: file.name, contentType: file.type, keyPrefix: `users/${session?.user?.id}/${type}` })
                    })
                    if (!res.ok) return null
                    const data = await res.json()
                    if (!data?.uploadUrl || !data?.publicUrl) return null

                    // upload the file directly to the storage using the presigned URL
                    const put = await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
                    if (!put.ok) return null
                    return data.publicUrl
                } catch (e) {
                    console.warn('Presign upload failed, will fallback to inline upload', e)
                    return null
                }
            }

            // Try presigned upload first
            if (avatarFile) {
                const publicUrl = await uploadToPresign(avatarFile, 'avatar')
                if (publicUrl) payload.avatarUrl = publicUrl
                else {
                    const avatarData = await compressImage(avatarFile, 512, 512, 0.8)
                    if (avatarData) payload.avatarUrl = avatarData
                }
            }

            if (backgroundFile) {
                const publicUrl = await uploadToPresign(backgroundFile, 'background')
                if (publicUrl) payload.backgroundUrl = publicUrl
                else {
                    const backgroundData = await compressImage(backgroundFile, 1200, 400, 0.8)
                    if (backgroundData) payload.backgroundUrl = backgroundData
                }
            }

            const response = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (response.ok) {
                // try to read returned updated user and update UI
                const updated = await response.json().catch(() => null)
                if (updated) {
                    if (typeof updated.avatarUrl === "string") setAvatarPreview(updated.avatarUrl)
                    if (typeof updated.backgroundUrl === "string") setBackgroundPreview(updated.backgroundUrl)
                    if (typeof updated.name === "string") setFormData((s) => ({ ...s, name: updated.name }))
                    // also update next-auth session display if possible
                    try { await update({ name: updated.name ?? formData.name, image: updated.avatarUrl ?? avatarPreview ?? session?.user?.image }) } catch (e) { /* ignore */ }
                }
                setIsEditing(false)
                toast.success("Profile updated successfully!")
                // ensure server components / cached data are refreshed
                try { router.refresh() } catch (e) { /* ignore */ }
            } else {
                // attempt to read server error message
                let msg = 'Failed to update profile'
                try {
                    const json = await response.json()
                    if (json?.error) msg = json.error
                    else if (json?.message) msg = json.message
                } catch (e) {
                    try {
                        const text = await response.text()
                        if (text) msg = text
                    } catch (_) { }
                }
                toast.error(msg)
                console.error('Profile update failed', response.status, await response.text())
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
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Premium Profile Header Card */}
            <div className="relative rounded-[2rem] overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl">
                {/* Background banner */}
                <div
                    className="w-full h-48 md:h-64 bg-neutral-800 relative group"
                    style={{ backgroundImage: backgroundPreview ? `url(${backgroundPreview})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-60" />
                    {isEditing && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="absolute top-4 right-4 bg-black/50 border-none text-white hover:bg-black/70 backdrop-blur-md rounded-xl"
                            onClick={() => backgroundInputRef.current?.click()}
                        >
                            Change Background
                        </Button>
                    )}
                </div>

                <div className="px-6 pb-8 md:px-10 -mt-12 md:-mt-16 relative flex flex-col md:flex-row items-center md:items-end gap-6">
                    <div className="relative shrink-0">
                        <div className="p-1.5 bg-neutral-900 rounded-full shadow-2xl">
                            {avatarPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={avatarPreview}
                                    alt="avatar"
                                    className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-4 border-neutral-800 shadow-xl"
                                />
                            ) : (
                                <Avatar className="w-28 h-28 md:w-36 md:h-36 border-4 border-neutral-800">
                                    <AvatarFallback className="bg-neutral-800 text-white text-4xl">
                                        {session.user.name?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                        {isEditing && (
                            <button
                                onClick={() => avatarInputRef.current?.click()}
                                className="absolute bottom-2 right-2 p-2.5 bg-blue-600 rounded-full text-white hover:bg-blue-500 shadow-lg transition-all hover:scale-110 active:scale-95 z-10"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-1 mb-2">
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{session.user.name}</h2>
                        <p className="text-neutral-400 font-medium text-sm flex items-center justify-center md:justify-start gap-2">
                            <Mail className="w-4 h-4 text-neutral-500" />
                            {session.user.email}
                        </p>
                    </div>

                    {!isEditing && (
                        <div className="pb-2">
                            <Button
                                onClick={() => setIsEditing(true)}
                                variant="outline"
                                className="rounded-2xl border-neutral-800 bg-neutral-900/50 backdrop-blur-md text-neutral-300 hover:text-white hover:bg-neutral-800 px-8 h-12 font-bold transition-all hover:scale-105 active:scale-95"
                            >
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit Profile
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                        <div className="hidden md:flex items-center">
                            {avatarPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatarPreview} alt="avatar" className="w-16 h-16 rounded-full object-cover border-2 border-neutral-700" />
                            ) : (
                                <Avatar className="w-16 h-16">
                                    <AvatarFallback className="bg-neutral-700 text-white text-xl">
                                        {session.user.name?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                        </div>
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

                        {/* Image upload controls */}
                        {isEditing && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-neutral-300 text-sm">Profile Photo</Label>
                                    <div className="flex items-center gap-3">
                                        <Button variant="outline" onClick={() => avatarInputRef.current?.click()} className="border-neutral-700 text-neutral-300">
                                            Upload Avatar
                                        </Button>
                                        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'avatar')} />
                                        {avatarPreview && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={avatarPreview} alt="avatar preview" className="w-16 h-16 rounded object-cover border" />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-neutral-300 text-sm">Background Photo</Label>
                                    <div className="flex items-center gap-3">
                                        <Button variant="outline" onClick={() => backgroundInputRef.current?.click()} className="border-neutral-700 text-neutral-300">
                                            Upload Background
                                        </Button>
                                        <input ref={backgroundInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'background')} />
                                        {backgroundPreview && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={backgroundPreview} alt="background preview" className="w-32 h-16 rounded object-cover border" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

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