import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { CURRENCIES } from "@/lib/utils"

const VALID_CURRENCIES = CURRENCIES.map(c => c.code)

export async function PATCH(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { displayCurrency, categories } = await request.json()

        // Validate currency
        if (displayCurrency && !VALID_CURRENCIES.includes(displayCurrency)) {
            return NextResponse.json(
                { error: "Invalid currency code" },
                { status: 400 }
            )
        }

        // Update user's preferences
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                ...(displayCurrency && { displayCurrency }),
                ...(categories && { categories })
            },
            select: { displayCurrency: true, categories: true }
        })

        return NextResponse.json({
            message: "Preferences saved successfully",
            displayCurrency: updatedUser.displayCurrency,
            categories: updatedUser.categories
        })
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

        // Fetch user's preferences from database
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { displayCurrency: true, categories: true }
        })

        const preferences = {
            emailNotifications: true,
            pushNotifications: false,
            weeklyReports: true,
            monthlyReports: true,
            darkMode: true,
            displayCurrency: user?.displayCurrency || "PHP",
            categories: user?.categories || []
        }

        return NextResponse.json(preferences)
    } catch (error) {
        console.error("Preferences fetch error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
