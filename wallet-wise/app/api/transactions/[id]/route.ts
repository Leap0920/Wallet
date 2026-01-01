import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// DELETE transaction
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

    // Get transaction first to reverse the balance
    const transaction = await prisma.transaction.findUnique({
      where: { id, userId: session.user.id }
    })

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (transaction.type === "transfer") {
      // Reverse transfer: add amount + fee back to source, subtract amount from destination
      const transferFee = transaction.transferFee || 0

      await Promise.all([
        // Add amount + fee back to source wallet
        prisma.wallet.update({
          where: { id: transaction.fromWalletId! },
          data: { balance: { increment: transaction.amount + transferFee } }
        }),
        // Subtract amount from destination wallet
        prisma.wallet.update({
          where: { id: transaction.toWalletId! },
          data: { balance: { decrement: transaction.amount } }
        })
      ])
    } else {
      // Reverse regular transaction (DELETING an income should decrease balance, deleting an expense should increase it)
      if (transaction.type.toLowerCase() === "income") {
        await prisma.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { decrement: transaction.amount } }
        })
      } else {
        await prisma.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { increment: transaction.amount } }
        })
      }
    }

    // Delete transaction
    await prisma.transaction.delete({
      where: { id, userId: session.user.id }
    })

    revalidatePath("/dashboard")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 })
  }
}

// PATCH update transaction
export async function PATCH(
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
    const { type, amount: newAmountRaw, description, category, walletId: newWalletId, fromWalletId: newFromWalletId, toWalletId: newToWalletId, transferFee: newTransferFeeRaw, date } = body

    const newAmount = parseFloat(newAmountRaw)
    const newTransferFee = newTransferFeeRaw ? parseFloat(newTransferFeeRaw) : 0

    // Get old transaction to reverse its effect
    const oldTx = await prisma.transaction.findUnique({
      where: { id, userId: session.user.id }
    })

    if (!oldTx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // --- Step 1: Reverse Old Effect ---
    if (oldTx.type === "transfer") {
      const oldFee = oldTx.transferFee || 0
      await Promise.all([
        prisma.wallet.update({
          where: { id: oldTx.fromWalletId! },
          data: { balance: { increment: oldTx.amount + oldFee } }
        }),
        prisma.wallet.update({
          where: { id: oldTx.toWalletId! },
          data: { balance: { decrement: oldTx.amount } }
        })
      ])
    } else {
      // Reverse old regular transaction
      if (oldTx.type.toLowerCase() === "income") {
        await prisma.wallet.update({
          where: { id: oldTx.walletId },
          data: { balance: { decrement: oldTx.amount } }
        })
      } else {
        await prisma.wallet.update({
          where: { id: oldTx.walletId },
          data: { balance: { increment: oldTx.amount } }
        })
      }
    }

    // --- Step 2: Overdraft Check for new effect ---
    if (type === "transfer") {
      const fromWallet = await prisma.wallet.findUnique({ where: { id: newFromWalletId!, userId: session.user.id } })
      if (!fromWallet || fromWallet.balance < (newAmount + newTransferFee)) {
        return NextResponse.json({ error: "Insufficient balance in source wallet" }, { status: 400 })
      }
    } else if (type.toLowerCase() === "expense") {
      const wallet = await prisma.wallet.findUnique({ where: { id: newWalletId!, userId: session.user.id } })
      if (!wallet || wallet.balance < newAmount) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
      }
    }

    // --- Step 3: Update Transaction ---
    const updatedTx = await prisma.transaction.update({
      where: { id, userId: session.user.id },
      data: {
        type,
        amount: newAmount,
        description,
        category,
        date: date ? new Date(date) : undefined,
        walletId: type === "transfer" ? newFromWalletId : newWalletId,
        fromWalletId: type === "transfer" ? newFromWalletId : null,
        toWalletId: type === "transfer" ? newToWalletId : null,
        transferFee: type === "transfer" && newTransferFee > 0 ? newTransferFee : null,
      }
    })

    // --- Step 4: Apply New Effect ---
    if (type === "transfer") {
      await Promise.all([
        prisma.wallet.update({
          where: { id: newFromWalletId },
          data: { balance: { decrement: newAmount + newTransferFee } }
        }),
        prisma.wallet.update({
          where: { id: newToWalletId },
          data: { balance: { increment: newAmount } }
        })
      ])
    } else {
      // Apply new regular transaction
      if (type.toLowerCase() === "income") {
        await prisma.wallet.update({
          where: { id: newWalletId },
          data: { balance: { increment: newAmount } }
        })
      } else {
        await prisma.wallet.update({
          where: { id: newWalletId },
          data: { balance: { decrement: newAmount } }
        })
      }
    }

    revalidatePath("/dashboard")
    return NextResponse.json(updatedTx)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
  }
}