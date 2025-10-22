import { PrismaClient } from '@prisma/client';
import { config } from '../src/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a sample organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo-company',
      description: 'A demo organization for Seamless Solutions',
      website: 'https://demo.seamlesssolutions.com',
      phone: '+1-555-0123',
      email: 'hello@demo.seamlesssolutions.com',
      address: '123 Business St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA'
    }
  });

  console.log('✅ Created organization:', organization.name);

  // Create a sample user
  const user = await prisma.user.upsert({
    where: { email: 'demo@seamlesssolutions.com' },
    update: {},
    create: {
      email: 'demo@seamlesssolutions.com',
      firstName: 'Demo',
      lastName: 'User',
      phone: '+1-555-0123',
      role: 'OWNER',
      organizationId: organization.id
    }
  });

  console.log('✅ Created user:', user.email);

  // Create sample contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '+1-555-0001',
        company: 'Smith Enterprises',
        address: '456 Client Ave',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'USA',
        type: 'CLIENT',
        notes: 'VIP client with high-value projects',
        tags: ['VIP', 'Enterprise'],
        organizationId: organization.id
      }
    }),
    prisma.contact.create({
      data: {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '+1-555-0002',
        company: 'Doe Industries',
        address: '789 Prospect St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94103',
        country: 'USA',
        type: 'LEAD',
        notes: 'Interested in cleaning services',
        tags: ['Hot Lead', 'Residential'],
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Created contacts:', contacts.length);

  // Create sample properties
  const properties = await Promise.all([
    prisma.propertyOrSite.create({
      data: {
        name: 'Smith Office Building',
        address: '456 Client Ave',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'USA',
        propertyType: 'commercial',
        squareFootage: 5000,
        bedrooms: 0,
        bathrooms: 4,
        notes: 'Large office building requiring regular maintenance',
        contactId: contacts[0].id,
        organizationId: organization.id
      }
    }),
    prisma.propertyOrSite.create({
      data: {
        name: 'Doe Residence',
        address: '789 Prospect St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94103',
        country: 'USA',
        propertyType: 'residential',
        squareFootage: 2500,
        bedrooms: 4,
        bathrooms: 3,
        notes: 'Family home needing deep cleaning',
        contactId: contacts[1].id,
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Created properties:', properties.length);

  // Create sample leads
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        title: 'Office Building Deep Clean',
        description: 'Complete deep cleaning of 5,000 sq ft office building',
        status: 'QUALIFIED',
        source: 'Website',
        value: 5000,
        priority: 'high',
        notes: 'Client wants eco-friendly cleaning products',
        tags: ['Commercial', 'Deep Clean', 'Eco-Friendly'],
        contactId: contacts[0].id,
        propertyId: properties[0].id,
        createdById: user.id,
        assignedToId: user.id,
        organizationId: organization.id
      }
    }),
    prisma.lead.create({
      data: {
        title: 'Residential Move-Out Clean',
        description: 'Complete move-out cleaning for 2,500 sq ft home',
        status: 'NEW',
        source: 'Referral',
        value: 1200,
        priority: 'medium',
        notes: 'Moving out next month, needs thorough cleaning',
        tags: ['Residential', 'Move-Out', 'Thorough'],
        contactId: contacts[1].id,
        propertyId: properties[1].id,
        createdById: user.id,
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Created leads:', leads.length);

  // Create sample bids
  const bids = await Promise.all([
    prisma.bid.create({
      data: {
        squareFootage: 5000,
        rooms: 20,
        daysTarget: 3,
        tier: 'PREMIUM',
        scope: {
          deepClean: true,
          pestControl: false,
          flooring: true,
          lawnCare: false,
          maintenance: true,
          deodorize: true
        },
        basePrice: 1250,
        rushMultiplier: 1.2,
        riskFactor: 1.1,
        overhead: 0.1,
        margin: 0.2,
        totalPrice: 1650,
        notes: 'Eco-friendly products included',
        leadId: leads[0].id
      }
    }),
    prisma.bid.create({
      data: {
        squareFootage: 2500,
        rooms: 8,
        daysTarget: 1,
        tier: 'STANDARD',
        scope: {
          deepClean: true,
          pestControl: false,
          flooring: true,
          lawnCare: false,
          maintenance: false,
          deodorize: false
        },
        basePrice: 625,
        rushMultiplier: 1.0,
        riskFactor: 1.0,
        overhead: 0.1,
        margin: 0.2,
        totalPrice: 812.5,
        notes: 'Standard residential cleaning',
        leadId: leads[1].id
      }
    })
  ]);

  console.log('✅ Created bids:', bids.length);

  // Create sample quotes
  const quotes = await Promise.all([
    prisma.quote.create({
      data: {
        title: 'Office Building Deep Clean Quote',
        description: 'Complete deep cleaning service for office building',
        status: 'SENT',
        subtotal: 1650,
        tax: 132,
        discount: 0,
        total: 1782,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        notes: 'Eco-friendly products included',
        leadId: leads[0].id,
        bidId: bids[0].id,
        createdById: user.id,
        organizationId: organization.id
      }
    }),
    prisma.quote.create({
      data: {
        title: 'Residential Move-Out Clean Quote',
        description: 'Complete move-out cleaning service',
        status: 'DRAFT',
        subtotal: 812.5,
        tax: 65,
        discount: 50,
        total: 827.5,
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        notes: 'First-time customer discount applied',
        leadId: leads[1].id,
        bidId: bids[1].id,
        createdById: user.id,
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Created quotes:', quotes.length);

  // Create sample jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: 'Office Building Deep Clean',
        description: 'Complete deep cleaning of office building',
        status: 'SCHEDULED',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
        estimatedHours: 16,
        notes: 'Use eco-friendly products only',
        contactId: contacts[0].id,
        propertyId: properties[0].id,
        quoteId: quotes[0].id,
        createdById: user.id,
        assignedToId: user.id,
        organizationId: organization.id
      }
    }),
    prisma.job.create({
      data: {
        title: 'Residential Move-Out Clean',
        description: 'Complete move-out cleaning',
        status: 'SCHEDULED',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Same day
        estimatedHours: 8,
        notes: 'Customer prefers morning appointment',
        contactId: contacts[1].id,
        propertyId: properties[1].id,
        quoteId: quotes[1].id,
        createdById: user.id,
        assignedToId: user.id,
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Created jobs:', jobs.length);

  // Create sample invoices
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-000001',
        status: 'SENT',
        subtotal: 1650,
        tax: 132,
        discount: 0,
        total: 1782,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        notes: 'Payment due within 30 days',
        contactId: contacts[0].id,
        quoteId: quotes[0].id,
        jobId: jobs[0].id,
        createdById: user.id,
        organizationId: organization.id
      }
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-000002',
        status: 'DRAFT',
        subtotal: 812.5,
        tax: 65,
        discount: 50,
        total: 827.5,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        notes: 'First-time customer discount applied',
        contactId: contacts[1].id,
        quoteId: quotes[1].id,
        jobId: jobs[1].id,
        createdById: user.id,
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Created invoices:', invoices.length);

  // Create sample appointments
  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        title: 'Office Building Deep Clean - Day 1',
        description: 'Start of deep cleaning project',
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 7 days from now at 9 AM
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000), // 7 days from now at 5 PM
        location: '456 Client Ave, San Francisco, CA 94102',
        notes: 'Bring eco-friendly cleaning supplies',
        contactId: contacts[0].id,
        propertyId: properties[0].id,
        jobId: jobs[0].id,
        userId: user.id,
        organizationId: organization.id
      }
    }),
    prisma.appointment.create({
      data: {
        title: 'Residential Move-Out Clean',
        description: 'Complete move-out cleaning appointment',
        startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 14 days from now at 9 AM
        endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000), // 14 days from now at 5 PM
        location: '789 Prospect St, San Francisco, CA 94103',
        notes: 'Customer prefers morning appointment',
        contactId: contacts[1].id,
        propertyId: properties[1].id,
        jobId: jobs[1].id,
        userId: user.id,
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Created appointments:', appointments.length);

  // Create sample campaigns
  const campaigns = await Promise.all([
    prisma.campaign.create({
      data: {
        name: 'Spring Cleaning Promotion',
        description: 'Promote spring cleaning services to residential clients',
        type: 'EMAIL',
        subject: 'Spring Cleaning Special - 20% Off!',
        content: 'Get your home ready for spring with our professional cleaning services. Book now and save 20%!',
        targetAudience: {
          contactTypes: ['CLIENT', 'LEAD'],
          tags: ['Residential'],
          leadStatuses: ['NEW', 'QUALIFIED']
        },
        status: 'ACTIVE',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        createdById: user.id,
        organizationId: organization.id
      }
    }),
    prisma.campaign.create({
      data: {
        name: 'Follow-up on Quotes',
        description: 'Follow up with clients who received quotes but haven\'t responded',
        type: 'SMS',
        content: 'Hi! We sent you a quote for cleaning services. Do you have any questions? Reply STOP to opt out.',
        targetAudience: {
          leadStatuses: ['QUOTED']
        },
        status: 'DRAFT',
        createdById: user.id,
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Created campaigns:', campaigns.length);

  // Create sample vendors
  const vendors = await Promise.all([
    prisma.vendor.create({
      data: {
        name: 'Clean Pro Services',
        email: 'info@cleanpro.com',
        phone: '+1-555-0100',
        company: 'Clean Pro Services LLC',
        address: '100 Vendor St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94104',
        country: 'USA',
        specialties: ['Deep Cleaning', 'Commercial', 'Eco-Friendly'],
        hourlyRate: 45,
        reliabilityScore: 0.95,
        onTimePercent: 0.98,
        firstPassPercent: 0.92
      }
    }),
    prisma.vendor.create({
      data: {
        name: 'Quick Clean Solutions',
        email: 'contact@quickclean.com',
        phone: '+1-555-0101',
        company: 'Quick Clean Solutions Inc',
        address: '200 Service Ave',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'USA',
        specialties: ['Residential', 'Move-Out', 'Rush Jobs'],
        hourlyRate: 35,
        reliabilityScore: 0.88,
        onTimePercent: 0.90,
        firstPassPercent: 0.85
      }
    })
  ]);

  console.log('✅ Created vendors:', vendors.length);

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Organization: ${organization.name}`);
  console.log(`- User: ${user.email}`);
  console.log(`- Contacts: ${contacts.length}`);
  console.log(`- Properties: ${properties.length}`);
  console.log(`- Leads: ${leads.length}`);
  console.log(`- Bids: ${bids.length}`);
  console.log(`- Quotes: ${quotes.length}`);
  console.log(`- Jobs: ${jobs.length}`);
  console.log(`- Invoices: ${invoices.length}`);
  console.log(`- Appointments: ${appointments.length}`);
  console.log(`- Campaigns: ${campaigns.length}`);
  console.log(`- Vendors: ${vendors.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
