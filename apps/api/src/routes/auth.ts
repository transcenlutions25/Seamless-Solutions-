import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';
import { logActivity } from '../services/activityLog.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string(),
  orgName: z.string(),
  orgSlug: z.string().regex(/^[a-z0-9-]+$/),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register new organization + owner
  fastify.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);

    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return reply.status(400).send({ error: 'Email already registered' });
    }

    // Check if slug exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: body.orgSlug },
    });

    if (existingOrg) {
      return reply.status(400).send({ error: 'Organization slug already taken' });
    }

    // Create org and owner
    const passwordHash = await hashPassword(body.password);

    const org = await prisma.organization.create({
      data: {
        name: body.orgName,
        slug: body.orgSlug,
        users: {
          create: {
            email: body.email,
            name: body.name,
            passwordHash,
            role: 'OWNER',
          },
        },
      },
      include: {
        users: true,
      },
    });

    const user = org.users[0];

    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      orgId: org.id,
      role: user.role,
    });

    await logActivity({
      orgId: org.id,
      userId: user.id,
      entityType: 'User',
      entityId: user.id,
      action: 'register',
      traceId: request.traceId,
    });

    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { organization: true },
    });

    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await verifyPassword(body.password, user.passwordHash);

    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    if (!user.active) {
      return reply.status(403).send({ error: 'Account disabled' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      orgId: user.orgId,
      role: user.role,
    });

    await logActivity({
      orgId: user.orgId,
      userId: user.id,
      entityType: 'User',
      entityId: user.id,
      action: 'login',
      traceId: request.traceId,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
        },
      },
    };
  });

  // Get current user
  fastify.get('/me', { onRequest: [fastify.authenticate] }, async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      include: { organization: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return { user };
  });
}
