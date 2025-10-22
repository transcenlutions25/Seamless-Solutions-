import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { createSuccessResponse, createErrorResponse, parsePagination, createPaginatedResponse } from '@seamless/utils';
import { CreateProjectDTO, UpdateProjectDTO, PaginationParams } from '@seamless/types';

const createProjectSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500),
});

const updateProjectSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(),
});

export default async function projectRoutes(fastify: FastifyInstance) {
  // Get all projects
  fastify.get<{ Querystring: PaginationParams }>('/', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { page, pageSize, skip, take, sortBy, sortOrder } = parsePagination(request.query);

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where: {
            OR: [
              { ownerId: request.user!.id },
              { members: { some: { id: request.user!.id } } },
            ],
          },
          include: {
            owner: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: { tasks: true, members: true },
            },
          },
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.project.count({
          where: {
            OR: [
              { ownerId: request.user!.id },
              { members: { some: { id: request.user!.id } } },
            ],
          },
        }),
      ]);

      return reply.send(createSuccessResponse(
        createPaginatedResponse(projects, total, page, pageSize)
      ));
    } catch (error) {
      return reply.code(500).send(createErrorResponse('Internal server error'));
    }
  });

  // Get project by ID
  fastify.get<{ Params: { id: string } }>('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const project = await prisma.project.findUnique({
        where: { id: request.params.id },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          tasks: {
            include: {
              assignee: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          members: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!project) {
        return reply.code(404).send(createErrorResponse('Project not found'));
      }

      // Check if user has access
      const hasAccess = project.ownerId === request.user!.id ||
        project.members.some(m => m.id === request.user!.id);

      if (!hasAccess) {
        return reply.code(403).send(createErrorResponse('Access denied'));
      }

      return reply.send(createSuccessResponse(project));
    } catch (error) {
      return reply.code(500).send(createErrorResponse('Internal server error'));
    }
  });

  // Create project
  fastify.post<{ Body: CreateProjectDTO }>('/', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const data = createProjectSchema.parse(request.body);

      const project = await prisma.project.create({
        data: {
          ...data,
          ownerId: request.user!.id,
          members: {
            connect: { id: request.user!.id },
          },
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return reply.code(201).send(createSuccessResponse(project, 'Project created successfully'));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send(createErrorResponse(error.errors[0].message));
      }
      return reply.code(500).send(createErrorResponse('Internal server error'));
    }
  });

  // Update project
  fastify.patch<{ Params: { id: string }; Body: UpdateProjectDTO }>('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const data = updateProjectSchema.parse(request.body);

      const project = await prisma.project.findUnique({
        where: { id: request.params.id },
      });

      if (!project) {
        return reply.code(404).send(createErrorResponse('Project not found'));
      }

      if (project.ownerId !== request.user!.id) {
        return reply.code(403).send(createErrorResponse('Only project owner can update'));
      }

      const updated = await prisma.project.update({
        where: { id: request.params.id },
        data,
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return reply.send(createSuccessResponse(updated, 'Project updated successfully'));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send(createErrorResponse(error.errors[0].message));
      }
      return reply.code(500).send(createErrorResponse('Internal server error'));
    }
  });

  // Delete project
  fastify.delete<{ Params: { id: string } }>('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const project = await prisma.project.findUnique({
        where: { id: request.params.id },
      });

      if (!project) {
        return reply.code(404).send(createErrorResponse('Project not found'));
      }

      if (project.ownerId !== request.user!.id) {
        return reply.code(403).send(createErrorResponse('Only project owner can delete'));
      }

      await prisma.project.delete({
        where: { id: request.params.id },
      });

      return reply.send(createSuccessResponse(null, 'Project deleted successfully'));
    } catch (error) {
      return reply.code(500).send(createErrorResponse('Internal server error'));
    }
  });
}
