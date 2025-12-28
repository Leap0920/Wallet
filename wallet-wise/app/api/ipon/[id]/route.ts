import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// DELETE ipon goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await prisma.iponGoal.delete({
      where: { id, userId: session.user.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 })
  }
}

// PUT update ipon goal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Check if this is a denomination update (legacy) or full goal edit
    if (body.denominations && !body.name && !body.targetAmount) {
      // Legacy denomination update
      const { denominations } = body

      // Calculate current amount based on checked denominations
      let currentAmount = 0
      if (denominations) {
        for (const d of denominations) {
          currentAmount += d.denom * d.checked
        }
      }

      // Get the goal to check target
      const existingGoal = await prisma.iponGoal.findUnique({
        where: { id, userId: session.user.id }
      })

      if (!existingGoal) {
        return NextResponse.json({ error: "Goal not found" }, { status: 404 })
      }

      const isCompleted = currentAmount >= existingGoal.targetAmount

      const goal = await prisma.iponGoal.update({
        where: { id, userId: session.user.id },
        data: {
          denominations,
          currentAmount,
          isCompleted
        }
      })

      return NextResponse.json(goal)
    } else {
      // Full goal edit
      const { name, targetAmount, targetDate, denominations } = body

      if (!name || !targetAmount) {
        return NextResponse.json({ error: "Name and target amount are required" }, { status: 400 })
      }

      // Calculate current amount from existing checked denominations
      let currentAmount = 0
      if (denominations) {
        for (const d of denominations) {
          currentAmount += d.denom * d.checked
        }
      }

      const parsedTargetAmount = parseFloat(targetAmount)
      const isCompleted = currentAmount >= parsedTargetAmount

      const goal = await prisma.iponGoal.update({
        where: { id, userId: session.user.id },
        data: {
          name,
          targetAmount: parsedTargetAmount,
          targetDate: targetDate ? new Date(targetDate) : null,
          denominations,
          currentAmount,
          isCompleted
        }
      })

      return NextResponse.json(goal)
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 })
  }
}