import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function DELETE() {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // In a real application, you would:
        // 1. Delete all user-related data (transactions, wallets, etc.)
        // 2. Handle data retention policies
        // 3. Send confirmation emails
        // 4. Log the deletion for audit purposes

        // For demo purposes, we'll just delete the user
        await prisma.user.delete({
            where: { id: session.user.id }
        })

        return NextResponse.json({ message: "Account deleted successfully" })
    } catch (error) {
        console.error("Account deletion error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}