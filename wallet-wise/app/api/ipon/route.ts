import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-helper"
import prisma from "@/lib/prisma"

// Philippine peso denominations
const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 1]

// Calculate denomination breakdown for a target amount
function calculateDenominations(amount: number) {
  const result: { denom: number; required: number; checked: number }[] = []
  let remaining = amount

  for (const denom of DENOMINATIONS) {
    const count = Math.floor(remaining / denom)
    if (count > 0) {
      result.push({ denom, required: count, checked: 0 })
      remaining -= count * denom
    }
  }

  return result
}

// GET all ipon goals
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const goals = await prisma.iponGoal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(goals)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 })
  }
}

// POST create ipon goal
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, targetAmount, targetDate, denominations: customDenominations } = await request.json()

    if (!name || !targetAmount) {
      return NextResponse.json({ error: "Name and target amount are required" }, { status: 400 })
    }

    // Use custom denominations if provided, otherwise calculate default
    const denominations = customDenominations && customDenominations.length > 0
      ? customDenominations
      : calculateDenominations(parseFloat(targetAmount))

    const goal = await prisma.iponGoal.create({
      data: {
        name,
        targetAmount: parseFloat(targetAmount),
        targetDate: targetDate ? new Date(targetDate) : null,
        denominations,
        userId: session.user.id
      }
    })

    return NextResponse.json(goal)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 })
  }
}