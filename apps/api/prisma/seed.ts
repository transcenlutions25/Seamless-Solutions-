import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo',
      email: 'hello@demo.seamlesssolutions.com',
      phone: '+1-555-0100',
      address: '123 Main St, Suite 100, New York, NY 10001',
      timezone: 'America/New_York',
    },
  });

  console.log('✓ Created organization:', org.name);

  // Create owner user
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.com' },
    update: {},
    create: {
      orgId: org.id,
      email: 'owner@demo.com',
      passwordHash,
      name: 'Demo Owner',
      role: 'OWNER',
      phone: '+1-555-0101',
      active: true,
    },
  });

  console.log('✓ Created owner user:', owner.email);

  // Create staff user
  const staff = await prisma.user.upsert({
    where: { email: 'staff@demo.com' },
    update: {},
    create: {
      orgId: org.id,
      email: 'staff@demo.com',
      passwordHash,
      name: 'Demo Staff',
      role: 'STAFF',
      active: true,
    },
  });

  console.log('✓ Created staff user:', staff.email);

  // Create vendors
  const vendor1 = await prisma.vendor.create({
    data: {
      orgId: org.id,
      name: 'John Cleaner',
      email: 'john@cleaners.com',
      phone: '+1-555-0201',
      specialties: ['Deep Cleaning', 'Maintenance'],
      hourlyRate: 45,
      reliabilityScore: 98.5,
      totalJobsCompleted: 127,
      onTimePercent: 95,
      firstPassQCPercent: 92,
      active: true,
    },
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      orgId: org.id,
      name: 'Sarah Landscaper',
      email: 'sarah@greenyard.com',
      phone: '+1-555-0202',
      specialties: ['Lawn Care', 'Landscaping'],
      hourlyRate: 55,
      reliabilityScore: 99.2,
      totalJobsCompleted: 89,
      onTimePercent: 98,
      firstPassQCPercent: 96,
      active: true,
    },
  });

  console.log('✓ Created vendors');

  // Create sample contacts
  const contact1 = await prisma.contact.create({
    data: {
      orgId: org.id,
      type: 'LEAD',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
      phone: '+1-555-1001',
      address: '456 Oak Avenue',
      city: 'Brooklyn',
      state: 'NY',
      zip: '11201',
      tags: ['residential', 'high-priority'],
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      orgId: org.id,
      type: 'CLIENT',
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob@example.com',
      phone: '+1-555-1002',
      company: 'Smith Properties LLC',
      address: '789 Elm Street',
      city: 'Queens',
      state: 'NY',
      zip: '11375',
      tags: ['commercial', 'repeat-customer'],
    },
  });

  console.log('✓ Created contacts');

  // Create sample property
  const property = await prisma.propertyOrSite.create({
    data: {
      orgId: org.id,
      name: 'Downtown Loft',
      address: '321 Pine Street, Apt 4B',
      city: 'Manhattan',
      state: 'NY',
      zip: '10013',
      sqft: 1200,
      rooms: 3,
      floors: 1,
      propertyType: 'Residential',
    },
  });

  console.log('✓ Created property');

  // Create sample leads
  const lead1 = await prisma.lead.create({
    data: {
      orgId: org.id,
      contactId: contact1.id,
      propertyId: property.id,
      assignedToId: staff.id,
      status: 'QUALIFIED',
      source: 'Website',
      priority: 2,
      estimatedValue: 2500,
      description: 'Deep cleaning for move-in preparation',
    },
  });

  console.log('✓ Created leads');

  // Create sample bid
  const bid = await prisma.bid.create({
    data: {
      orgId: org.id,
      leadId: lead1.id,
      propertyId: property.id,
      sqft: 1200,
      rooms: 3,
      daysTarget: 5,
      tier: 'STANDARD',
      deepClean: true,
      pestControl: false,
      flooringRepair: false,
      lawnCare: false,
      maintenance: true,
      deodorize: true,
      paintTouch: false,
      basePrice: 1800,
      rushMultiplier: 1.2,
      riskFactor: 1.05,
      overhead: 280,
      margin: 360,
      totalPrice: 2520,
    },
  });

  console.log('✓ Created bid');

  // Create sample quote
  const quote = await prisma.quote.create({
    data: {
      orgId: org.id,
      leadId: lead1.id,
      contactId: contact1.id,
      bidId: bid.id,
      quoteNumber: 'Q-2025-00001',
      status: 'SENT',
      title: 'Move-in Deep Cleaning Service',
      description: 'Complete deep cleaning and deodorizing for 3-bedroom loft',
      lineItems: [
        { name: 'Deep Cleaning', description: '1200 sqft, 3 rooms', quantity: 1, unitPrice: 1800, total: 1800 },
        { name: 'Deodorizing Service', description: 'Odor removal treatment', quantity: 1, unitPrice: 150, total: 150 },
        { name: 'Maintenance Check', description: 'Basic maintenance inspection', quantity: 1, unitPrice: 400, total: 400 },
      ],
      subtotal: 2350,
      tax: 170,
      total: 2520,
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      sentAt: new Date(),
      terms: 'Payment due within 30 days of service completion.',
    },
  });

  console.log('✓ Created quote');

  // Create sample job
  const job = await prisma.job.create({
    data: {
      orgId: org.id,
      quoteId: quote.id,
      contactId: contact2.id,
      vendorId: vendor1.id,
      assignedToId: staff.id,
      jobNumber: 'J-2025-00001',
      status: 'COMPLETED',
      title: 'Office Deep Cleaning',
      description: 'Monthly maintenance cleaning for commercial office',
      scheduledStart: new Date('2025-10-20T09:00:00Z'),
      scheduledEnd: new Date('2025-10-20T17:00:00Z'),
      actualStart: new Date('2025-10-20T08:50:00Z'),
      actualEnd: new Date('2025-10-20T16:30:00Z'),
    },
  });

  console.log('✓ Created job');

  // Create sample invoice
  await prisma.invoice.create({
    data: {
      orgId: org.id,
      jobId: job.id,
      contactId: contact2.id,
      invoiceNumber: 'INV-2025-00001',
      status: 'PAID',
      lineItems: [
        { name: 'Office Deep Cleaning', description: '8 hours of service', quantity: 8, unitPrice: 450, total: 3600 },
      ],
      subtotal: 3600,
      tax: 288,
      total: 3888,
      amountPaid: 3888,
      sentAt: new Date('2025-10-20T18:00:00Z'),
      paidAt: new Date('2025-10-21T10:00:00Z'),
    },
  });

  console.log('✓ Created invoice');

  // Create sample appointment
  await prisma.appointment.create({
    data: {
      orgId: org.id,
      type: 'ESTIMATE',
      title: 'On-site Estimate - Alice Johnson',
      description: 'Walk-through for loft deep cleaning estimate',
      startTime: new Date('2025-10-25T14:00:00Z'),
      endTime: new Date('2025-10-25T15:00:00Z'),
      location: property.address,
    },
  });

  console.log('✓ Created appointment');

  console.log('✅ Seeding complete!');
  console.log('\n📋 Demo credentials:');
  console.log('   Owner: owner@demo.com / password123');
  console.log('   Staff: staff@demo.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
