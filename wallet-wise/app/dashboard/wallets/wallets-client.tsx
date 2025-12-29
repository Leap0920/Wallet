"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Settings, Eye, EyeOff, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddWalletDialog } from "@/components/dialogs/add-wallet-dialog"
import { toast } from "sonner"
import { useCurrency } from "@/components/providers/currency-provider"

interface WalletData {
  id: string
  name: string
  type: string
  balance: number
  color: string
  icon: string
  currency: string
  createdAt: Date
  updatedAt: Date
}

interface WalletsClientProps {
  wallets: WalletData[]
}

// Predefined wallet colors
const walletColors: Record<string, string> = {
  "cash": "bg-blue-500",
  "gcash": "bg-cyan-500",
  "maya": "bg-green-500",
  "paypal": "bg-fuchsia-500",
  "bank": "bg-orange-500",
  "e-wallet": "bg-teal-500",
  "default": "bg-indigo-500"
}

function getWalletColor(wallet: WalletData): string {
  const nameLower = wallet.name.toLowerCase()
  if (nameLower.includes("cash") && !nameLower.includes("gcash")) return walletColors.cash
  if (nameLower.includes("gcash") || nameLower.includes("maribank")) return walletColors.gcash
  if (nameLower.includes("maya")) return walletColors.maya
  if (nameLower.includes("paypal")) return walletColors.paypal
  if (wallet.type === "bank") return walletColors.bank
  if (wallet.type === "e-wallet") return walletColors["e-wallet"]
  return walletColors.default
}

export function WalletsClient({ wallets }: WalletsClientProps) {
  const router = useRouter()
  const { formatAmount } = useCurrency()
  const [showBalances, setShowBalances] = useState(true)
  const [showAddWallet, setShowAddWallet] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Delete this wallet? All transactions will be deleted too.")) return
    
    setDeletingId(id)
    try {
      const res = await fetch(`/api/wallets/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Wallet deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete wallet")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">List of accounts</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowBalances(!showBalances)}
            className="text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl"
          >
            {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-400 hover:text-blue-300 hover:bg-neutral-800 rounded-xl"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-2 gap-3">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className={`${getWalletColor(wallet)} rounded-xl p-4 min-h-[100px] relative group cursor-pointer transition-transform hover:scale-[1.02]`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-white/70 hover:text-white hover:bg-white/20"
              onClick={(e) => handleDelete(wallet.id, e)}
              disabled={deletingId === wallet.id}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            <div className="flex items-center gap-1 mb-1">
              <p className="text-white/90 font-medium text-sm">{wallet.name}</p>
            </div>
            <p className="text-white font-bold text-lg">
              {showBalances ? formatAmount(wallet.balance, wallet.currency) : "••••••"}
            </p>
          </div>
        ))}

        {/* Add Account Card */}
        <div
          onClick={() => setShowAddWallet(true)}
          className="rounded-xl p-4 min-h-[100px] border-2 border-dashed border-neutral-700 flex flex-col items-start justify-center cursor-pointer hover:border-blue-500/50 hover:bg-neutral-800/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-medium">Add account</span>
            <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center">
              <Plus className="w-4 h-4 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {wallets.length === 0 && (
        <div className="text-center py-8">
          <p className="text-neutral-500 text-sm">No accounts yet. Add your first wallet to get started.</p>
        </div>
      )}

      {/* Add Wallet Dialog */}
      <AddWalletDialog
        open={showAddWallet}
        onOpenChange={setShowAddWallet}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
