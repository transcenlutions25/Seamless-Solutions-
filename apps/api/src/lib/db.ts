import { PrismaClient } from '@prisma/client';
import { ENV } from '@seamless/config';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ENV.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (ENV.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
