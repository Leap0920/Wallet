import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-helper"
import prisma from "@/lib/prisma"

export async function GET() {
    const session = await auth()

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const now = new Date()
        const currentYear = now.getFullYear()
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        const data = []

        for (let month = 0; month <= now.getMonth(); month++) {
            const startDate = new Date(currentYear, month, 1)
            const endDate = new Date(currentYear, month + 1, 0, 23, 59, 59, 999)

            const [expenses, income] = await Promise.all([
                prisma.transaction.aggregate({
                    where: {
                        userId: session.user.id,
                        type: 'expense',
                        date: { gte: startDate, lte: endDate }
                    },
                    _sum: { amount: true }
                }),
                prisma.transaction.aggregate({
                    where: {
                        userId: session.user.id,
                        type: 'income',
                        date: { gte: startDate, lte: endDate }
                    },
                    _sum: { amount: true }
                })
            ])

            data.push({
                name: months[month],
                expenses: expenses._sum?.amount || 0,
                income: income._sum?.amount || 0
            })
        }

        return NextResponse.json({ data })
    } catch (error) {
        console.error("Monthly analytics error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
