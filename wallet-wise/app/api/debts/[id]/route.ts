import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PrismaClient } from "@prisma/client"

export async function PATCH(
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
        const { type, person, amount, interest, dueDate, description, status } = body

        const debt = await prisma.debt.update({
            where: {
                id: debtId,
                userId: session.user.id
            },
            data: {
                type,
                person,
                amount: amount ? parseFloat(amount) : undefined,
                interest: interest !== undefined ? (interest ? parseFloat(interest) : null) : undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                description,
                status
            }
        })

        return NextResponse.json(debt)
    } catch (error) {
        console.error("[DEBT_PATCH]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { id: debtId } = await params

        const debt = await prisma.$transaction(async (tx: PrismaClient) => {
            const existingDebt = await tx.debt.findUnique({
                where: { id: debtId, userId: session.user.id },
                include: { payments: true }
            })

            if (!existingDebt) throw new Error("Debt not found")

            // 1. Reverse the initial debt effect on wallet
            if (existingDebt.walletId) {
                // If it was LENT, we deducted from wallet. To reverse, we add back.
                // If it was BORROWED, we added to wallet. To reverse, we deduct.
                const reversal = existingDebt.type === "LENT" ? existingDebt.amount : -existingDebt.amount
                await tx.wallet.update({
                    where: { id: existingDebt.walletId },
                    data: { balance: { increment: reversal } }
                })
            }

            // 2. Reverse each payment's effect on its respective wallet
            for (const payment of existingDebt.payments) {
                if (payment.walletId) {
                    // If debt was LENT, payment was receiving money (added to wallet). Reverse = deduct.
                    // If debt was BORROWED, payment was giving money (deducted from wallet). Reverse = add back.
                    const paymentReversal = existingDebt.type === "LENT" ? -payment.amount : payment.amount
                    await tx.wallet.update({
                        where: { id: payment.walletId },
                        data: { balance: { increment: paymentReversal } }
                    })
                }
            }

            // 3. Delete the debt (payments will be deleted via cascade if set, but let's be safe)
            return await tx.debt.delete({
                where: { id: debtId }
            })
        })

        return NextResponse.json(debt)
    } catch (error) {
        console.error("[DEBT_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
