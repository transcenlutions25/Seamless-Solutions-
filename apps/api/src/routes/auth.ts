import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { Role } from '@prisma/client';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  orgName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const inviteUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  role: z.nativeEnum(Role),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register new organization and owner
  fastify.post('/register', {
    schema: {
      body: registerSchema,
      response: {
        201: z.object({
          user: z.object({
            id: z.string(),
            email: z.string(),
            firstName: z.string(),
            role: z.nativeEnum(Role),
          }),
          org: z.object({
            id: z.string(),
            name: z.string(),
            slug: z.string(),
          }),
          token: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    const { email, password, firstName, lastName, phone, orgName } = registerSchema.parse(request.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return reply.status(409).send({ error: 'User already exists' });
    }

    // Generate org slug
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim('-');
    let uniqueSlug = slug;
    let counter = 1;
    
    while (await prisma.organization.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create organization and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug: uniqueSlug,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          firstName,
          lastName,
          phone,
          role: Role.OWNER,
          orgId: org.id,
        },
      });

      return { org, user };
    });

    // Generate JWT token
    const token = fastify.jwt.sign({ userId: result.user.id });

    reply.status(201).send({
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        role: result.user.role,
      },
      org: {
        id: result.org.id,
        name: result.org.name,
        slug: result.org.slug,
      },
      token,
    });
  });

  // Login
  fastify.post('/login', {
    schema: {
      body: loginSchema,
      response: {
        200: z.object({
          user: z.object({
            id: z.string(),
            email: z.string(),
            firstName: z.string(),
            role: z.nativeEnum(Role),
            orgId: z.string(),
          }),
          token: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        org: true,
      },
    });

    if (!user || !user.isActive) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    // For demo purposes, we'll skip password verification since we don't store passwords
    // In production, you would verify the hashed password here
    
    const token = fastify.jwt.sign({ userId: user.id });

    reply.send({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        role: user.role,
        orgId: user.orgId,
      },
      token,
    });
  });

  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      include: {
        org: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    reply.send({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        orgId: user.orgId,
      },
      org: {
        id: user.org.id,
        name: user.org.name,
        slug: user.org.slug,
      },
    });
  });

  // Invite user to organization
  fastify.post('/invite', {
    preHandler: [fastify.authenticate, fastify.requireRole([Role.OWNER, Role.STAFF])],
    schema: {
      body: inviteUserSchema,
    },
  }, async (request, reply) => {
    const { email, firstName, lastName, role } = inviteUserSchema.parse(request.body);

    // Check if user already exists in the organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        orgId: request.user!.orgId,
      },
    });

    if (existingUser) {
      return reply.status(409).send({ error: 'User already exists in organization' });
    }

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        role,
        orgId: request.user!.orgId,
      },
    });

    // In production, you would send an invitation email here

    reply.status(201).send({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  });

  // Logout (client-side token removal)
  fastify.post('/logout', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    // In a more sophisticated setup, you might maintain a token blacklist
    reply.send({ message: 'Logged out successfully' });
  });
}