import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const body = await req.json()
        const { amount, date, note } = body

        if (!amount) {
            return new NextResponse("Missing amount", { status: 400 })
        }

        const debtId = params.id

        // Check if debt exists and belongs to user
        const debt = await prisma.debt.findUnique({
            where: {
                id: debtId,
                userId: session.user.id
            },
            include: {
                payments: true
            }
        })

        if (!debt) {
            return new NextResponse("Debt not found", { status: 404 })
        }

        const payment = await prisma.debtPayment.create({
            data: {
                amount: parseFloat(amount),
                date: date ? new Date(date) : new Date(),
                note,
                debtId
            }
        })

        // Update debt status
        const totalPaid = debt.payments.reduce((acc, p) => acc + p.amount, 0) + parseFloat(amount)
        const totalToPay = debt.amount + (debt.interest || 0)

        let status = "PENDING"
        if (totalPaid >= totalToPay) {
            status = "PAID"
        } else if (totalPaid > 0) {
            status = "PARTIAL"
        }

        await prisma.debt.update({
            where: { id: debtId },
            data: { status }
        })

        return NextResponse.json(payment)
    } catch (error) {
        console.error("[DEBT_PAYMENTS_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
