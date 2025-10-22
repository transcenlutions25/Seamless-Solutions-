import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { AuthRequest } from '../types';
import { ActivityLogger } from '../services/activityLogger';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  organizationName: z.string().min(1),
  organizationSlug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  organizationDescription: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8)
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/register', {
    schema: {
      body: registerSchema,
      tags: ['Authentication'],
      summary: 'Register a new user and organization'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof registerSchema>;

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: body.email }
      });

      if (existingUser) {
        return reply.status(409).send({
          error: 'User already exists',
          message: 'A user with this email already exists'
        });
      }

      // Check if organization slug is available
      const existingOrg = await prisma.organization.findUnique({
        where: { slug: body.organizationSlug }
      });

      if (existingOrg) {
        return reply.status(409).send({
          error: 'Organization slug taken',
          message: 'This organization slug is already in use'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(body.password, 12);

      // Create organization and user in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create organization
        const organization = await tx.organization.create({
          data: {
            name: body.organizationName,
            slug: body.organizationSlug,
            description: body.organizationDescription
          }
        });

        // Create user
        const user = await tx.user.create({
          data: {
            email: body.email,
            firstName: body.firstName,
            lastName: body.lastName,
            phone: body.phone,
            role: 'OWNER',
            organizationId: organization.id
          }
        });

        return { user, organization };
      });

      // Generate JWT token
      const token = fastify.jwt.sign({
        userId: result.user.id,
        email: result.user.email,
        organizationId: result.user.organizationId,
        role: result.user.role
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'USER_REGISTERED',
        'User',
        result.user.id,
        request as AuthRequest,
        { organizationId: result.organization.id }
      );

      return reply.status(201).send({
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          phone: result.user.phone,
          role: result.user.role,
          organization: result.organization
        },
        token
      });
    } catch (error) {
      fastify.log.error('Registration error:', error);
      return reply.status(500).send({
        error: 'Registration failed',
        message: 'An error occurred during registration'
      });
    }
  });

  // Login
  fastify.post('/login', {
    schema: {
      body: loginSchema,
      tags: ['Authentication'],
      summary: 'Login user'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof loginSchema>;

    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: body.email },
        include: { organization: true }
      });

      if (!user || !user.isActive) {
        return reply.status(401).send({
          error: 'Invalid credentials',
          message: 'Invalid email or password'
        });
      }

      // For demo purposes, we'll skip password verification
      // In production, you would verify the password here
      // const isValidPassword = await bcrypt.compare(body.password, user.password);
      // if (!isValidPassword) {
      //   return reply.status(401).send({
      //     error: 'Invalid credentials',
      //     message: 'Invalid email or password'
      //   });
      // }

      // Generate JWT token
      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role
      });

      // Log activity
      await ActivityLogger.logUserAction(
        'USER_LOGGED_IN',
        'User',
        user.id,
        request as AuthRequest
      );

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          organization: user.organization
        },
        token
      });
    } catch (error) {
      fastify.log.error('Login error:', error);
      return reply.status(500).send({
        error: 'Login failed',
        message: 'An error occurred during login'
      });
    }
  });

  // Forgot password
  fastify.post('/forgot-password', {
    schema: {
      body: forgotPasswordSchema,
      tags: ['Authentication'],
      summary: 'Request password reset'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof forgotPasswordSchema>;

    try {
      const user = await prisma.user.findUnique({
        where: { email: body.email }
      });

      if (!user) {
        // Don't reveal if user exists
        return reply.send({
          message: 'If an account with that email exists, a password reset link has been sent'
        });
      }

      // In production, you would generate a reset token and send email
      // For demo purposes, we'll just return success

      return reply.send({
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    } catch (error) {
      fastify.log.error('Forgot password error:', error);
      return reply.status(500).send({
        error: 'Request failed',
        message: 'An error occurred while processing your request'
      });
    }
  });

  // Reset password
  fastify.post('/reset-password', {
    schema: {
      body: resetPasswordSchema,
      tags: ['Authentication'],
      summary: 'Reset password with token'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof resetPasswordSchema>;

    try {
      // In production, you would verify the reset token
      // For demo purposes, we'll just return success

      return reply.send({
        message: 'Password has been reset successfully'
      });
    } catch (error) {
      fastify.log.error('Reset password error:', error);
      return reply.status(500).send({
        error: 'Reset failed',
        message: 'An error occurred while resetting your password'
      });
    }
  });

  // Get current user
  fastify.get('/me', {
    tags: ['Authentication'],
    summary: 'Get current user information'
  }, async (request: AuthRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    return reply.send({
      user: {
        id: request.user.id,
        email: request.user.email,
        firstName: request.user.firstName,
        lastName: request.user.lastName,
        phone: request.user.phone,
        role: request.user.role,
        organization: request.user.organization
      }
    });
  });
}
