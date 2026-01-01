"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Plus,
    Trash2,
    Check,
    HandCoins,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    User as UserIcon,
    MoreVertical,
    CircleDollarSign,
    TrendingDown,
    TrendingUp,
    History,
    Info,
    Search,
    Filter,
    X,
    ArrowUpDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils"
import { AddDebtDialog } from "@/components/dialogs/add-debt-dialog"
import { AddPaymentDialog } from "@/components/dialogs/add-payment-dialog"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { toast } from "sonner"
import { useCurrency } from "@/components/providers/currency-provider"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Payment {
    id: string
    amount: number
    date: string
    note: string | null
}

interface Debt {
    id: string
    type: string
    person: string
    amount: number
    interest: number | null
    dueDate: string | null
    description: string | null
    status: string
    payments: Payment[]
    walletId: string | null
    wallet: {
        id: string
        name: string
        currency: string
    } | null
    createdAt: string
    updatedAt: string
}

interface DebtClientProps {
    initialDebts: Debt[]
    wallets: {
        id: string
        name: string
        currency: string
    }[]
}

export function DebtClient({ initialDebts, wallets }: DebtClientProps) {
    const router = useRouter()
    const { displayCurrency } = useCurrency()
    const [showAddDebt, setShowAddDebt] = useState(false)
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
    const [payingDebt, setPayingDebt] = useState<{
        id: string
        person: string
        type: string
        amount: number
        interest: number | null
        remaining: number
        walletId: string | null
    } | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null; person: string }>({
        open: false,
        id: null,
        person: ""
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST">("NEWEST")

    const lentDebts = initialDebts.filter(d => d.type === "LENT")
    const borrowedDebts = initialDebts.filter(d => d.type === "BORROWED")

    const filterDebts = (debts: Debt[]) => {
        return debts
            .filter(d => {
                const matchesSearch = d.person.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (d.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
                const matchesStatus = statusFilter === "ALL" || d.status === statusFilter
                return matchesSearch && matchesStatus
            })
            .sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime()
                const dateB = new Date(b.createdAt).getTime()
                return sortBy === "NEWEST" ? dateB - dateA : dateA - dateB
            })
    }

    const filteredLentDebts = filterDebts(lentDebts)
    const filteredBorrowedDebts = filterDebts(borrowedDebts)

    const calculateTotals = (debts: Debt[]) => {
        let totalPrincipal = 0
        let totalInterest = 0
        let totalPaid = 0

        debts.forEach((d: Debt) => {
            totalPrincipal += d.amount
            totalInterest += d.interest || 0
            totalPaid += d.payments.reduce((acc: number, p: Payment) => acc + p.amount, 0)
        })

        return { totalPrincipal, totalInterest, totalPaid, totalRemaining: (totalPrincipal + totalInterest) - totalPaid }
    }

    const lentTotals = calculateTotals(lentDebts)
    const borrowedTotals = calculateTotals(borrowedDebts)

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm.id) return
        try {
            const res = await fetch(`/api/debts/${deleteConfirm.id}`, { method: "DELETE" })
            if (!res.ok) throw new Error()
            toast.success("Debt deleted")
            router.refresh()
        } catch {
            toast.error("Failed to delete")
        } finally {
            setDeleteConfirm({ open: false, id: null, person: "" })
        }
    }

    const DebtList = ({ debts, type }: { debts: Debt[], type: "LENT" | "BORROWED" }) => (
        <div className="space-y-4">
            {debts.length === 0 ? (
                <Card className="bg-neutral-900 border-neutral-800 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <HandCoins className="w-12 h-12 text-neutral-700 mb-4" />
                        <p className="text-neutral-500">No {type === "LENT" ? "pinautang" : "utang"} records found.</p>
                    </CardContent>
                </Card>
            ) : (
                debts.map((debt: Debt) => {
                    const totalToPay = debt.amount + (debt.interest || 0)
                    const paid = debt.payments.reduce((acc: number, p: Payment) => acc + p.amount, 0)
                    const remaining = totalToPay - paid
                    const progress = (paid / totalToPay) * 100

                    return (
                        <Card key={debt.id} className="bg-neutral-900 border-neutral-800 overflow-hidden group">
                            <CardContent className="p-0">
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center",
                                                type === "LENT" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                            )}>
                                                {type === "LENT" ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white text-lg">{debt.person}</h3>
                                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString() : "No due date"}
                                                    </span>
                                                    {debt.wallet && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <CircleDollarSign className="w-3 h-3" />
                                                                {debt.wallet.name}
                                                            </span>
                                                        </>
                                                    )}
                                                    {debt.description && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{debt.description}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={cn(
                                                debt.status === "PAID" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                    debt.status === "PARTIAL" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                                        "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                            )}>
                                                {debt.status}
                                            </Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-white">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 text-white">
                                                    <DropdownMenuItem onClick={() => setEditingDebt(debt)} className="focus:bg-neutral-800 cursor-pointer">
                                                        Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteConfirm({ open: true, id: debt.id, person: debt.person })}
                                                        className="text-red-400 focus:bg-neutral-800 cursor-pointer"
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Principal</p>
                                            <p className="text-sm font-medium text-white">{formatCurrency(debt.amount, displayCurrency)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Interest</p>
                                            <p className="text-sm font-medium text-white">{formatCurrency(debt.interest || 0, displayCurrency)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Total</p>
                                            <p className="text-sm font-medium text-white">{formatCurrency(totalToPay, displayCurrency)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Remaining</p>
                                            <p className="text-sm font-bold text-white">{formatCurrency(remaining, displayCurrency)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-neutral-500">Repayment Progress</span>
                                            <span className="text-white font-medium">{Math.round(progress)}%</span>
                                        </div>
                                        <div className="w-full bg-neutral-800 rounded-full h-1.5">
                                            <div
                                                className={cn(
                                                    "h-1.5 rounded-full transition-all",
                                                    type === "LENT" ? "bg-green-500" : "bg-red-500"
                                                )}
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 py-3 bg-neutral-800/30 border-t border-neutral-800 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {debt.payments.length > 0 && (
                                            <div className="flex -space-x-2">
                                                {debt.payments.slice(0, 3).map((_, i) => (
                                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-neutral-900 bg-neutral-700 flex items-center justify-center">
                                                        <History className="w-3 h-3 text-neutral-400" />
                                                    </div>
                                                ))}
                                                {debt.payments.length > 3 && (
                                                    <div className="w-6 h-6 rounded-full border-2 border-neutral-900 bg-neutral-700 flex items-center justify-center text-[10px] text-white">
                                                        +{debt.payments.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <span className="text-xs text-neutral-500">
                                            {debt.payments.length} payment{debt.payments.length !== 1 ? 's' : ''} recorded
                                        </span>
                                    </div>
                                    {debt.status !== "PAID" && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs border-neutral-700 hover:bg-neutral-800 text-white"
                                            onClick={() => setPayingDebt({
                                                id: debt.id,
                                                person: debt.person,
                                                type: debt.type,
                                                amount: debt.amount,
                                                interest: debt.interest,
                                                remaining: remaining,
                                                walletId: debt.walletId
                                            })}
                                        >
                                            Record Payment
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })
            )}
        </div>
    )

    return (
        <div className="space-y-6">
            <Tabs defaultValue="lent" className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <TabsList className="bg-neutral-900 border border-neutral-800 p-1">
                        <TabsTrigger value="lent" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
                            Pinautang (Lent)
                        </TabsTrigger>
                        <TabsTrigger value="borrowed" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
                            Utang (Borrowed)
                        </TabsTrigger>
                    </TabsList>

                    <Button
                        onClick={() => setShowAddDebt(true)}
                        className="bg-white text-black hover:bg-neutral-200"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Record
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Lent Summary */}
                    <Card className="bg-neutral-900 border-neutral-800">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Total Money Lent</p>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-2xl font-bold text-white">{formatCurrency(lentTotals.totalPrincipal + lentTotals.totalInterest, displayCurrency)}</h2>
                                        {lentTotals.totalInterest > 0 && (
                                            <span className="text-xs text-green-500">incl. interest</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
                                <div>
                                    <p className="text-xs text-neutral-500 mb-1">Total Collected</p>
                                    <p className="text-lg font-semibold text-white">{formatCurrency(lentTotals.totalPaid, displayCurrency)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 mb-1">To Collect</p>
                                    <p className="text-lg font-semibold text-blue-400">{formatCurrency(lentTotals.totalRemaining, displayCurrency)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Borrowed Summary */}
                    <Card className="bg-neutral-900 border-neutral-800">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                                    <TrendingDown className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Total Money Borrowed</p>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-2xl font-bold text-white">{formatCurrency(borrowedTotals.totalPrincipal + borrowedTotals.totalInterest, displayCurrency)}</h2>
                                        {borrowedTotals.totalInterest > 0 && (
                                            <span className="text-xs text-red-400">incl. interest</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
                                <div>
                                    <p className="text-xs text-neutral-500 mb-1">Total Paid</p>
                                    <p className="text-lg font-semibold text-white">{formatCurrency(borrowedTotals.totalPaid, displayCurrency)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 mb-1">To Pay</p>
                                    <p className="text-lg font-semibold text-orange-400">{formatCurrency(borrowedTotals.totalRemaining, displayCurrency)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <Input
                            placeholder="Search by name or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-neutral-900 border-neutral-800 text-white pl-10 focus:ring-1 focus:ring-neutral-700 h-10"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white h-10 w-full sm:w-40">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-3.5 h-3.5 text-neutral-500" />
                                    <SelectValue placeholder="Status" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="PARTIAL">Partial</SelectItem>
                                <SelectItem value="PAID">Paid</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                            <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white h-10 w-full sm:w-48">
                                <div className="flex items-center gap-2">
                                    <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
                                    <SelectValue placeholder="Sort by" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-white border-neutral-700">
                                <SelectItem value="NEWEST">Newest to Oldest</SelectItem>
                                <SelectItem value="OLDEST">Oldest to Newest</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <TabsContent value="lent">
                    <DebtList debts={filteredLentDebts} type="LENT" />
                </TabsContent>
                <TabsContent value="borrowed">
                    <DebtList debts={filteredBorrowedDebts} type="BORROWED" />
                </TabsContent>
            </Tabs>

            <AddDebtDialog
                open={showAddDebt || editingDebt !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowAddDebt(false)
                        setEditingDebt(null)
                    }
                }}
                onSuccess={() => router.refresh()}
                editDebt={editingDebt}
                wallets={wallets}
            />

            <AddPaymentDialog
                open={payingDebt !== null}
                onOpenChange={(open) => !open && setPayingDebt(null)}
                onSuccess={() => router.refresh()}
                debt={payingDebt}
                wallets={wallets}
            />

            <ConfirmDialog
                open={deleteConfirm.open}
                onOpenChange={(open) => !open && setDeleteConfirm({ ...deleteConfirm, open: false })}
                title="Delete Record"
                description={`Are you sure you want to delete the record for ${deleteConfirm.person}? This action cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
                onConfirm={handleDeleteConfirm}
            />
        </div>
    )
}
