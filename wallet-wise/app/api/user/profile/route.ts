import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PATCH(request: NextRequest) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { name } = await request.json()

        if (!name || name.trim().length === 0) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { name: name.trim() },
            select: { id: true, name: true, email: true }
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error("Profile update error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}