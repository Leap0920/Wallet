"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  ArrowUpRight,
  Eye,
  EyeOff,
  Settings,
  MoreVertical,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddTransactionDialog } from "@/components/dialogs/add-transaction-dialog"
import { AddWalletDialog } from "@/components/dialogs/add-wallet-dialog"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { ExpenseDonutChart } from "@/components/charts/expense-donut-chart"
import { BalanceTrendChart } from "@/components/charts/balance-trend-chart"
import { toast } from "sonner"
import { useCurrency } from "@/components/providers/currency-provider"
import { formatCurrency } from "@/lib/utils"

interface WalletData {
  id: string
  name: string
  type: string
  balance: number
  color: string
  icon: string
  currency: string
}

interface Transaction {
  id: string
  type: string
  amount: number
  description: string | null
  category: string | null
  date: Date
  transferFee?: number | null
  wallet: {
    id: string
    name: string
    color: string
    currency: string
  }
  fromWallet?: {
    id: string
    name: string
    currency?: string
  } | null
  toWallet?: {
    id: string
    name: string
    currency?: string
  } | null
}

interface DashboardData {
  totalBalance: number
  monthlyExpenses: number
  monthlyIncome: number
  lastMonthExpenses: number
  wallets: WalletData[]
  transactions: Transaction[]
  categoryData: Array<{ name: string; value: number; color: string }>
  balanceTrend: Array<{ date: string; balance: number }>
  displayCurrency: string
}

interface DashboardClientProps {
  data: DashboardData
}

// Category icons and colors mapping
const categoryConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  income: { icon: "💰", color: "#22c55e", bgColor: "bg-yellow-500" },
  transfer: { icon: "🔄", color: "#3b82f6", bgColor: "bg-blue-500" },
  food: { icon: "🍔", color: "#ef4444", bgColor: "bg-red-500" },
  "food & drinks": { icon: "🍔", color: "#ef4444", bgColor: "bg-red-500" },
  transport: { icon: "🚗", color: "#8b5cf6", bgColor: "bg-purple-500" },
  transportation: { icon: "🚗", color: "#8b5cf6", bgColor: "bg-purple-500" },
  shopping: { icon: "🛒", color: "#3b82f6", bgColor: "bg-blue-500" },
  entertainment: { icon: "🎬", color: "#22c55e", bgColor: "bg-green-500" },
  "life & entertainment": { icon: "🎬", color: "#22c55e", bgColor: "bg-green-500" },
  bills: { icon: "📄", color: "#f59e0b", bgColor: "bg-amber-500" },
  streaming: { icon: "📺", color: "#06b6d4", bgColor: "bg-cyan-500" },
  "tv, streaming": { icon: "📺", color: "#06b6d4", bgColor: "bg-cyan-500" },
  others: { icon: "📦", color: "#6b7280", bgColor: "bg-gray-500" },
}

const walletColors = [
  "bg-blue-500",
  "bg-cyan-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-green-500",
  "bg-amber-500",
]

