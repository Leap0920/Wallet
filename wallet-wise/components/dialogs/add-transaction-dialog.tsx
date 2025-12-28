"use client"

import { useState } from "react"
import { Loader2, ArrowRightLeft } from "lucide-react"
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

interface Wallet {
  id: string
  name: string
  type: string
}

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wallets: Wallet[]
  onSuccess: () => void
}

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Salary",
  "Freelance",
  "Gift",
  "Other"
]

export function AddTransactionDialog({ open, onOpenChange, wallets, onSuccess }: AddTransactionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    description: "",
    category: "",
    walletId: "",
    fromWalletId: "",
    toWalletId: "",
    transferFee: "",
    date: new Date().toISOString().split("T")[0]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.type === "transfer") {
      if (!formData.fromWalletId || !formData.toWalletId) {
        toast.error("Please select both source and destination wallets")
        return
      }
      if (formData.fromWalletId === formData.toWalletId) {
        toast.error("Source and destination wallets must be different")
        return
      }
    } else {
      if (!formData.walletId) {
        toast.error("Please select a wallet")
        return
      }
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error("Failed to create transaction")

      // Wait for the response to ensure the transaction is fully saved
      await res.json()

      toast.success(formData.type === "transfer" ? "Transfer completed" : "Transaction added")
      setFormData({
        type: "expense",
        amount: "",
        description: "",
        category: "",
        walletId: "",
        fromWalletId: "",
        toWalletId: "",
        transferFee: "",
        date: new Date().toISOString().split("T")[0]
      })
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error("Failed to add transaction")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {formData.type === "transfer" ? "Transfer Money" : "Add Transaction"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={formData.type === "expense" ? "default" : "outline"}
              className={formData.type === "expense"
                ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                : "border-neutral-700 text-neutral-400 hover:bg-neutral-800"}
              onClick={() => setFormData({ ...formData, type: "expense" })}
            >
              Expense
            </Button>
            <Button
              type="button"
              variant={formData.type === "income" ? "default" : "outline"}
              className={formData.type === "income"
                ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
                : "border-neutral-700 text-neutral-400 hover:bg-neutral-800"}
              onClick={() => setFormData({ ...formData, type: "income" })}
            >
              Income
            </Button>
            <Button
              type="button"
              variant={formData.type === "transfer" ? "default" : "outline"}
              className={formData.type === "transfer"
                ? "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30"
                : "border-neutral-700 text-neutral-400 hover:bg-neutral-800"}
              onClick={() => setFormData({ ...formData, type: "transfer" })}
            >
              <ArrowRightLeft className="w-3 h-3 mr-1" />
              Transfer
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-neutral-300 text-sm">Amount</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="bg-neutral-800 border-neutral-700 text-white"
              required
            />
          </div>

          {formData.type === "transfer" ? (
            <>
              <div className="space-y-2">
                <Label className="text-neutral-300 text-sm">From Wallet</Label>
                <Select value={formData.fromWalletId} onValueChange={(v) => setFormData({ ...formData, fromWalletId: v })}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Select source wallet" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id} className="text-white focus:bg-neutral-700">
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-300 text-sm">To Wallet</Label>
                <Select value={formData.toWalletId} onValueChange={(v) => setFormData({ ...formData, toWalletId: v })}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Select destination wallet" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {wallets.filter(w => w.id !== formData.fromWalletId).map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id} className="text-white focus:bg-neutral-700">
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-300 text-sm">Transfer Fee (Optional)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.transferFee}
                  onChange={(e) => setFormData({ ...formData, transferFee: e.target.value })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
                <p className="text-xs text-neutral-500">Fee will be deducted from source wallet</p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-neutral-300 text-sm">Wallet</Label>
                <Select value={formData.walletId} onValueChange={(v) => setFormData({ ...formData, walletId: v })}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Select wallet" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id} className="text-white focus:bg-neutral-700">
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-300 text-sm">Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-white focus:bg-neutral-700">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label className="text-neutral-300 text-sm">Description</Label>
            <Input
              placeholder={formData.type === "transfer" ? "Transfer note..." : "What was this for?"}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-neutral-300 text-sm">Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          <Button type="submit" className="w-full bg-white text-black hover:bg-neutral-200" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              formData.type === "transfer" ? "Transfer Money" : "Add Transaction"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}