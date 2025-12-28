"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowUpRight, ArrowDownLeft, Plus, Trash2, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddTransactionDialog } from "@/components/dialogs/add-transaction-dialog"
import { toast } from "sonner"

interface Transaction {
  id: string
  type: string
  amount: number
  description: string | null
  category: string | null
  date: Date
  wallet: {
    id: string
    name: string
  }
}

interface Wallet {
  id: string
  name: string
  type: string
}

interface TransactionsClientProps {
  transactions: Transaction[]
  wallets: Wallet[]
}

export function TransactionsClient({ transactions, wallets }: TransactionsClientProps) {
  const router = useRouter()
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date))
  }

  const filteredTransactions = transactions.filter(tx => {
    if (filter === "all") return true
    return tx.type === filter
  })

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return
    
    setDeletingId(id)
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Transaction deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete")
    } finally {
      setDeletingId(null)
    }
  }

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, tx) => {
    const date = formatDate(tx.date)
    if (!groups[date]) groups[date] = []
    groups[date].push(tx)
    return groups
  }, {} as Record<string, Transaction[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Transactions</h1>
          <p className="text-neutral-500 text-sm">{transactions.length} total transactions</p>
        </div>
        <Button 
          className="bg-white text-black hover:bg-neutral-200"
          onClick={() => setShowAddTransaction(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          className={filter === "all" ? "bg-white text-black" : "border-neutral-700 text-neutral-400"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "income" ? "default" : "outline"}
          size="sm"
          className={filter === "income" ? "bg-green-500/20 text-green-400 border-green-500/30" : "border-neutral-700 text-neutral-400"}
          onClick={() => setFilter("income")}
        >
          Income
        </Button>
        <Button
          variant={filter === "expense" ? "default" : "outline"}
          size="sm"
          className={filter === "expense" ? "bg-red-500/20 text-red-400 border-red-500/30" : "border-neutral-700 text-neutral-400"}
          onClick={() => setFilter("expense")}
        >
          Expenses
        </Button>
      </div>

      {/* Transactions List */}
      {Object.keys(groupedTransactions).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([date, txs]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-neutral-500 mb-3">{date}</h3>
              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="p-0 divide-y divide-neutral-800">
                  {txs.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-neutral-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          tx.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}>
                          {tx.type === 'income' 
                            ? <ArrowDownLeft className="w-5 h-5 text-green-500" />
                            : <ArrowUpRight className="w-5 h-5 text-red-500" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-white">{tx.description || tx.category || "Transaction"}</p>
                          <p className="text-sm text-neutral-500">{tx.wallet.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className={`font-medium ${
                          tx.type === 'income' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-neutral-500 hover:text-red-400"
                          onClick={() => handleDelete(tx.id)}
                          disabled={deletingId === tx.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ArrowUpRight className="w-12 h-12 text-neutral-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No transactions</h3>
            <p className="text-neutral-500 text-sm text-center mb-6">
              {wallets.length === 0 
                ? "Add a wallet first, then start tracking transactions."
                : "Start tracking your income and expenses."}
            </p>
            <Button 
              className="bg-white text-black hover:bg-neutral-200"
              onClick={() => setShowAddTransaction(true)}
              disabled={wallets.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Transaction Dialog */}
      <AddTransactionDialog
        open={showAddTransaction}
        onOpenChange={setShowAddTransaction}
        wallets={wallets}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}