export function DashboardClient({ data }: DashboardClientProps) {
  const router = useRouter()
  const { displayCurrency, convert } = useCurrency()
  const [activeTab, setActiveTab] = useState<"accounts" | "records">("accounts")
  const [showBalance, setShowBalance] = useState(true)
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [showAddWallet, setShowAddWallet] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "income" | "expense" | "transfer">("all")
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    type: 'transaction' | 'wallet' | null
    id: string | null
    name: string
  }>({
    open: false,
    type: null,
    id: null,
    name: ""
  })

  // Format currency with conversion to display currency
  const formatAmount = (amount: number, fromCurrency: string = displayCurrency) => {
    const converted = convert(Math.abs(amount), fromCurrency, displayCurrency)
    return formatCurrency(converted, displayCurrency)
  }

  // Format in wallet's native currency (no conversion)
  const formatNative = (amount: number, currency: string) => {
    return formatCurrency(Math.abs(amount), currency)
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  }

  // Use the pre-calculated total balance from page.tsx (already converted)
  const convertedTotalBalance = data.totalBalance

  const expenseChange = data.lastMonthExpenses > 0
    ? ((data.monthlyExpenses - data.lastMonthExpenses) / data.lastMonthExpenses * 100)
    : 0

  const balanceChange = data.balanceTrend.length > 1
    ? ((convertedTotalBalance - data.balanceTrend[0].balance) / Math.abs(data.balanceTrend[0].balance || 1) * 100)
    : 0

  const handleDeleteClick = (type: 'transaction' | 'wallet', id: string, name: string) => {
    setDeleteConfirm({ open: true, type, id, name })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id || !deleteConfirm.type) return

    setDeletingId(deleteConfirm.id)
    try {
      const url = deleteConfirm.type === 'transaction'
        ? `/api/transactions/${deleteConfirm.id}`
        : `/api/wallets/${deleteConfirm.id}`

      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Cache-Control": "no-cache" }
      })
      if (!res.ok) throw new Error()

      await res.json()
      toast.success(deleteConfirm.type === 'transaction' ? "Transaction deleted" : "Wallet deleted")
      router.refresh()
    } catch {
      toast.error(`Failed to delete ${deleteConfirm.type}`)
    } finally {
      setDeletingId(null)
      setDeleteConfirm({ open: false, type: null, id: null, name: "" })
    }
  }

  const filteredTransactions = data.transactions.filter(tx => {
    if (filter === "all") return true
    return tx.type === filter
  })

  // Group transactions by date
  const groupedTransactions = filteredTransactions.slice(0, 30).reduce((groups, tx) => {
    const date = formatDate(tx.date)
    if (!groups[date]) groups[date] = []
    groups[date].push(tx)
    return groups
  }, {} as Record<string, Transaction[]>)

  const getCategoryStyle = (category: string | null, type: string) => {
    if (type === "income") return categoryConfig.income
    if (type === "transfer") return categoryConfig.transfer
    const key = (category || "others").toLowerCase()
    return categoryConfig[key] || categoryConfig.others
  }

  // Multi-currency breakdown for the Balance Card
  const currencyBreakdown = data.wallets.reduce((acc, wallet) => {
    acc[wallet.currency] = (acc[wallet.currency] || 0) + wallet.balance
    return acc
  }, {} as Record<string, number>)
  const otherCurrencies = Object.entries(currencyBreakdown).filter(([curr]) => curr !== displayCurrency)

  return (
    <div className="space-y-4 pb-20">
      {/* Header - Matching original design */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Home</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowBalance(!showBalance)}
          className="text-neutral-400 hover:text-white"
        >
          {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </Button>
      </div>

      {/* Tabs - Underline style from original design */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "accounts" | "records")}>
        <TabsList className="bg-transparent border-b border-neutral-800 w-full justify-start rounded-none h-auto p-0 gap-8">
          <TabsTrigger
            value="accounts"
            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white text-neutral-500 rounded-none px-0 pb-3 font-medium transition-none"
          >
            Accounts
          </TabsTrigger>
          <TabsTrigger
            value="records"
            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white text-neutral-500 rounded-none px-0 pb-3 font-medium transition-none"
          >
            Records
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "accounts" ? (
        <div className="space-y-4">
          {/* List of accounts Card */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium text-white">List of accounts</CardTitle>
              <Button variant="ghost" size="icon" className="text-neutral-500">
                <Settings className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {data.wallets.map((wallet, index) => (
                  <div
                    key={wallet.id}
                    className={`${walletColors[index % walletColors.length]} rounded-xl p-4 relative group min-h-[100px] flex flex-col justify-between`}
                  >
                    <button
                      onClick={() => handleDeleteClick('wallet', wallet.id, wallet.name)}
                      disabled={deletingId === wallet.id}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/10 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white/70" />
                    </button>
                    <div>
                      <p className="text-white font-medium text-sm">{wallet.name}</p>
                    </div>
                    <div>
                      <p className="text-white text-lg font-semibold">
                        {showBalance ? formatNative(wallet.balance, wallet.currency) : "••••••"}
                      </p>
                      {wallet.currency !== displayCurrency && (
                        <p className="text-white/60 text-[10px] font-medium">
                          ≈ {formatAmount(wallet.balance, wallet.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setShowAddWallet(true)}
                  className="border-2 border-dashed border-neutral-800 rounded-xl p-4 flex items-center justify-center gap-2 text-neutral-500 hover:border-neutral-700 hover:text-neutral-400 transition-colors bg-transparent min-h-[100px]"
                >
                  <span className="text-sm">Add account</span>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Structure Card */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-base font-medium text-white">Expenses structure</CardTitle>
                <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider">LAST 30 DAYS</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider">vs past period</p>
                <p className={`text-sm font-medium mt-1 ${expenseChange >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(0)}%
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-white mb-6">
                {showBalance ? formatAmount(data.monthlyExpenses) : "••••••"}
              </p>
              {data.categoryData.length > 0 ? (
                <ExpenseDonutChart
                  data={data.categoryData}
                  total={data.monthlyExpenses}
                  showBalance={showBalance}
                  displayCurrency={displayCurrency}
                />
              ) : (
                <div className="text-center py-12 text-neutral-500 text-sm">
                  No expenses this month
                </div>
              )}
            </CardContent>
          </Card>

          {/* Balance Trend Card - This is where the Total Available Balance lives */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-base font-medium text-white">Balance Trend</CardTitle>
                <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider">TODAY</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider">vs past period</p>
                <p className={`text-sm font-medium mt-1 ${balanceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {balanceChange >= 0 ? '+' : ''}{balanceChange.toFixed(0)}%
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <h2 className="text-2xl font-semibold text-white">
                  {showBalance ? formatCurrency(convertedTotalBalance, displayCurrency) : "••••••"}
                </h2>

                {/* Multi-currency breakdown (Total Available Balance Stay feature) */}
                {otherCurrencies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {otherCurrencies.map(([curr, balance]) => (
                      <div key={curr} className="flex items-center gap-1.5 bg-neutral-800/50 px-2.5 py-1 rounded-full border border-neutral-800">
                        <span className="text-[10px] font-bold text-neutral-500">{curr}</span>
                        <span className="text-xs font-semibold text-white/90">
                          {showBalance ? formatCurrency(balance, curr) : "••••"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-48">
                <BalanceTrendChart data={data.balanceTrend} showBalance={showBalance} displayCurrency={displayCurrency} />
              </div>
            </CardContent>
          </Card>

          {/* Last records overview Card */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-medium text-white">Last records overview</CardTitle>
                <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider">LAST 30 DAYS</p>
              </div>
              <Button variant="ghost" size="icon" className="text-neutral-500">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {data.transactions.slice(0, 5).map((tx) => {
                const style = getCategoryStyle(tx.category, tx.type)
                return (
                  <div key={tx.id} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${style.bgColor}/20 text-white relative`}>
                      <span className="text-lg">{style.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white capitalize leading-none mb-1">
                        {tx.type === 'income'
                          ? 'Income'
                          : tx.type === 'transfer'
                            ? `Transfer to ${tx.toWallet?.name || 'Unknown'}`
                            : tx.category || 'Expense'}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-medium">
                        {tx.type === 'transfer'
                          ? `From ${tx.fromWallet?.name || 'Unknown'}`
                          : tx.wallet.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold tracking-tight ${tx.type === 'income' ? 'text-green-400' :
                          tx.type === 'transfer' ? 'text-blue-400' : 'text-red-400'
                        }`}>
                        {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '→' : '-'}{formatNative(tx.amount, tx.wallet.currency)}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-medium">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                )
              })}
              {data.transactions.length === 0 && (
                <div className="text-center py-8 text-neutral-600 text-sm">
                  No transactions yet
                </div>
              )}
              {data.transactions.length > 5 && (
                <Button
                  variant="ghost"
                  className="w-full text-blue-400 hover:text-blue-300 text-xs font-medium"
                  onClick={() => setActiveTab("records")}
                >
                  Show more
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              className={`rounded-lg px-4 h-8 text-xs font-medium ${filter === "all" ? "bg-white text-black" : "border-neutral-800 text-neutral-400"}`}
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "income" ? "default" : "outline"}
              size="sm"
              className={`rounded-lg px-4 h-8 text-xs font-medium ${filter === "income" ? "bg-neutral-800 text-white border-none" : "border-neutral-800 text-neutral-400"}`}
              onClick={() => setFilter("income")}
            >
              Income
            </Button>
            <Button
              variant={filter === "expense" ? "default" : "outline"}
              size="sm"
              className={`rounded-lg px-4 h-8 text-xs font-medium ${filter === "expense" ? "bg-neutral-800 text-white border-none" : "border-neutral-800 text-neutral-400"}`}
              onClick={() => setFilter("expense")}
            >
              Expenses
            </Button>
            <Button
              variant={filter === "transfer" ? "default" : "outline"}
              size="sm"
              className={`rounded-lg px-4 h-8 text-xs font-medium ${filter === "transfer" ? "bg-neutral-800 text-white border-none" : "border-neutral-800 text-neutral-400"}`}
              onClick={() => setFilter("transfer" as any)}
            >
              Transfers
            </Button>
          </div>

          {Object.keys(groupedTransactions).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedTransactions).map(([date, txs]) => (
                <div key={date} className="space-y-3">
                  <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest px-1">{date}</p>
                  <Card className="bg-neutral-900 border-neutral-800 overflow-hidden">
                    <CardContent className="p-0 divide-y divide-neutral-800/50">
                      {txs.map((tx) => {
                        const style = getCategoryStyle(tx.category, tx.type)
                        return (
                          <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.01] transition-colors">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${style.bgColor}/10 text-white`}>
                              <span className="text-xl">{style.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white capitalize leading-none mb-1">
                                {tx.type === 'income'
                                  ? 'Income'
                                  : tx.type === 'transfer'
                                    ? `Transfer to ${tx.toWallet?.name || 'Unknown'}`
                                    : tx.category || 'Expense'}
                              </p>
                              <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                                {tx.type === 'transfer'
                                  ? `From ${tx.fromWallet?.name || 'Unknown'}`
                                  : tx.wallet.name}
                              </p>
                              {tx.description && (
                                <p className="text-[10px] text-neutral-600 mt-1 font-medium italic">"{tx.description}"</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className={`text-sm font-semibold tracking-tight ${tx.type === 'income' ? 'text-green-400' :
                                    tx.type === 'transfer' ? 'text-blue-400' : 'text-red-400'
                                  }`}>
                                  {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '→' : '-'}{formatNative(tx.amount, tx.wallet.currency)}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-neutral-700 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                                onClick={() => handleDeleteClick('transaction', tx.id, tx.description || tx.category || 'Transaction')}
                                disabled={deletingId === tx.id}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 opacity-20">
              <ArrowUpRight className="w-12 h-12 text-neutral-400 mb-4" />
              <p className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">No records found</p>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button - Matching original design */}
      <Button
        onClick={() => setShowAddTransaction(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-xl z-50 text-white"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Dialogs */}
      <AddTransactionDialog
        open={showAddTransaction}
        onOpenChange={setShowAddTransaction}
        wallets={data.wallets}
        onSuccess={() => router.refresh()}
      />
      <AddWalletDialog
        open={showAddWallet}
        onOpenChange={setShowAddWallet}
        onSuccess={() => router.refresh()}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title={deleteConfirm.type === 'wallet' ? "Delete Wallet" : "Delete Transaction"}
        description={
          deleteConfirm.type === 'wallet'
            ? `Are you sure you want to delete "${deleteConfirm.name}"?`
            : `Are you sure you want to delete this record?`
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
