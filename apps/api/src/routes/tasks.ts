import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { createSuccessResponse, createErrorResponse, parsePagination, createPaginatedResponse } from '@seamless/utils';
import { CreateTaskDTO, UpdateTaskDTO, PaginationParams } from '@seamless/types';

const createTaskSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000),
  projectId: z.string().uuid(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
});

export default async function taskRoutes(fastify: FastifyInstance) {
  // Get all tasks
  fastify.get<{ Querystring: PaginationParams & { projectId?: string } }>('/', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { page, pageSize, skip, take, sortBy, sortOrder } = parsePagination(request.query);
      const { projectId } = request.query;

      const where = {
        ...(projectId && { projectId }),
        project: {
          OR: [
            { ownerId: request.user!.id },
            { members: { some: { id: request.user!.id } } },
          ],
        },
      };

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          include: {
            project: {
              select: { id: true, name: true },
            },
            assignee: {
              select: { id: true, name: true, email: true },
            },
          },
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.task.count({ where }),
      ]);

      return reply.send(createSuccessResponse(
        createPaginatedResponse(tasks, total, page, pageSize)
      ));
    } catch (error) {
      return reply.code(500).send(createErrorResponse('Internal server error'));
    }
  });

  // Get task by ID
  fastify.get<{ Params: { id: string } }>('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: request.params.id },
        include: {
          project: {
            include: {
              owner: {
                select: { id: true, name: true, email: true },
              },
              members: {
                select: { id: true },
              },
            },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!task) {
        return reply.code(404).send(createErrorResponse('Task not found'));
      }

      // Check if user has access
      const hasAccess = task.project.ownerId === request.user!.id ||
        task.project.members.some(m => m.id === request.user!.id);

      if (!hasAccess) {
        return reply.code(403).send(createErrorResponse('Access denied'));
      }

      return reply.send(createSuccessResponse(task));
    } catch (error) {
      return reply.code(500).send(createErrorResponse('Internal server error'));
    }
  });

  // Create task
  fastify.post<{ Body: CreateTaskDTO }>('/', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const data = createTaskSchema.parse(request.body);

      // Verify user has access to project
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
        include: { members: { select: { id: true } } },
      });

      if (!project) {
        return reply.code(404).send(createErrorResponse('Project not found'));
      }

      const hasAccess = project.ownerId === request.user!.id ||
        project.members.some(m => m.id === request.user!.id);

      if (!hasAccess) {
        return reply.code(403).send(createErrorResponse('Access denied'));
      }

      const task = await prisma.task.create({
        data,
        include: {
          project: {
            select: { id: true, name: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return reply.code(201).send(createSuccessResponse(task, 'Task created successfully'));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send(createErrorResponse(error.errors[0].message));
      }
      return reply.code(500).send(createErrorResponse('Internal server error'));
    }
  });

  // Update task
  fastify.patch<{ Params: { id: string }; Body: UpdateTaskDTO }>('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const data = updateTaskSchema.parse(request.body);

      const task = await prisma.task.findUnique({
        where: { id: request.params.id },
        include: {
          project: {
            include: { members: { select: { id: true } } },
          },
        },
      });

      if (!task) {
        return reply.code(404).send(createErrorResponse('Task not found'));
      }

      const hasAccess = task.project.ownerId === request.user!.id ||
        task.project.members.some(m => m.id === request.user!.id);

      if (!hasAccess) {
        return reply.code(403).send(createErrorResponse('Access denied'));
      }

      const updated = await prisma.task.update({
        where: { id: request.params.id },
        data,
        include: {
          project: {
            select: { id: true, name: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return reply.send(createSuccessResponse(updated, 'Task updated successfully'));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send(createErrorResponse(error.errors[0].message));
      }
      return reply.code(500).send(createErrorResponse('Internal server error'));
    }
  });

  // Delete task
  fastify.delete<{ Params: { id: string } }>('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: request.params.id },
        include: {
          project: true,
        },
      });

      if (!task) {
        return reply.code(404).send(createErrorResponse('Task not found'));
      }

      if (task.project.ownerId !== request.user!.id) {
        return reply.code(403).send(createErrorResponse('Only project owner can delete tasks'));
      }

      await prisma.task.delete({
        where: { id: request.params.id },
      });

      return reply.send(createSuccessResponse(null, 'Task deleted successfully'));
    } catch (error) {
      return reply.code(500).send(createErrorResponse('Internal server error'));
    }
  });
}
