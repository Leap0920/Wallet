import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { DashboardClient } from "./dashboard-client"
import type { Wallet, Transaction, Prisma } from "@prisma/client"
import { getExchangeRates } from "@/lib/currency"
import { convertCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch exchange rates
  const rates = await getExchangeRates()

  // Fetch user to get displayCurrency preference
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { displayCurrency: true }
  })

  const displayCurrency = user?.displayCurrency || "PHP"

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Fetch all data in parallel
  const [wallets, transactions, lastMonthExpensesRaw, categoryAggregation] = await Promise.all([
    prisma.wallet.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" }
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      include: {
        wallet: true,
        fromWallet: true,
        toWallet: true
      },
      orderBy: [
        { createdAt: "desc" }
      ],
      take: 100
    }),
    prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        type: "expense",
        date: { gte: startOfLastMonth, lte: endOfLastMonth }
      },
      include: { wallet: true }
    }),
    prisma.transaction.groupBy({
      by: ['category'],
      where: {
        userId: session.user.id,
        type: "expense",
        date: { gte: thirtyDaysAgo }
      },
      _sum: { amount: true },
      // Note: groupBy doesn't include wallet info, so we'll handle categories differently if needed
      // For now, we'll use the raw sum which might be slightly off if multiple currencies are used in one category
      // But let's fetch individual transactions for categories to be precise
    })
  ])

  // Precise category aggregation with currency conversion
  const thirtyDaysTxs = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      type: "expense",
      date: { gte: thirtyDaysAgo }
    },
    include: { wallet: true }
  })

  const categoryTotals: Record<string, number> = {}
  thirtyDaysTxs.forEach((tx: any) => {
    const category = tx.category || 'Others'
    const convertedAmount = convertCurrency(Number(tx.amount || 0), tx.wallet.currency, displayCurrency, rates)
    categoryTotals[category] = (categoryTotals[category] || 0) + convertedAmount
  })

  // Calculate totals with conversion
  const totalBalance = wallets.reduce((sum: number, w: Wallet) => {
    return sum + convertCurrency(Number(w.balance ?? 0), w.currency, displayCurrency, rates)
  }, 0)

  // Monthly expenses (current month)
  const monthlyExpenses = transactions
    .filter((tx) => tx.type === "expense" && new Date(tx.date).getTime() >= startOfMonth.getTime())
    .reduce((sum: number, tx: any) => {
      return sum + convertCurrency(Number(tx.amount ?? 0), tx.wallet.currency, displayCurrency, rates)
    }, 0)

  // Monthly income (current month)
  const monthlyIncome = transactions
    .filter((tx) => tx.type === "income" && new Date(tx.date).getTime() >= startOfMonth.getTime())
    .reduce((sum: number, tx: any) => {
      return sum + convertCurrency(Number(tx.amount ?? 0), tx.wallet.currency, displayCurrency, rates)
    }, 0)

  // Last month expenses with conversion
  const lastMonthExpenses = lastMonthExpensesRaw.reduce((sum: number, tx: any) => {
    return sum + convertCurrency(Number(tx.amount ?? 0), tx.wallet.currency, displayCurrency, rates)
  }, 0)

  // Category data with colors
  const categoryColors: Record<string, string> = {
    'food': '#ef4444',
    'food & drinks': '#ef4444',
    'transport': '#8b5cf6',
    'transportation': '#8b5cf6',
    'shopping': '#3b82f6',
    'entertainment': '#22c55e',
    'life & entertainment': '#22c55e',
    'bills': '#f59e0b',
    'streaming': '#06b6d4',
    'tv, streaming': '#06b6d4',
    'others': '#6b7280',
  }

  const categoryData = Object.entries(categoryTotals)
    .map(([name, value]) => ({
      name,
      value,
      color: categoryColors[name.toLowerCase()] || '#6b7280'
    }))
    .sort((a, b) => b.value - a.value)

  // Balance trend (last 30 days)
  const balanceTrend: Array<{ date: string; balance: number }> = []

  // Get transactions sorted by date descending for trend calculation
  const sortedTx = [...transactions].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Create daily snapshots going backwards
  for (let i = 0; i <= 30; i += 5) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })

    // Calculate balance at this point by subtracting future transactions
    let balanceAtDate = totalBalance
    for (const tx of sortedTx) {
      const transaction = tx as any
      if (new Date(transaction.date).getTime() > date.getTime()) {
        const convertedTxAmount = convertCurrency(Number(transaction.amount ?? 0), transaction.wallet.currency, displayCurrency, rates)
        if (transaction.type === 'income') {
          balanceAtDate -= convertedTxAmount
        } else if (transaction.type === 'expense') {
          balanceAtDate += convertedTxAmount
        }
      }
    }

    balanceTrend.unshift({ date: dateStr, balance: balanceAtDate })
  }

  const dashboardData = {
    totalBalance,
    monthlyExpenses,
    monthlyIncome,
    lastMonthExpenses,
    wallets,
    transactions,
    categoryData,
    balanceTrend,
    displayCurrency
  }

  return <DashboardClient data={dashboardData} />
}
