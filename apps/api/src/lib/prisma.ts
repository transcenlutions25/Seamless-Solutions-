import { PrismaClient } from '@prisma/client';
import { config } from '../config';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: config.isDev ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

if (!config.isProd) {
  global.prisma = prisma;
}

export default prisma;