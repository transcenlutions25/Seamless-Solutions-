import { PrismaClient } from '@prisma/client';

export async function generateQuoteNumber(prisma: PrismaClient | any, orgId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `Q${year}`;
  
  // Get the latest quote number for this org and year
  const latestQuote = await prisma.quote.findFirst({
    where: {
      orgId,
      quoteNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      quoteNumber: 'desc',
    },
  });

  let nextNumber = 1;
  if (latestQuote) {
    const currentNumber = parseInt(latestQuote.quoteNumber.replace(prefix, ''));
    nextNumber = currentNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

export async function generateJobNumber(prisma: PrismaClient | any, orgId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `J${year}`;
  
  const latestJob = await prisma.job.findFirst({
    where: {
      orgId,
      jobNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      jobNumber: 'desc',
    },
  });

  let nextNumber = 1;
  if (latestJob) {
    const currentNumber = parseInt(latestJob.jobNumber.replace(prefix, ''));
    nextNumber = currentNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

export async function generateInvoiceNumber(prisma: PrismaClient | any, orgId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV${year}`;
  
  const latestInvoice = await prisma.invoice.findFirst({
    where: {
      orgId,
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
  });

  let nextNumber = 1;
  if (latestInvoice) {
    const currentNumber = parseInt(latestInvoice.invoiceNumber.replace(prefix, ''));
    nextNumber = currentNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}