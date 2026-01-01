import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PrismaClient } from "@prisma/client"

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { id: debtId } = await params
        const body = await req.json()
        const { amount, date, note, walletId } = body

        if (!amount) {
            return new NextResponse("Missing amount", { status: 400 })
        }

        if (!walletId) {
            return new NextResponse("Missing wallet selection", { status: 400 })
        }

        const numericAmount = parseFloat(amount)

        const payment = await prisma.$transaction(async (tx: PrismaClient) => {
            // Check if debt exists and belongs to user
            const debt = await tx.debt.findUnique({
                where: {
                    id: debtId,
                    userId: session.user.id
                },
                include: {
                    payments: true
                }
            })

            if (!debt) {
                throw new Error("Debt not found")
            }

            const newPayment = await tx.debtPayment.create({
                data: {
                    amount: numericAmount,
                    date: date ? new Date(date) : new Date(),
                    note,
                    debtId,
                    walletId: walletId || null
                }
            })

            if (walletId) {
                // If LENT, receiving a payment means we get money back
                // If BORROWED, making a payment means we lose money
                const balanceChange = debt.type === "LENT" ? numericAmount : -numericAmount
                await tx.wallet.update({
                    where: { id: walletId },
                    data: { balance: { increment: balanceChange } }
                })
            }

            // Update debt status
            const totalPaid = debt.payments.reduce((acc: number, p: any) => acc + p.amount, 0) + numericAmount
            const totalToPay = debt.amount + (debt.interest || 0)

            let status = "PENDING"
            if (totalPaid >= totalToPay) {
                status = "PAID"
            } else if (totalPaid > 0) {
                status = "PARTIAL"
            }

            await tx.debt.update({
                where: { id: debtId },
                data: { status }
            })

            return newPayment
        })

        return NextResponse.json(payment)
    } catch (error) {
        console.error("[DEBT_PAYMENTS_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
