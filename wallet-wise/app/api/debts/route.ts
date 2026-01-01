import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PrismaClient } from "@prisma/client"

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const debts = await prisma.debt.findMany({
            where: {
                userId: session.user.id
            },
            include: {
                payments: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(debts)
    } catch (error) {
        console.error("[DEBTS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const body = await req.json()
        const { type, person, amount, interest, dueDate, description, walletId } = body

        if (!type || !person || !amount) {
            return new NextResponse("Missing fields", { status: 400 })
        }

        const numericAmount = parseFloat(amount)

        const debt = await prisma.$transaction(async (tx: PrismaClient) => {
            const newDebt = await tx.debt.create({
                data: {
                    type,
                    person,
                    amount: numericAmount,
                    interest: interest ? parseFloat(interest) : null,
                    dueDate: dueDate ? new Date(dueDate) : null,
                    description,
                    userId: session.user.id,
                    status: "PENDING",
                    walletId: walletId || null
                }
            })

            if (walletId) {
                // If LENT, we lose money from wallet
                // If BORROWED, we gain money in wallet
                const balanceChange = type === "LENT" ? -numericAmount : numericAmount
                await tx.wallet.update({
                    where: { id: walletId },
                    data: { balance: { increment: balanceChange } }
                })
            }

            return newDebt
        })

        return NextResponse.json(debt)
    } catch (error) {
        console.error("[DEBTS_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
