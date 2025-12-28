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

interface WalletData {
  id: string
  name: string
  type: string
  balance: number
  color: string
  icon: string
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
  }
  fromWallet?: {
    id: string
    name: string
  } | null
  toWallet?: {
    id: string
    name: string
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

  const formatCurrency = (amount: number) => {
    return `₱${Math.abs(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  }

  const expenseChange = data.lastMonthExpenses > 0 
    ? ((data.monthlyExpenses - data.lastMonthExpenses) / data.lastMonthExpenses * 100)
    : 0

  const balanceChange = data.balanceTrend.length > 1
    ? ((data.totalBalance - data.balanceTrend[0].balance) / Math.abs(data.balanceTrend[0].balance || 1) * 100)
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
      
      const res = await fetch(url, { method: "DELETE" })
      if (!res.ok) throw new Error()
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

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "accounts" | "records")}>
        <TabsList className="bg-transparent border-b border-neutral-800 w-full justify-start rounded-none h-auto p-0 gap-6">
          <TabsTrigger 
            value="accounts" 
            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white text-neutral-500 rounded-none px-0 pb-3"
          >
            Accounts
          </TabsTrigger>
          <TabsTrigger 
            value="records" 
            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white text-neutral-500 rounded-none px-0 pb-3"
          >
            Records
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "accounts" ? (
        <div className="space-y-4">
          {/* Wallets Grid - Now at the top */}
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
                    className={`${walletColors[index % walletColors.length]} rounded-xl p-4 relative group`}
                  >
                    <button
                      onClick={() => handleDeleteClick('wallet', wallet.id, wallet.name)}
                      disabled={deletingId === wallet.id}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/20 rounded"
                    >
                      <Trash2 className="w-3 h-3 text-white/70" />
                    </button>
                    <p className="text-white font-medium text-sm">{wallet.name}</p>
                    <p className="text-white text-lg font-semibold mt-1">
                      {showBalance ? formatCurrency(wallet.balance) : "••••••"}
                    </p>
                  </div>
                ))}
                <button 
                  onClick={() => setShowAddWallet(true)}
                  className="border-2 border-dashed border-neutral-700 rounded-xl p-4 flex items-center justify-center gap-2 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300 transition-colors"
                >
                  <span>Add account</span>
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
                <p className="text-xs text-neutral-500 mt-1">LAST 30 DAYS</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">vs past period</p>
                <p className={`text-sm font-medium ${expenseChange >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(0)}%
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-white mb-4">
                {showBalance ? formatCurrency(data.monthlyExpenses) : "••••••"}
              </p>
              {data.categoryData.length > 0 ? (
                <ExpenseDonutChart 
                  data={data.categoryData} 
                  total={data.monthlyExpenses}
                  showBalance={showBalance}
                />
              ) : (
                <div className="text-center py-8 text-neutral-500 text-sm">
                  No expenses this month
                </div>
              )}
            </CardContent>
          </Card>

          {/* Balance Trend Card */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-base font-medium text-white">Balance Trend</CardTitle>
                <p className="text-xs text-neutral-500 mt-1">TODAY</p>
                <p className="text-2xl font-semibold text-white mt-1">
                  {showBalance ? formatCurrency(data.totalBalance) : "••••••"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">vs past period</p>
                <p className={`text-sm font-medium ${balanceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {balanceChange >= 0 ? '+' : ''}{balanceChange.toFixed(0)}%
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <BalanceTrendChart data={data.balanceTrend} showBalance={showBalance} />
            </CardContent>
          </Card>

          {/* Last Records Overview */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-medium text-white">Last records overview</CardTitle>
                <p className="text-xs text-neutral-500 mt-1">LAST 30 DAYS</p>
              </div>
              <Button variant="ghost" size="icon" className="text-neutral-500">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.transactions.slice(0, 5).map((tx) => {
                const style = getCategoryStyle(tx.category, tx.type)
                return (
                  <div key={tx.id} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${style.bgColor} relative`}>
                      <span className="text-lg">{style.icon}</span>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500' : 'bg-green-500'}`}>
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white capitalize">
                        {tx.type === 'income' 
                          ? 'Income' 
                          : tx.type === 'transfer' 
                            ? `Transfer to ${tx.toWallet?.name || 'Unknown'}`
                            : tx.category || 'Expense'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {tx.type === 'transfer' 
                          ? `From ${tx.fromWallet?.name || 'Unknown'}`
                          : tx.wallet.name}
                      </p>
                      {tx.description && (
                        <p className="text-xs text-neutral-600 italic">"{tx.description}"</p>
                      )}
                      {tx.type === 'transfer' && tx.transferFee && tx.transferFee > 0 && (
                        <p className="text-xs text-neutral-600">Fee: {formatCurrency(tx.transferFee)}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        tx.type === 'income' 
                          ? 'text-green-400' 
                          : tx.type === 'transfer'
                            ? 'text-blue-400'
                            : 'text-red-400'
                      }`}>
                        {tx.type === 'income' 
                          ? '' 
                          : tx.type === 'transfer' 
                            ? '→' 
                            : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-neutral-500">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                )
              })}
              {data.transactions.length === 0 && (
                <div className="text-center py-4 text-neutral-500 text-sm">
                  No transactions yet
                </div>
              )}
              {data.transactions.length > 5 && (
                <Button 
                  variant="ghost" 
                  className="w-full text-blue-400 hover:text-blue-300 text-sm"
                  onClick={() => setActiveTab("records")}
                >
                  Show more
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
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
            <Button
              variant={filter === "transfer" ? "default" : "outline"}
              size="sm"
              className={filter === "transfer" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "border-neutral-700 text-neutral-400"}
              onClick={() => setFilter("transfer" as any)}
            >
              Transfers
            </Button>
          </div>

          {/* Transactions List */}
          {Object.keys(groupedTransactions).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedTransactions).map(([date, txs]) => (
                <div key={date}>
                  <p className="text-xs text-neutral-500 mb-2">{date}</p>
                  <Card className="bg-neutral-900 border-neutral-800">
                    <CardContent className="p-0 divide-y divide-neutral-800">
                      {txs.map((tx) => {
                        const style = getCategoryStyle(tx.category, tx.type)
                        return (
                          <div key={tx.id} className="flex items-center gap-3 p-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${style.bgColor} relative`}>
                              <span className="text-lg">{style.icon}</span>
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-green-500">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white capitalize">
                                {tx.type === 'income' 
                                  ? 'Income' 
                                  : tx.type === 'transfer' 
                                    ? `Transfer to ${tx.toWallet?.name || 'Unknown'}`
                                    : tx.category || 'Expense'}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {tx.type === 'transfer' 
                                  ? `From ${tx.fromWallet?.name || 'Unknown'}`
                                  : tx.wallet.name}
                              </p>
                              {tx.description && (
                                <p className="text-xs text-neutral-600 italic">"{tx.description}"</p>
                              )}
                              {tx.type === 'transfer' && tx.transferFee && tx.transferFee > 0 && (
                                <p className="text-xs text-neutral-600">Fee: {formatCurrency(tx.transferFee)}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className={`text-sm font-medium ${
                                  tx.type === 'income' 
                                    ? 'text-green-400' 
                                    : tx.type === 'transfer'
                                      ? 'text-blue-400'
                                      : 'text-red-400'
                                }`}>
                                  {tx.type === 'income' 
                                    ? '' 
                                    : tx.type === 'transfer' 
                                      ? '→' 
                                      : '-'}{formatCurrency(tx.amount)}
                                </p>
                                <p className="text-xs text-neutral-500">{formatDate(tx.date)}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-neutral-500 hover:text-red-400"
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
            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ArrowUpRight className="w-10 h-10 text-neutral-600 mb-3" />
                <p className="text-neutral-500 text-sm">No transactions yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <Button
        onClick={() => setShowAddTransaction(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg z-50"
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title={deleteConfirm.type === 'wallet' ? "Delete Wallet" : "Delete Transaction"}
        description={
          deleteConfirm.type === 'wallet'
            ? `Are you sure you want to delete "${deleteConfirm.name}"? All transactions in this wallet will also be deleted.`
            : `Are you sure you want to delete this ${deleteConfirm.name}?`
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
