// Import PrismaClient using a runtime require to avoid bundler (Turbopack) resolving
// native paths at build time which can cause runtime errors like
// "The \"paths[1]\" argument must be of type string. Received undefined".
let PrismaClientClass: any
try {
  // Prefer normal require when available (Node server runtime).
  // Use eval to prevent bundlers from statically analyzing the require.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const _require = typeof require !== "undefined" ? require : (eval("require") as any)
  PrismaClientClass = _require("@prisma/client").PrismaClient
} catch (e) {
  // If require/import fails, rethrow with helpful message.
  throw new Error("Failed to load @prisma/client. Ensure it is installed and available at runtime.")
}

const globalForPrisma = global as unknown as { prisma?: InstanceType<any> }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClientClass({
    log: ["query"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
