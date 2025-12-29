import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const body = await req.json()
        const { type, person, amount, interest, dueDate, description, status } = body

        const debt = await prisma.debt.update({
            where: {
                id: params.id,
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
    { params }: { params: { id: string } }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const debt = await prisma.debt.delete({
            where: {
                id: params.id,
                userId: session.user.id
            }
        })

        return NextResponse.json(debt)
    } catch (error) {
        console.error("[DEBT_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
