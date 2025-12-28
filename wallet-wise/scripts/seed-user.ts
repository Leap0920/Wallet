import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'demo@walletwise.com'
    const password = 'Password123!'
    const hashedPassword = await hash(password, 12)

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                name: 'Demo User',
                password: hashedPassword,
                wallets: {
                    create: [
                        { name: 'Cash', type: 'cash', balance: 5000, color: '#10b981', icon: 'wallet' },
                        { name: 'GCash', type: 'ewallet', balance: 2500, color: '#3b82f6', icon: 'smartphone' },
                        { name: 'Maya', type: 'ewallet', balance: 1500, color: '#000000', icon: 'credit-card' },
                    ]
                }
            },
        })
        console.log('User created:', user.email)
    } catch (e) {
        console.error('Error creating user:', e)
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
