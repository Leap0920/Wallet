"use client"

import { useState, useEffect } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface AddDebtDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    editDebt?: any | null
}

export function AddDebtDialog({ open, onOpenChange, onSuccess, editDebt = null }: AddDebtDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        type: "LENT",
        person: "",
        amount: "",
        interest: "",
        dueDate: "",
        description: ""
    })

    useEffect(() => {
        if (editDebt) {
            setFormData({
                type: editDebt.type,
                person: editDebt.person,
                amount: editDebt.amount.toString(),
                interest: editDebt.interest?.toString() || "",
                dueDate: editDebt.dueDate ? editDebt.dueDate.split('T')[0] : "",
                description: editDebt.description || ""
            })
        } else {
            setFormData({
                type: "LENT",
                person: "",
                amount: "",
                interest: "",
                dueDate: "",
                description: ""
            })
        }
    }, [editDebt, open])

    const handleSuggestInterest = () => {
        const amount = parseFloat(formData.amount)
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount first")
            return
        }
        // Suggest 5% interest
        const suggested = (amount * 0.05).toFixed(2)
        setFormData({ ...formData, interest: suggested })
        toast.info(`Suggested 5% interest (₱${suggested})`)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const url = editDebt ? `/api/debts/${editDebt.id}` : "/api/debts"
            const method = editDebt ? "PATCH" : "POST"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                    interest: formData.interest ? parseFloat(formData.interest) : null,
                    dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
                })
            })

            if (!res.ok) throw new Error()

            toast.success(`Debt ${editDebt ? 'updated' : 'added'}`)
            onOpenChange(false)
            onSuccess()
        } catch (error) {
            toast.error(`Failed to ${editDebt ? 'update' : 'add'} debt`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{editDebt ? "Edit Debt" : "Add New Debt"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-neutral-400">Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                        >
                            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                <SelectItem value="LENT">Pinautang (Lent)</SelectItem>
                                <SelectItem value="BORROWED">Utang (Borrowed)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-neutral-400">{formData.type === "LENT" ? "Borrower Name" : "Lender Name"}</Label>
                        <Input
                            required
                            placeholder="e.g. John Doe"
                            value={formData.person}
                            onChange={(e) => setFormData({ ...formData, person: e.target.value })}
                            className="bg-neutral-800 border-neutral-700 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-neutral-400">Principal Amount (₱)</Label>
                        <Input
                            required
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="bg-neutral-800 border-neutral-700 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-neutral-400">Interest (Optional ₱)</Label>
                            {formData.type === "LENT" && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-blue-400 hover:text-blue-300 hover:bg-transparent p-0"
                                    onClick={handleSuggestInterest}
                                >
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Suggest 5%
                                </Button>
                            )}
                        </div>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.interest}
                            onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                            className="bg-neutral-800 border-neutral-700 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-neutral-400">Due Date (Optional)</Label>
                        <Input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            className="bg-neutral-800 border-neutral-700 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-neutral-400">Description (Optional)</Label>
                        <Input
                            placeholder="Notes..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="bg-neutral-800 border-neutral-700 text-white"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-white text-black hover:bg-neutral-200 mt-2"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editDebt ? "Update Debt" : "Add Debt"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
