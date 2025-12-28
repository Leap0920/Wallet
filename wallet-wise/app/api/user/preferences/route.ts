import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const preferences = await request.json()

        // In a real app, you might want to store preferences in a separate table
        // For now, we'll just return success since this is a demo
        console.log("User preferences updated:", preferences)

        return NextResponse.json({ message: "Preferences saved successfully" })
    } catch (error) {
        console.error("Preferences update error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Return default preferences for demo
        const defaultPreferences = {
            emailNotifications: true,
            pushNotifications: false,
            weeklyReports: true,
            monthlyReports: true,
            darkMode: true,
            currency: "PHP"
        }

        return NextResponse.json(defaultPreferences)
    } catch (error) {
        console.error("Preferences fetch error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}