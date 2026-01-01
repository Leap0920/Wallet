"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface AddPaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    wallets: {
        id: string
        name: string
        currency: string
    }[]
    debt: {
        id: string
        person: string
        type: string
        amount: number
        interest: number | null
        remaining: number
        walletId: string | null
    } | null
}

export function AddPaymentDialog({ open, onOpenChange, onSuccess, wallets, debt }: AddPaymentDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [amount, setAmount] = useState("")
    const [note, setNote] = useState("")
    const [walletId, setWalletId] = useState<string>(debt?.walletId || "NO_WALLET")

    // Update walletId if debt changes
    useEffect(() => {
        if (debt?.walletId) setWalletId(debt.walletId)
        else setWalletId("NO_WALLET")
    }, [debt])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!debt) return

        setIsLoading(true)

        try {
            const res = await fetch(`/api/debts/${debt.id}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    note,
                    date: new Date(),
                    walletId: walletId === "NO_WALLET" ? null : walletId
                })
            })

            if (!res.ok) throw new Error()

            toast.success("Payment added")
            setAmount("")
            setNote("")
            onOpenChange(false)
            onSuccess()
        } catch (error) {
            toast.error("Failed to add payment")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Payment</DialogTitle>
                </DialogHeader>
                {debt && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="p-3 bg-neutral-800 rounded-lg space-y-1">
                            <p className="text-sm text-neutral-400">
                                {debt.type === "LENT" ? "Receive from" : "Pay to"}: <span className="text-white font-medium">{debt.person}</span>
                            </p>
                            <p className="text-sm text-neutral-400">
                                Remaining: <span className="text-white font-medium">{formatCurrency(debt.remaining, "PHP")}</span>
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-neutral-400">Wallet (Optional - will affect balance)</Label>
                            <Select
                                value={walletId}
                                onValueChange={(value) => setWalletId(value)}
                            >
                                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                                    <SelectValue placeholder="Select wallet" />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                    <SelectItem value="NO_WALLET">No Wallet</SelectItem>
                                    {wallets.map((wallet) => (
                                        <SelectItem key={wallet.id} value={wallet.id}>
                                            {wallet.name} ({wallet.currency})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-neutral-500">
                                {debt.type === "LENT"
                                    ? "Receiving payment will add to the selected wallet."
                                    : "Paying debt will deduct from the selected wallet."}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-neutral-400">Payment Amount (₱)</Label>
                            <Input
                                required
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                max={debt.remaining}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-700 h-7"
                                    onClick={() => setAmount((debt.remaining / 2).toFixed(2))}
                                >
                                    50%
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-700 h-7"
                                    onClick={() => setAmount(debt.remaining.toFixed(2))}
                                >
                                    Full Payment
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-neutral-400">Note (Optional)</Label>
                            <Input
                                placeholder="e.g. GCash payment"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-white text-black hover:bg-neutral-200 mt-2"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Submit Payment
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
