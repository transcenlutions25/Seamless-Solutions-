import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.org.upsert({
    where: { id: 'dev-org' },
    update: {},
    create: { id: 'dev-org', name: 'Dev Org' },
  });

  await prisma.user.upsert({
    where: { id: 'dev-user' },
    update: {},
    create: { id: 'dev-user', orgId: org.id, email: 'owner@example.com', role: 'OWNER', name: 'Owner' },
  });

  const lead = await prisma.lead.create({ data: { orgId: org.id, status: 'NEW', notes: 'Test lead' } });
  console.log('Seeded org, user, lead', { org: org.id, user: 'dev-user', lead: lead.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
