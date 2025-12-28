import { NextRequest, NextResponse } from "next/server"
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
      // Reverse regular transaction
      const balanceChange = transaction.type === "income" ? -transaction.amount : transaction.amount
      await prisma.wallet.update({
        where: { id: transaction.walletId },
        data: { balance: { increment: balanceChange } }
      })
    }

    // Delete transaction
    await prisma.transaction.delete({
      where: { id, userId: session.user.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 })
  }
}