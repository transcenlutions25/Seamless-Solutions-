import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { hashPassword, comparePassword } from '../lib/auth';
import { isValidEmail, isValidPassword, createSuccessResponse, createErrorResponse } from '@seamless/utils';
import { LoginDTO, CreateUserDTO } from '@seamless/types';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export default async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post<{ Body: CreateUserDTO }>('/register', async (request, reply) => {
    try {
      const { email, password, name } = registerSchema.parse(request.body);

      if (!isValidEmail(email)) {
        return reply.code(400).send(createErrorResponse('Invalid email format'));
      }

      const passwordValidation = isValidPassword(password);
      if (!passwordValidation.valid) {
        return reply.code(400).send(createErrorResponse(passwordValidation.message!));
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.code(409).send(createErrorResponse('User already exists'));
      }

      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return reply.code(201).send(
        createSuccessResponse({
          user,
          token,
        }, 'User registered successfully')
      );
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send(createErrorResponse(error.errors[0].message));
      }
      return reply.code(500).send(createErrorResponse('Internal server error'));
    }
  });

  // Login
  fastify.post<{ Body: LoginDTO }>('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.code(401).send(createErrorResponse('Invalid credentials'));
      }

      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return reply.code(401).send(createErrorResponse('Invalid credentials'));
      }

      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return reply.send(
        createSuccessResponse({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
          },
          token,
        }, 'Login successful')
      );
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send(createErrorResponse(error.errors[0].message));
      }
      return reply.code(500).send(createErrorResponse('Internal server error'));
    }
  });

  // Get current user
  fastify.get('/me', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.user!.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return reply.code(404).send(createErrorResponse('User not found'));
      }

      return reply.send(createSuccessResponse(user));
    } catch (error) {
      return reply.code(500).send(createErrorResponse('Internal server error'));
    }
  });

  // Refresh token
  fastify.post('/refresh', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const token = fastify.jwt.sign({
        id: request.user!.id,
        email: request.user!.email,
        role: request.user!.role,
      });

      return reply.send(createSuccessResponse({ token }, 'Token refreshed'));
    } catch (error) {
      return reply.code(500).send(createErrorResponse('Internal server error'));
    }
  });
}
