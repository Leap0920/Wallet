"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface AddWalletDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const WALLET_TYPES = [
  { value: "e-wallet", label: "E-Wallet" },
  { value: "bank", label: "Bank Account" },
  { value: "cash", label: "Cash" },
]

const WALLET_PRESETS = [
  { name: "GCash", type: "e-wallet", icon: "gcash" },
  { name: "Maya", type: "e-wallet", icon: "maya" },
  { name: "PayPal", type: "e-wallet", icon: "paypal" },
  { name: "Cash", type: "cash", icon: "cash" },
  { name: "BDO", type: "bank", icon: "bank" },
  { name: "BPI", type: "bank", icon: "bank" },
  { name: "Custom", type: "", icon: "wallet" },
]

export function AddWalletDialog({ open, onOpenChange, onSuccess }: AddWalletDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "e-wallet",
    balance: "",
    icon: "wallet"
  })

  const handlePresetSelect = (preset: typeof WALLET_PRESETS[0]) => {
    if (preset.name === "Custom") {
      setSelectedPreset("Custom")
      setFormData({ name: "", type: "e-wallet", balance: formData.balance, icon: "wallet" })
    } else {
      setSelectedPreset(preset.name)
      setFormData({ 
        name: preset.name, 
        type: preset.type, 
        balance: formData.balance,
        icon: preset.icon 
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          balance: parseFloat(formData.balance) || 0
        })
      })

      if (!res.ok) throw new Error("Failed to create wallet")

      toast.success("Wallet created")
      setFormData({ name: "", type: "e-wallet", balance: "", icon: "wallet" })
      setSelectedPreset(null)
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error("Failed to create wallet")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Add Wallet</DialogTitle>
        </DialogHeader>
        
        {/* Presets */}
        <div className="grid grid-cols-4 gap-2">
          {WALLET_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              type="button"
              variant="outline"
              className={`h-auto py-3 flex flex-col gap-1 ${
                selectedPreset === preset.name 
                  ? "border-white bg-neutral-800" 
                  : "border-neutral-700 hover:bg-neutral-800"
              }`}
              onClick={() => handlePresetSelect(preset)}
            >
              <span className="text-xs text-neutral-300">{preset.name}</span>
            </Button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-neutral-300 text-sm">Name</Label>
            <Input
              placeholder="Wallet name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-neutral-800 border-neutral-700 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-neutral-300 text-sm">Type</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                {WALLET_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-white focus:bg-neutral-700">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-neutral-300 text-sm">Initial Balance</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          <Button type="submit" className="w-full bg-white text-black hover:bg-neutral-200" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Wallet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}