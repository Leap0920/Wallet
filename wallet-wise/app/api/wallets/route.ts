import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-helper"
import prisma from "@/lib/prisma"

// GET all wallets
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const wallets = await prisma.wallet.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(wallets)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch wallets" }, { status: 500 })
  }
}

// POST create wallet
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, type, balance, color, icon } = await request.json()

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    const wallet = await prisma.wallet.create({
      data: {
        name,
        type,
        balance: balance || 0,
        color: color || "#737373",
        icon: icon || "wallet",
        userId: session.user.id
      }
    })

    return NextResponse.json(wallet)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create wallet" }, { status: 500 })
  }
}