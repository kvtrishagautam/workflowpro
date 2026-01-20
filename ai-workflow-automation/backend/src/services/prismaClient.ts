import { PrismaClient } from '@prisma/client';

// Create a singleton instance of Prisma Client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query', 'error', 'warn'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
