import { PrismaClient } from '@prisma/client'

const createPrismaClient = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  })

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
