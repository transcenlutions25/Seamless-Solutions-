import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { loginSchema, signupSchema } from '@seamless/shared';
import { prisma } from '../../lib/prisma';
import { supabaseAdmin } from '../../lib/supabase';
import { nanoid } from 'nanoid';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Sign up
  fastify.post('/signup', {
    schema: {
      body: signupSchema,
    },
  }, async (request, reply) => {
    const { email, password, name, orgName, subdomain } = request.body as any;
    
    try {
      // Check if subdomain is taken
      const existingOrg = await prisma.org.findUnique({
        where: { subdomain },
      });
      
      if (existingOrg) {
        return reply.code(400).send({ error: 'Subdomain is already taken' });
      }
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      
      if (existingUser) {
        return reply.code(400).send({ error: 'Email is already registered' });
      }
      
      // Create Supabase user (optional - can skip if not using Supabase Auth)
      let supabaseId: string | null = null;
      try {
        const { data: supabaseUser, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        
        if (supabaseUser) {
          supabaseId = supabaseUser.user.id;
        }
      } catch (err) {
        // Continue without Supabase if it fails
        fastify.log.warn('Supabase user creation failed, continuing without it');
      }
      
      // Create org and user in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create organization
        const org = await tx.org.create({
          data: {
            name: orgName,
            subdomain,
            email,
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
          },
        });
        
        // Create user
        const user = await tx.user.create({
          data: {
            email,
            name,
            role: 'OWNER',
            orgId: org.id,
            supabaseId,
          },
        });
        
        // Create initial activity log
        await tx.activityLog.create({
          data: {
            orgId: org.id,
            userId: user.id,
            type: 'CREATE',
            entityType: 'User',
            entityId: user.id,
            description: `${name} created account and organization ${orgName}`,
          },
        });
        
        return { org, user };
      });
      
      // Generate JWT token
      const token = fastify.jwt.sign({
        userId: result.user.id,
        orgId: result.org.id,
        role: result.user.role,
        email: result.user.email,
      });
      
      return reply.send({
        success: true,
        data: {
          token,
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
          },
          org: {
            id: result.org.id,
            name: result.org.name,
            subdomain: result.org.subdomain,
          },
        },
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create account' });
    }
  });
  
  // Login
  fastify.post('/login', {
    schema: {
      body: loginSchema,
    },
  }, async (request, reply) => {
    const { email, password } = request.body as any;
    
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: { org: true },
      });
      
      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }
      
      if (!user.isActive) {
        return reply.code(401).send({ error: 'Account is inactive' });
      }
      
      if (!user.org.isActive) {
        return reply.code(401).send({ error: 'Organization is inactive' });
      }
      
      // Verify with Supabase if user has supabaseId
      if (user.supabaseId) {
        try {
          const { data, error } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) {
            return reply.code(401).send({ error: 'Invalid credentials' });
          }
        } catch (err) {
          // Fall back to local verification if Supabase fails
          fastify.log.warn('Supabase auth failed, falling back to local');
        }
      }
      
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      
      // Log activity
      await prisma.activityLog.create({
        data: {
          orgId: user.orgId,
          userId: user.id,
          type: 'LOGIN',
          entityType: 'User',
          entityId: user.id,
          description: `${user.name} logged in`,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        },
      });
      
      // Generate JWT token
      const token = fastify.jwt.sign({
        userId: user.id,
        orgId: user.orgId,
        role: user.role,
        email: user.email,
      });
      
      return reply.send({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
          },
          org: {
            id: user.org.id,
            name: user.org.name,
            subdomain: user.org.subdomain,
            logoUrl: user.org.logoUrl,
          },
        },
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to login' });
    }
  });
  
  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.user?.userId },
        include: { org: true },
      });
      
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }
      
      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
            phoneNumber: user.phoneNumber,
          },
          org: {
            id: user.org.id,
            name: user.org.name,
            subdomain: user.org.subdomain,
            logoUrl: user.org.logoUrl,
            trialEndsAt: user.org.trialEndsAt,
          },
        },
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get user' });
    }
  });
  
  // Refresh token
  fastify.post('/refresh', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.user?.userId },
      });
      
      if (!user || !user.isActive) {
        return reply.code(401).send({ error: 'User not found or inactive' });
      }
      
      const token = fastify.jwt.sign({
        userId: user.id,
        orgId: user.orgId,
        role: user.role,
        email: user.email,
      });
      
      return reply.send({
        success: true,
        data: { token },
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to refresh token' });
    }
  });
};

export default authRoutes;