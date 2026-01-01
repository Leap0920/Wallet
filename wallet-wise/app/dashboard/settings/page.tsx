"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Settings,
    Shield,
    Database,
    Trash2,
    Eye,
    EyeOff,
    Loader2,
    AlertTriangle,
    Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { CURRENCIES, CurrencyCode } from "@/lib/utils"
import { useCurrency } from "@/components/providers/currency-provider"

export default function SettingsPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const { displayCurrency, setDisplayCurrency } = useCurrency()
    const [isLoading, setIsLoading] = useState(false)
    const [isSavingCurrency, setIsSavingCurrency] = useState(false)
    const [isSavingCategories, setIsSavingCategories] = useState(false)
    const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(displayCurrency)
    const [categories, setCategories] = useState<string[]>([])
    const [newCategory, setNewCategory] = useState("")
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Fetch preferences on mount
    useEffect(() => {
        const fetchPreferences = async () => {
            const response = await fetch("/api/user/preferences")
            if (response.ok) {
                const data = await response.json()
                setCategories(data.categories || [])
            }
        }
        fetchPreferences()
    }, [])

    // Sync local state when displayCurrency changes
    useEffect(() => {
        setSelectedCurrency(displayCurrency)
    }, [displayCurrency])

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    })

    const handleCurrencyChange = async (newCurrency: string) => {
        const currency = newCurrency as CurrencyCode
        setSelectedCurrency(currency)
        setIsSavingCurrency(true)

        try {
            const response = await fetch("/api/user/preferences", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ displayCurrency: newCurrency }),
            })

            if (response.ok) {
                setDisplayCurrency(currency)
                toast.success(`Display currency changed to ${currency}`)
                router.refresh()
            } else {
                throw new Error("Failed to update currency")
            }
        } catch (error) {
            toast.error("Failed to update display currency")
            setSelectedCurrency(displayCurrency) // Revert on error
        } finally {
            setIsSavingCurrency(false)
        }
    }

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return
        if (categories.includes(newCategory.trim())) {
            toast.error("Category already exists")
            return
        }

        const updatedCategories = [...categories, newCategory.trim()]
        setIsSavingCategories(true)

        try {
            const response = await fetch("/api/user/preferences", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categories: updatedCategories }),
            })

            if (response.ok) {
                setCategories(updatedCategories)
                setNewCategory("")
                toast.success("Category added")
                router.refresh()
            } else {
                throw new Error()
            }
        } catch (error) {
            toast.error("Failed to add category")
        } finally {
            setIsSavingCategories(false)
        }
    }

    const handleRemoveCategory = async (categoryToRemove: string) => {
        const updatedCategories = categories.filter(c => c !== categoryToRemove)
        setIsSavingCategories(true)

        try {
            const response = await fetch("/api/user/preferences", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categories: updatedCategories }),
            })

            if (response.ok) {
                setCategories(updatedCategories)
                toast.success("Category removed")
                router.refresh()
            } else {
                throw new Error()
            }
        } catch (error) {
            toast.error("Failed to remove category")
        } finally {
            setIsSavingCategories(false)
        }
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value })
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords don't match")
            return
        }

        if (passwordData.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch("/api/user/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                }),
            })

            if (response.ok) {
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
                toast.success("Password updated successfully!")
            } else {
                const error = await response.json()
                toast.error(error.message || "Failed to update password")
            }
        } catch (error) {
            toast.error("Failed to update password. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }
    const handleDeleteAccount = async () => {
        try {
            const response = await fetch("/api/user/delete-account", {
                method: "DELETE",
            })

            if (response.ok) {
                toast.success("Account deleted successfully")
                // Redirect to login or home page
                window.location.href = "/"
            } else {
                throw new Error("Failed to delete account")
            }
        } catch (error) {
            toast.error("Failed to delete account. Please try again.")
        }
    }

    if (!session) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-neutral-400">Manage your account preferences and security</p>
            </div>

            {/* Currency Preferences */}
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Display Currency
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-neutral-400 mb-4">
                            Choose your preferred currency for viewing balances and totals.
                            All amounts will be converted using real-time exchange rates.
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 max-w-xs">
                                <Select
                                    value={selectedCurrency}
                                    onValueChange={handleCurrencyChange}
                                    disabled={isSavingCurrency}
                                >
                                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-800 border-neutral-700">
                                        {CURRENCIES.map((currency) => (
                                            <SelectItem
                                                key={currency.code}
                                                value={currency.code}
                                                className="text-white focus:bg-neutral-700"
                                            >
                                                {currency.symbol} {currency.code} - {currency.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {isSavingCurrency && (
                                <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Categories Management */}
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Manage Categories
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add new category..."
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="bg-neutral-800 border-neutral-700 text-white"
                        />
                        <Button
                            onClick={handleAddCategory}
                            disabled={isSavingCategories}
                            className="bg-white text-black hover:bg-neutral-200"
                        >
                            {isSavingCategories ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {categories.map((cat) => (
                            <div
                                key={cat}
                                className="flex items-center gap-2 bg-neutral-800 text-white px-3 py-1.5 rounded-lg border border-neutral-700"
                            >
                                <span className="text-sm">{cat}</span>
                                <button
                                    onClick={() => handleRemoveCategory(cat)}
                                    className="text-neutral-500 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <p className="text-sm text-neutral-500 italic">No custom categories added yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Security
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Change Password</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-neutral-300 text-sm">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        name="currentPassword"
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        className="bg-neutral-800 border-neutral-700 text-white pr-10"
                                        placeholder="Enter current password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                                    >
                                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-neutral-300 text-sm">New Password</Label>
                                <div className="relative">
                                    <Input
                                        name="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        className="bg-neutral-800 border-neutral-700 text-white pr-10"
                                        placeholder="Enter new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-neutral-300 text-sm">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        className="bg-neutral-800 border-neutral-700 text-white pr-10"
                                        placeholder="Confirm new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-white text-black hover:bg-neutral-200"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Password"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
            {/* Danger Zone */}
            <Card className="bg-neutral-900 border-red-800">
                <CardHeader>
                    <CardTitle className="text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Danger Zone
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-white">Delete Account</Label>
                            <p className="text-sm text-neutral-400">
                                Permanently delete your account and all associated data
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Account
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-neutral-900 border-neutral-800">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-neutral-400">
                                        This action cannot be undone. This will permanently delete your account
                                        and remove all your data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteAccount}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        Delete Account
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}