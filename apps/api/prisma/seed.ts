import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // Create default organization
  const org = await prisma.org.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'Demo Organization',
      subdomain: 'demo',
      email: 'demo@seamless.com',
      phone: '(555) 123-4567',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'US',
      timezone: 'America/New_York',
      trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days trial
      priceMultiplier: 1.0,
    },
  });
  
  console.log('✅ Created organization:', org.name);
  
  // Create owner user
  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.com' },
    update: {},
    create: {
      email: 'owner@demo.com',
      name: 'John Owner',
      role: 'OWNER',
      orgId: org.id,
      phoneNumber: '(555) 100-0001',
    },
  });
  
  // Create staff users
  const staff1 = await prisma.user.upsert({
    where: { email: 'sarah@demo.com' },
    update: {},
    create: {
      email: 'sarah@demo.com',
      name: 'Sarah Manager',
      role: 'STAFF',
      orgId: org.id,
      phoneNumber: '(555) 100-0002',
    },
  });
  
  const staff2 = await prisma.user.upsert({
    where: { email: 'mike@demo.com' },
    update: {},
    create: {
      email: 'mike@demo.com',
      name: 'Mike Coordinator',
      role: 'STAFF',
      orgId: org.id,
      phoneNumber: '(555) 100-0003',
    },
  });
  
  // Create vendor users
  const vendor1 = await prisma.user.upsert({
    where: { email: 'alex@demo.com' },
    update: {},
    create: {
      email: 'alex@demo.com',
      name: 'Alex Technician',
      role: 'VENDOR',
      orgId: org.id,
      phoneNumber: '(555) 200-0001',
    },
  });
  
  const vendor2 = await prisma.user.upsert({
    where: { email: 'maria@demo.com' },
    update: {},
    create: {
      email: 'maria@demo.com',
      name: 'Maria Specialist',
      role: 'VENDOR',
      orgId: org.id,
      phoneNumber: '(555) 200-0002',
    },
  });
  
  console.log('✅ Created users');
  
  // Create vendor profiles
  await prisma.vendor.upsert({
    where: { userId: vendor1.id },
    update: {},
    create: {
      userId: vendor1.id,
      orgId: org.id,
      hourlyRate: 45,
      skills: ['cleaning', 'maintenance', 'repairs'],
      certifications: ['OSHA Safety', 'EPA Certified'],
      reliabilityScore: 98.5,
      onTimeRate: 97.2,
      qcPassRate: 99.1,
      totalJobs: 142,
    },
  });
  
  await prisma.vendor.upsert({
    where: { userId: vendor2.id },
    update: {},
    create: {
      userId: vendor2.id,
      orgId: org.id,
      hourlyRate: 55,
      skills: ['deep cleaning', 'pest control', 'flooring'],
      certifications: ['Pest Control License', 'Floor Care Specialist'],
      reliabilityScore: 96.8,
      onTimeRate: 95.5,
      qcPassRate: 98.7,
      totalJobs: 98,
    },
  });
  
  console.log('✅ Created vendor profiles');
  
  // Create sample contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        orgId: org.id,
        type: 'CLIENT',
        firstName: 'Emily',
        lastName: 'Johnson',
        email: 'emily.johnson@example.com',
        phone: '(555) 300-0001',
        company: 'Johnson Real Estate',
        address: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        tags: ['vip', 'commercial'],
        rating: 5,
      },
    }),
    prisma.contact.create({
      data: {
        orgId: org.id,
        type: 'CLIENT',
        firstName: 'Robert',
        lastName: 'Smith',
        email: 'robert.smith@example.com',
        phone: '(555) 300-0002',
        company: 'Smith Properties LLC',
        address: '789 Pine Street',
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
        tags: ['residential'],
        rating: 4,
      },
    }),
    prisma.contact.create({
      data: {
        orgId: org.id,
        type: 'LEAD',
        firstName: 'Jennifer',
        lastName: 'Davis',
        email: 'jennifer.davis@example.com',
        phone: '(555) 300-0003',
        address: '321 Elm Boulevard',
        city: 'Houston',
        state: 'TX',
        zip: '77001',
        tags: ['hot-lead'],
        source: 'Website',
      },
    }),
    prisma.contact.create({
      data: {
        orgId: org.id,
        type: 'LEAD',
        firstName: 'Michael',
        lastName: 'Wilson',
        email: 'michael.wilson@example.com',
        phone: '(555) 300-0004',
        company: 'Wilson Enterprises',
        address: '654 Maple Drive',
        city: 'Phoenix',
        state: 'AZ',
        zip: '85001',
        tags: ['commercial', 'follow-up'],
        source: 'Referral',
      },
    }),
  ]);
  
  console.log('✅ Created contacts');
  
  // Create sample properties
  const properties = await Promise.all([
    prisma.propertyOrSite.create({
      data: {
        orgId: org.id,
        contactId: contacts[0].id,
        name: 'Johnson Office Building',
        address: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        squareFeet: 15000,
        rooms: 45,
        bathrooms: 12,
        propertyType: 'Commercial Office',
        accessCode: '1234#',
      },
    }),
    prisma.propertyOrSite.create({
      data: {
        orgId: org.id,
        contactId: contacts[1].id,
        name: 'Smith Residence',
        address: '789 Pine Street',
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
        squareFeet: 3500,
        rooms: 12,
        bathrooms: 4,
        propertyType: 'Single Family Home',
      },
    }),
  ]);
  
  console.log('✅ Created properties');
  
  // Create sample leads
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        orgId: org.id,
        contactId: contacts[2].id,
        status: 'NEW',
        source: 'Website',
        value: 2500,
        score: 75,
        notes: 'Interested in monthly cleaning service',
      },
    }),
    prisma.lead.create({
      data: {
        orgId: org.id,
        contactId: contacts[3].id,
        status: 'QUALIFIED',
        source: 'Referral',
        value: 8500,
        score: 90,
        assignedToId: staff1.id,
        notes: 'Large commercial opportunity, needs quote ASAP',
      },
    }),
  ]);
  
  console.log('✅ Created leads');
  
  // Create sample bids
  const bid = await prisma.bid.create({
    data: {
      orgId: org.id,
      leadId: leads[1].id,
      propertyId: properties[0].id,
      squareFeet: 15000,
      rooms: 45,
      bathrooms: 12,
      daysTarget: 5,
      tier: 'PREMIUM',
      deepClean: true,
      pestControl: false,
      flooringRepair: false,
      lawnCare: false,
      maintenance: true,
      deodorize: false,
      basePrice: 2700,
      rushMultiplier: 1.25,
      riskFactor: 1.08,
      overhead: 405,
      margin: 810,
      totalPrice: 4915,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  
  console.log('✅ Created bid');
  
  // Create sample quote
  const quote = await prisma.quote.create({
    data: {
      orgId: org.id,
      contactId: contacts[0].id,
      propertyId: properties[0].id,
      bidId: bid.id,
      createdById: staff1.id,
      quoteNumber: 'Q-2025-00001',
      status: 'SENT',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: 4500,
      tax: 405,
      discount: 0,
      total: 4905,
      terms: 'Payment due within 30 days. 2% late fee after 30 days.',
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      lineItems: {
        create: [
          {
            description: 'Deep Cleaning Service - 15,000 sq ft',
            quantity: 1,
            unitPrice: 2700,
            total: 2700,
            sortOrder: 0,
          },
          {
            description: 'General Maintenance',
            quantity: 1,
            unitPrice: 500,
            total: 500,
            sortOrder: 1,
          },
          {
            description: 'Rush Service Fee',
            quantity: 1,
            unitPrice: 675,
            total: 675,
            sortOrder: 2,
          },
          {
            description: 'Premium Service Package',
            quantity: 1,
            unitPrice: 625,
            total: 625,
            sortOrder: 3,
          },
        ],
      },
    },
  });
  
  console.log('✅ Created quote');
  
  // Create sample job
  const job = await prisma.job.create({
    data: {
      orgId: org.id,
      contactId: contacts[0].id,
      propertyId: properties[0].id,
      quoteId: quote.id,
      assignedToId: vendor1.id,
      jobNumber: 'J-2025-00001',
      status: 'SCHEDULED',
      priority: 'HIGH',
      scheduledStart: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      scheduledEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      description: 'Deep cleaning and maintenance service',
      instructions: 'Use main entrance. Contact property manager on arrival.',
      accessNotes: 'Access code: 1234#',
    },
  });
  
  console.log('✅ Created job');
  
  // Create job tasks
  await prisma.jobTask.createMany({
    data: [
      {
        jobId: job.id,
        title: 'Initial inspection and photos',
        description: 'Document current state of all areas',
        sortOrder: 0,
      },
      {
        jobId: job.id,
        title: 'Deep clean all offices',
        description: 'Complete deep cleaning of all office spaces',
        sortOrder: 1,
      },
      {
        jobId: job.id,
        title: 'Maintenance checklist',
        description: 'Complete all maintenance items on checklist',
        sortOrder: 2,
      },
      {
        jobId: job.id,
        title: 'Final QC and photos',
        description: 'Quality check and document completed work',
        sortOrder: 3,
      },
    ],
  });
  
  console.log('✅ Created job tasks');
  
  // Create sample appointments
  await prisma.appointment.createMany({
    data: [
      {
        orgId: org.id,
        contactId: contacts[2].id,
        assignedToId: staff1.id,
        title: 'Initial Consultation - Davis',
        description: 'Discuss cleaning needs and provide estimate',
        type: 'ESTIMATE',
        startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        location: '321 Elm Boulevard, Houston, TX',
        reminderMinutes: 30,
      },
      {
        orgId: org.id,
        contactId: contacts[3].id,
        assignedToId: staff2.id,
        title: 'Follow-up Meeting - Wilson',
        description: 'Review quote and answer questions',
        type: 'MEETING',
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        location: 'Video Call',
        reminderMinutes: 15,
      },
    ],
  });
  
  console.log('✅ Created appointments');
  
  // Create sample campaign
  const campaign = await prisma.campaign.create({
    data: {
      orgId: org.id,
      name: 'Spring Cleaning Special',
      description: '20% off deep cleaning services for new customers',
      channel: 'EMAIL',
      status: 'DRAFT',
      subject: 'Spring Cleaning Special - 20% Off!',
      emailContent: '<h1>Spring is Here!</h1><p>Get 20% off your first deep cleaning service...</p>',
      targetFilters: {
        tags: ['residential'],
        type: 'LEAD',
      },
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  
  console.log('✅ Created campaign');
  
  // Create sample activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        orgId: org.id,
        userId: owner.id,
        type: 'CREATE',
        entityType: 'Organization',
        entityId: org.id,
        description: 'Organization created',
      },
      {
        orgId: org.id,
        userId: staff1.id,
        type: 'CREATE',
        entityType: 'Lead',
        entityId: leads[0].id,
        description: 'New lead created: Jennifer Davis',
      },
      {
        orgId: org.id,
        userId: staff1.id,
        type: 'STATUS_CHANGE',
        entityType: 'Lead',
        entityId: leads[1].id,
        description: 'Lead status changed to QUALIFIED',
      },
      {
        orgId: org.id,
        userId: staff1.id,
        type: 'CREATE',
        entityType: 'Quote',
        entityId: quote.id,
        description: 'Quote Q-2025-00001 created for $4,905',
      },
      {
        orgId: org.id,
        userId: staff2.id,
        type: 'CREATE',
        entityType: 'Job',
        entityId: job.id,
        description: 'Job J-2025-00001 scheduled',
      },
    ],
  });
  
  console.log('✅ Created activity logs');
  
  console.log('✨ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });