import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DebtClient } from "@/app/dashboard/debts/debt-client"

export const metadata = {
    title: "Debts - WalletWise",
    description: "Track your lent and borrowed money.",
}

export default async function DebtPage() {
    const session = await auth()

    const [debts, wallets] = await Promise.all([
        prisma.debt.findMany({
            where: {
                userId: session?.user?.id
            },
            include: {
                payments: true,
                wallet: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.wallet.findMany({
            where: {
                userId: session?.user?.id
            }
        })
    ])

    // Format debts for the client component
    const formattedDebts = debts.map((debt: any) => ({
        ...debt,
        createdAt: debt.createdAt.toISOString(),
        updatedAt: debt.updatedAt.toISOString(),
        dueDate: debt.dueDate?.toISOString() || null,
        payments: debt.payments.map((p: any) => ({
            ...p,
            date: p.date.toISOString(),
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
        }))
    }))

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Debt Tracker</h1>
                <p className="text-neutral-400">Track your pinautang and utang in one place.</p>
            </div>

            <DebtClient initialDebts={formattedDebts as any} wallets={wallets as any} />
        </div>
    )
}
