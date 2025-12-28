import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { compare, hash } from "bcryptjs"

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { currentPassword, newPassword } = await request.json()

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: "Current password and new password are required" },
                { status: 400 }
            )
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: "New password must be at least 6 characters long" },
                { status: 400 }
            )
        }

        // Get user with current password
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { password: true }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Verify current password
        const isCurrentPasswordValid = await compare(currentPassword, user.password)
        
        if (!isCurrentPasswordValid) {
            return NextResponse.json(
                { error: "Current password is incorrect" },
                { status: 400 }
            )
        }

        // Hash new password
        const hashedNewPassword = await hash(newPassword, 12)

        // Update password
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedNewPassword }
        })

        return NextResponse.json({ message: "Password updated successfully" })
    } catch (error) {
        console.error("Password change error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}