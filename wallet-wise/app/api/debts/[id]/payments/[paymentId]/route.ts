import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PrismaClient } from "@prisma/client"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string, paymentId: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { id: debtId, paymentId } = await params
        const body = await req.json()
        const { amount, note, walletId } = body

        if (!amount || !walletId) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        const numericAmount = parseFloat(amount)

        const updatedPayment = await prisma.$transaction(async (tx: PrismaClient) => {
            // Find existing payment and debt
            const oldPayment = await tx.debtPayment.findUnique({
                where: { id: paymentId },
                include: { debt: true }
            })

            if (!oldPayment || oldPayment.debt.userId !== session.user.id) {
                throw new Error("Payment not found")
            }

            // 1. Reverse old wallet effect
            if (oldPayment.walletId) {
                const oldBalanceChange = oldPayment.debt.type === "LENT" ? -oldPayment.amount : oldPayment.amount
                await tx.wallet.update({
                    where: { id: oldPayment.walletId },
                    data: { balance: { increment: oldBalanceChange } }
                })
            }

            // 2. Apply new wallet effect
            const newBalanceChange = oldPayment.debt.type === "LENT" ? numericAmount : -numericAmount
            await tx.wallet.update({
                where: { id: walletId },
                data: { balance: { increment: newBalanceChange } }
            })

            // 3. Update payment
            const payment = await tx.debtPayment.update({
                where: { id: paymentId },
                data: {
                    amount: numericAmount,
                    note,
                    walletId
                }
            })

            // 4. Recalculate debt status
            const allPayments = await tx.debtPayment.findMany({
                where: { debtId }
            })
            const totalPaid = allPayments.reduce((acc: number, p: { amount: number }) => acc + p.amount, 0)
            const totalToPay = oldPayment.debt.amount + (oldPayment.debt.interest || 0)

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

            return payment
        })

        return NextResponse.json(updatedPayment)
    } catch (error) {
        console.error("[DEBT_PAYMENT_PATCH]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string, paymentId: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { id: debtId, paymentId } = await params

        await prisma.$transaction(async (tx: PrismaClient) => {
            const payment = await tx.debtPayment.findUnique({
                where: { id: paymentId },
                include: { debt: true }
            })

            if (!payment || payment.debt.userId !== session.user.id) {
                throw new Error("Payment not found")
            }

            // 1. Reverse wallet effect
            if (payment.walletId) {
                const balanceChange = payment.debt.type === "LENT" ? -payment.amount : payment.amount
                await tx.wallet.update({
                    where: { id: payment.walletId },
                    data: { balance: { increment: balanceChange } }
                })
            }

            // 2. Delete payment
            await tx.debtPayment.delete({
                where: { id: paymentId }
            })

            // 3. Recalculate debt status
            const allPayments = await tx.debtPayment.findMany({
                where: { debtId }
            })
            const totalPaid = allPayments.reduce((acc: number, p: { amount: number }) => acc + p.amount, 0)
            const totalToPay = payment.debt.amount + (payment.debt.interest || 0)

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
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[DEBT_PAYMENT_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
