import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { DashboardClient } from "./dashboard-client"
import type { Wallet, Transaction, Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Fetch all data in parallel
  const [wallets, transactions, lastMonthExpenses, categoryAggregation] = await Promise.all([
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
    prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        type: "expense",
        date: { gte: startOfLastMonth, lte: endOfLastMonth }
      },
      _sum: { amount: true }
    }),
    prisma.transaction.groupBy({
      by: ['category'],
      where: {
        userId: session.user.id,
        type: "expense",
        date: { gte: thirtyDaysAgo }
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } }
    })
  ])

  // Calculate totals
  const totalBalance = wallets.reduce((sum: number, w: Wallet) => sum + Number(w.balance ?? 0), 0)

  // Monthly expenses (current month)
  const monthlyExpenses = transactions
    .filter((tx: Transaction) => tx.type === "expense" && new Date(tx.date).getTime() >= startOfMonth.getTime())
    .reduce((sum: number, tx: Transaction) => sum + Number(tx.amount ?? 0), 0)

  // Monthly income (current month)
  const monthlyIncome = transactions
    .filter((tx: Transaction) => tx.type === "income" && new Date(tx.date).getTime() >= startOfMonth.getTime())
    .reduce((sum: number, tx: Transaction) => sum + Number(tx.amount ?? 0), 0)

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

  const categoryData = categoryAggregation.map((cat: { category: string | null; _sum: { amount: number | Prisma.Decimal | null } }) => ({
    name: cat.category || 'Others',
    value: Number(cat._sum.amount ?? 0),
    color: categoryColors[(cat.category || 'others').toLowerCase()] || '#6b7280'
  }))

  // Balance trend (last 30 days) - simplified calculation
  const balanceTrend: Array<{ date: string; balance: number }> = []

  // Get transactions sorted by date descending
  const sortedTx = [...transactions].sort((a: Transaction, b: Transaction) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Create daily snapshots going backwards
  for (let i = 0; i <= 30; i += 5) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })

    // Calculate balance at this point by subtracting future transactions
    let balanceAtDate = totalBalance
    for (const tx of sortedTx) {
      if (new Date(tx.date).getTime() > date.getTime()) {
        if (tx.type === 'income') {
          balanceAtDate -= Number(tx.amount ?? 0)
        } else if (tx.type === 'expense') {
          balanceAtDate += Number(tx.amount ?? 0)
        }
      }
    }

    balanceTrend.unshift({ date: dateStr, balance: balanceAtDate })
  }

  const dashboardData = {
    totalBalance,
    monthlyExpenses,
    monthlyIncome,
    lastMonthExpenses: Number(lastMonthExpenses._sum.amount ?? 0),
    wallets,
    transactions,
    categoryData,
    balanceTrend
  }

  return <DashboardClient data={dashboardData} />
}
