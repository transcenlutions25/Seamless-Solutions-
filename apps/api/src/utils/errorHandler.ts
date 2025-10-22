import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const traceId = request.id;
  
  // Log the error with trace ID
  request.log.error({
    error: error.message,
    stack: error.stack,
    traceId,
    url: request.url,
    method: request.method,
  }, 'Request error');

  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: error.errors,
      traceId,
    });
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return reply.status(409).send({
          error: 'Conflict',
          message: 'A record with this data already exists',
          traceId,
        });
      case 'P2025':
        return reply.status(404).send({
          error: 'Not Found',
          message: 'The requested record was not found',
          traceId,
        });
      default:
        return reply.status(500).send({
          error: 'Database Error',
          message: 'An error occurred while processing your request',
          traceId,
        });
    }
  }

  // JWT errors
  if (error.message.includes('jwt')) {
    return reply.status(401).send({
      error: 'Authentication Error',
      message: 'Invalid or expired token',
      traceId,
    });
  }

  // Rate limit errors
  if (error.statusCode === 429) {
    return reply.status(429).send({
      error: 'Rate Limit Exceeded',
      message: 'Too many requests, please try again later',
      traceId,
    });
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 
    ? 'Internal Server Error' 
    : error.message || 'An error occurred';

  return reply.status(statusCode).send({
    error: statusCode === 500 ? 'Internal Server Error' : 'Error',
    message,
    traceId,
  });
}