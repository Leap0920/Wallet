import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-helper"
import prisma from "@/lib/prisma"

// DELETE wallet
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

    await prisma.wallet.delete({
      where: { id, userId: session.user.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete wallet" }, { status: 500 })
  }
}

// PUT update wallet
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
    const { name, type, balance, color, icon } = await request.json()

    const wallet = await prisma.wallet.update({
      where: { id, userId: session.user.id },
      data: { name, type, balance, color, icon }
    })

    return NextResponse.json(wallet)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update wallet" }, { status: 500 })
  }
}