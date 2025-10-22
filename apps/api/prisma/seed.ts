import { PrismaClient, Role, ContactType, LeadStatus, Tier, JobStatus, InvoiceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Cleaning Company',
      slug: 'demo-company',
      email: 'info@democleaning.com',
      phone: '+1-555-0123',
      address: '123 Business St',
      city: 'Demo City',
      state: 'CA',
      zipCode: '90210',
      timezone: 'America/Los_Angeles',
      priceMultiplier: 1.0,
    },
  });

  console.log('✅ Created organization:', org.name);

  // Create demo users
  const owner = await prisma.user.upsert({
    where: { email: 'owner@democleaning.com' },
    update: {},
    create: {
      email: 'owner@democleaning.com',
      firstName: 'John',
      lastName: 'Smith',
      phone: '+1-555-0124',
      role: Role.OWNER,
      orgId: org.id,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@democleaning.com' },
    update: {},
    create: {
      email: 'staff@democleaning.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1-555-0125',
      role: Role.STAFF,
      orgId: org.id,
    },
  });

  console.log('✅ Created users:', owner.firstName, staff.firstName);

  // Create demo vendors
  const vendors = await Promise.all([
    prisma.vendor.upsert({
      where: { email: 'mike@cleaning.com' },
      update: {},
      create: {
        firstName: 'Mike',
        lastName: 'Wilson',
        email: 'mike@cleaning.com',
        phone: '+1-555-0126',
        specialties: ['Deep Cleaning', 'Carpet Cleaning'],
        hourlyRate: 25.0,
        reliabilityScore: 92.5,
        onTimePercent: 88.0,
        firstPassQcPercent: 95.0,
        orgId: org.id,
      },
    }),
    prisma.vendor.upsert({
      where: { email: 'lisa@cleaning.com' },
      update: {},
      create: {
        firstName: 'Lisa',
        lastName: 'Davis',
        email: 'lisa@cleaning.com',
        phone: '+1-555-0127',
        specialties: ['Window Cleaning', 'Office Cleaning'],
        hourlyRate: 22.0,
        reliabilityScore: 96.0,
        onTimePercent: 94.0,
        firstPassQcPercent: 92.0,
        orgId: org.id,
      },
    }),
  ]);

  console.log('✅ Created vendors:', vendors.map(v => v.firstName).join(', '));

  // Create demo properties
  const properties = await Promise.all([
    prisma.propertyOrSite.create({
      data: {
        name: 'Downtown Office Building',
        address: '456 Main St',
        city: 'Demo City',
        state: 'CA',
        zipCode: '90210',
        sqft: 5000,
        rooms: 20,
        floors: 3,
        notes: 'Large office building with multiple tenants',
        orgId: org.id,
      },
    }),
    prisma.propertyOrSite.create({
      data: {
        name: 'Residential Home',
        address: '789 Oak Ave',
        city: 'Demo City',
        state: 'CA',
        zipCode: '90211',
        sqft: 2500,
        rooms: 8,
        floors: 2,
        notes: 'Family home with pets',
        orgId: org.id,
      },
    }),
  ]);

  console.log('✅ Created properties:', properties.map(p => p.name).join(', '));

  // Create demo contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        type: ContactType.CLIENT,
        firstName: 'Alice',
        lastName: 'Brown',
        email: 'alice@email.com',
        phone: '+1-555-0128',
        company: 'Brown Enterprises',
        address: '456 Main St',
        city: 'Demo City',
        state: 'CA',
        zipCode: '90210',
        notes: 'Prefers morning appointments',
        tags: ['VIP', 'Commercial'],
        orgId: org.id,
      },
    }),
    prisma.contact.create({
      data: {
        type: ContactType.LEAD,
        firstName: 'Bob',
        lastName: 'Green',
        email: 'bob@email.com',
        phone: '+1-555-0129',
        address: '789 Oak Ave',
        city: 'Demo City',
        state: 'CA',
        zipCode: '90211',
        notes: 'Interested in weekly cleaning',
        tags: ['Residential'],
        orgId: org.id,
      },
    }),
    prisma.contact.create({
      data: {
        type: ContactType.LEAD,
        firstName: 'Carol',
        lastName: 'White',
        email: 'carol@email.com',
        phone: '+1-555-0130',
        address: '321 Pine St',
        city: 'Demo City',
        state: 'CA',
        zipCode: '90212',
        notes: 'New lead from website',
        tags: ['Website'],
        orgId: org.id,
      },
    }),
  ]);

  console.log('✅ Created contacts:', contacts.map(c => c.firstName).join(', '));

  // Create demo leads
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        status: LeadStatus.QUALIFIED,
        source: 'website',
        contactId: contacts[1].id, // Bob Green
        propertyId: properties[1].id,
        description: 'Weekly residential cleaning service',
        estimatedValue: 800.0,
        priority: 7,
        orgId: org.id,
      },
    }),
    prisma.lead.create({
      data: {
        status: LeadStatus.NEW,
        source: 'referral',
        contactId: contacts[2].id, // Carol White
        description: 'One-time deep cleaning',
        estimatedValue: 350.0,
        priority: 5,
        orgId: org.id,
      },
    }),
  ]);

  console.log('✅ Created leads:', leads.length);

  // Create demo bids
  const bids = await Promise.all([
    prisma.bid.create({
      data: {
        leadId: leads[0].id,
        propertyId: properties[1].id,
        sqft: 2500,
        rooms: 8,
        daysTarget: 7,
        tier: Tier.STANDARD,
        deepClean: true,
        pest: false,
        flooring: false,
        lawn: true,
        maintenance: false,
        deodorize: true,
        basePrice: 650.0,
        rushMultiplier: 1.0,
        riskFactor: 1.1,
        overhead: 97.5,
        margin: 186.875,
        totalPrice: 934.375,
        notes: 'Standard weekly cleaning with deep clean first visit',
        orgId: org.id,
      },
    }),
  ]);

  console.log('✅ Created bids:', bids.length);

  // Create demo quotes
  const quotes = await Promise.all([
    prisma.quote.create({
      data: {
        quoteNumber: 'Q20240001',
        status: 'ACCEPTED',
        bidId: bids[0].id,
        contactId: contacts[1].id,
        title: 'Weekly Residential Cleaning Service',
        description: 'Comprehensive weekly cleaning including deep clean on first visit',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        totalAmount: 934.375,
        terms: 'Payment due within 30 days of service completion',
        notes: 'Customer prefers morning appointments',
        sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        viewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        orgId: org.id,
      },
    }),
  ]);

  console.log('✅ Created quotes:', quotes.length);

  // Create demo jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        jobNumber: 'J20240001',
        status: JobStatus.COMPLETED,
        quoteId: quotes[0].id,
        contactId: contacts[1].id,
        vendorId: vendors[0].id,
        propertyId: properties[1].id,
        title: 'Weekly Residential Cleaning Service',
        description: 'Initial deep clean and setup for weekly service',
        scheduledStart: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        scheduledEnd: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours later
        actualStart: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000), // 15 min late
        actualEnd: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 4.5 * 60 * 60 * 1000), // 30 min overtime
        totalAmount: 934.375,
        notes: 'Customer very satisfied with service',
        qcPhotos: [
          'https://example.com/photos/before1.jpg',
          'https://example.com/photos/after1.jpg',
        ],
        completionNotes: 'All areas cleaned thoroughly. Pet hair removed from carpets. Customer requests same vendor for future visits.',
        orgId: org.id,
      },
    }),
  ]);

  console.log('✅ Created jobs:', jobs.length);

  // Create demo invoices
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV20240001',
        status: InvoiceStatus.PAID,
        jobId: jobs[0].id,
        contactId: contacts[1].id,
        amount: 934.375,
        tax: 74.75,
        totalAmount: 1009.125,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        notes: 'Thank you for your business!',
        orgId: org.id,
      },
    }),
  ]);

  console.log('✅ Created invoices:', invoices.length);

  // Create demo appointments
  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        title: 'Site Visit - New Commercial Client',
        description: 'Initial consultation and walkthrough for potential commercial cleaning contract',
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hour later
        location: '456 Main St, Demo City, CA',
        attendees: [owner.email, staff.email],
        reminders: {
          email: true,
          sms: false,
          minutesBefore: 30,
        },
        orgId: org.id,
      },
    }),
    prisma.appointment.create({
      data: {
        title: 'Team Meeting',
        description: 'Weekly team standup and planning session',
        startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 min later
        location: 'Office Conference Room',
        attendees: [owner.email, staff.email],
        reminders: {
          email: true,
          sms: false,
          minutesBefore: 15,
        },
        orgId: org.id,
      },
    }),
  ]);

  console.log('✅ Created appointments:', appointments.length);

  // Create demo campaigns
  const campaigns = await Promise.all([
    prisma.campaign.create({
      data: {
        name: 'Spring Cleaning Special',
        type: 'EMAIL',
        status: 'COMPLETED',
        subject: '🌸 Spring Cleaning Special - 20% Off Deep Cleaning!',
        content: `
          <h2>Spring is here! Time for a fresh start.</h2>
          <p>Take advantage of our Spring Cleaning Special and get 20% off your first deep cleaning service.</p>
          <p>Our professional team will make your home or office sparkle!</p>
          <p><strong>Offer valid through April 30th</strong></p>
          <p><a href="#book-now">Book Now</a></p>
        `,
        filters: {
          contactType: 'LEAD',
          tags: ['Residential'],
        },
        scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        recipients: 25,
        opened: 18,
        clicked: 7,
        orgId: org.id,
      },
    }),
  ]);

  console.log('✅ Created campaigns:', campaigns.length);

  // Create some activity logs
  await Promise.all([
    prisma.activityLog.create({
      data: {
        action: 'lead_created',
        entity: 'Lead',
        entityId: leads[0].id,
        userId: staff.id,
        leadId: leads[0].id,
        contactId: contacts[1].id,
        details: {
          source: 'website',
          estimatedValue: 800.0,
        },
        orgId: org.id,
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'quote_sent',
        entity: 'Quote',
        entityId: quotes[0].id,
        userId: owner.id,
        quoteId: quotes[0].id,
        contactId: contacts[1].id,
        leadId: leads[0].id,
        details: {
          sentTo: contacts[1].email,
          quoteNumber: quotes[0].quoteNumber,
        },
        orgId: org.id,
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'job_completed',
        entity: 'Job',
        entityId: jobs[0].id,
        userId: owner.id,
        jobId: jobs[0].id,
        contactId: contacts[1].id,
        vendorId: vendors[0].id,
        details: {
          jobNumber: jobs[0].jobNumber,
          completedBy: `${vendors[0].firstName} ${vendors[0].lastName}`,
        },
        orgId: org.id,
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'invoice_paid',
        entity: 'Invoice',
        entityId: invoices[0].id,
        invoiceId: invoices[0].id,
        contactId: contacts[1].id,
        jobId: jobs[0].id,
        details: {
          amount: invoices[0].totalAmount,
          paymentMethod: 'stripe',
        },
        orgId: org.id,
      },
    }),
  ]);

  console.log('✅ Created activity logs');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Organization: ${org.name}`);
  console.log(`- Users: ${[owner, staff].length}`);
  console.log(`- Vendors: ${vendors.length}`);
  console.log(`- Properties: ${properties.length}`);
  console.log(`- Contacts: ${contacts.length}`);
  console.log(`- Leads: ${leads.length}`);
  console.log(`- Bids: ${bids.length}`);
  console.log(`- Quotes: ${quotes.length}`);
  console.log(`- Jobs: ${jobs.length}`);
  console.log(`- Invoices: ${invoices.length}`);
  console.log(`- Appointments: ${appointments.length}`);
  console.log(`- Campaigns: ${campaigns.length}`);
  console.log('\n🔑 Demo Login:');
  console.log(`Owner: ${owner.email}`);
  console.log(`Staff: ${staff.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });