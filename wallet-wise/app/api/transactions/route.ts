import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET all transactions
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const type = searchParams.get("type")

    const where: any = { userId: session.user.id }
    if (type) where.type = type

    const transactions = await prisma.transaction.findMany({
      where,
      include: { wallet: true },
      orderBy: { date: "desc" },
      take: limit
    })

    return NextResponse.json(transactions)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}

// POST create transaction
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      amount,
      description,
      category,
      walletId,
      fromWalletId,
      toWalletId,
      transferFee,
      date,
      isUndo,
      originalId
    } = body

    if (!type || !amount) {
      return NextResponse.json({ error: "Type and amount are required" }, { status: 400 })
    }

    const parsedAmount = parseFloat(amount)
    const parsedTransferFee = transferFee ? parseFloat(transferFee) : 0

    // Handle undo operations
    if (isUndo && originalId) {
      // For undo, we recreate the transaction with a new ID but restore the data
      const transactionData = {
        type,
        amount: parsedAmount,
        description,
        category,
        date: date ? new Date(date) : new Date(),
        userId: session.user.id,
        ...(type === "transfer" ? {
          walletId: fromWalletId,
          fromWalletId,
          toWalletId,
          transferFee: parsedTransferFee > 0 ? parsedTransferFee : null
        } : {
          walletId
        })
      }

      const transaction = await prisma.transaction.create({
        data: transactionData,
        include: {
          wallet: true,
          fromWallet: true,
          toWallet: true
        }
      })

      // Restore wallet balances (Reverse the original transaction)
      if (type === "transfer") {
        await Promise.all([
          prisma.wallet.update({
            where: { id: fromWalletId },
            data: { balance: { increment: parsedAmount + parsedTransferFee } }
          }),
          prisma.wallet.update({
            where: { id: toWalletId },
            data: { balance: { decrement: parsedAmount } }
          })
        ])
      } else {
        // If we are "undoing" an income, we subtract it. If undoing an expense, we add it back.
        if (type.toLowerCase() === "income") {
          await prisma.wallet.update({
            where: { id: walletId },
            data: { balance: { decrement: parsedAmount } }
          })
        } else {
          await prisma.wallet.update({
            where: { id: walletId },
            data: { balance: { increment: parsedAmount } }
          })
        }
      }

      revalidatePath("/dashboard")
      return NextResponse.json(transaction)
    }

    // Regular transaction creation logic (existing code)
    if (type === "transfer") {
      if (!fromWalletId || !toWalletId) {
        return NextResponse.json({ error: "Both source and destination wallets are required for transfers" }, { status: 400 })
      }

      if (fromWalletId === toWalletId) {
        return NextResponse.json({ error: "Source and destination wallets must be different" }, { status: 400 })
      }

      // Verify both wallets belong to the user
      const wallets = await prisma.wallet.findMany({
        where: {
          id: { in: [fromWalletId, toWalletId] },
          userId: session.user.id
        }
      })

      if (wallets.length !== 2) {
        return NextResponse.json({ error: "Invalid wallet selection" }, { status: 400 })
      }

      // Check if source wallet has sufficient balance
      const sourceWallet = wallets.find((w: any) => w.id === fromWalletId)
      const destWallet = wallets.find((w: any) => w.id === toWalletId)

      if (sourceWallet && sourceWallet.balance < (parsedAmount + parsedTransferFee)) {
        return NextResponse.json({ error: "Insufficient balance in source wallet" }, { status: 400 })
      }

      // Create transfer transaction
      const transaction = await prisma.transaction.create({
        data: {
          type: "transfer",
          amount: parsedAmount,
          description: description || `Transfer from ${sourceWallet?.name || "Unknown"} to ${destWallet?.name || "Unknown"}`,
          category: "Transfer",
          walletId: fromWalletId,
          fromWalletId,
          toWalletId,
          transferFee: parsedTransferFee > 0 ? parsedTransferFee : null,
          date: date ? new Date(date) : new Date(),
          userId: session.user.id
        },
        include: {
          wallet: true,
          fromWallet: true,
          toWallet: true
        }
      })

      // Update wallet balances
      await Promise.all([
        // Deduct amount + fee from source wallet
        prisma.wallet.update({
          where: { id: fromWalletId },
          data: { balance: { decrement: parsedAmount + parsedTransferFee } }
        }),
        // Add amount to destination wallet
        prisma.wallet.update({
          where: { id: toWalletId },
          data: { balance: { increment: parsedAmount } }
        })
      ])

      revalidatePath("/dashboard")
      return NextResponse.json(transaction)
    } else {
      // Regular income/expense transaction
      if (!walletId) {
        return NextResponse.json({ error: "Wallet is required" }, { status: 400 })
      }

      // Verify wallet belongs to user
      const wallet = await prisma.wallet.findFirst({
        where: { id: walletId, userId: session.user.id }
      })

      if (!wallet) {
        return NextResponse.json({ error: "Invalid wallet" }, { status: 400 })
      }

      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          type,
          amount: parsedAmount,
          description,
          category,
          walletId,
          date: date ? new Date(date) : new Date(),
          userId: session.user.id
        },
        include: { wallet: true }
      })

      // Update wallet balance efficiently
      if (type.toLowerCase() === "income") {
        await prisma.wallet.update({
          where: { id: walletId },
          data: { balance: { increment: parsedAmount } }
        })
      } else {
        await prisma.wallet.update({
          where: { id: walletId },
          data: { balance: { decrement: parsedAmount } }
        })
      }

      revalidatePath("/dashboard")
      return NextResponse.json(transaction)
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
  }
}