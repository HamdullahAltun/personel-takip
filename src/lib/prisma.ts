import { PrismaClient } from '@prisma/client'

// Prisma client initialization with types refreshed


const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Force overwrite to clear cache after schema change
export const db = new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

export const prisma = db;
