import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { createSuccessResponse, createErrorResponse, parsePagination, createPaginatedResponse } from '@seamless/utils';
import { PaginationParams, UpdateUserDTO } from '@seamless/types';
import { requireRole } from '../lib/auth';

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'USER', 'GUEST']).optional(),
});

export default async function userRoutes(fastify: FastifyInstance) {
  // Get all users (admin only)
  fastify.get<{ Querystring: PaginationParams }>('/', {
    onRequest: [requireRole('ADMIN')],
  }, async (request, reply) => {
    try {
      const { page, pageSize, skip, take, sortBy, sortOrder } = parsePagination(request.query);

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.user.count(),
      ]);

      return reply.send(createSuccessResponse(
        createPaginatedResponse(users, total, page, pageSize)
      ));
    } catch (error) {
      return reply.code(500).send(createErrorResponse('Internal server error'));
    }
  });

  // Get user by ID
  fastify.get<{ Params: { id: string } }>('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.params.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projects: true,
              assignedTasks: true,
            },
          },
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

  // Update user
  fastify.patch<{ Params: { id: string }; Body: UpdateUserDTO }>('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const data = updateUserSchema.parse(request.body);

      // Only allow users to update their own profile or admins to update any
      if (request.params.id !== request.user!.id && request.user!.role !== 'ADMIN') {
        return reply.code(403).send(createErrorResponse('Access denied'));
      }

      // Only admins can change roles
      if (data.role && request.user!.role !== 'ADMIN') {
        return reply.code(403).send(createErrorResponse('Only admins can change roles'));
      }

      const user = await prisma.user.update({
        where: { id: request.params.id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          updatedAt: true,
        },
      });

      return reply.send(createSuccessResponse(user, 'User updated successfully'));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send(createErrorResponse(error.errors[0].message));
      }
      return reply.code(500).send(createErrorResponse('Internal server error'));
    }
  });

  // Delete user (admin only)
  fastify.delete<{ Params: { id: string } }>('/:id', {
    onRequest: [requireRole('ADMIN')],
  }, async (request, reply) => {
    try {
      await prisma.user.delete({
        where: { id: request.params.id },
      });

      return reply.send(createSuccessResponse(null, 'User deleted successfully'));
    } catch (error) {
      return reply.code(500).send(createErrorResponse('Internal server error'));
    }
  });
}
