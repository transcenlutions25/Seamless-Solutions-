import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method
  });

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return reply.status(409).send({
          error: 'Duplicate entry',
          message: 'A record with this information already exists'
        });
      case 'P2025':
        return reply.status(404).send({
          error: 'Record not found',
          message: 'The requested record was not found'
        });
      default:
        return reply.status(400).send({
          error: 'Database error',
          message: 'An error occurred while processing your request'
        });
    }
  }

  // Validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation error',
      message: 'Invalid input data',
      details: error.validation
    });
  }

  // JWT errors
  if (error.message.includes('jwt')) {
    return reply.status(401).send({
      error: 'Authentication error',
      message: 'Invalid or expired token'
    });
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  return reply.status(statusCode).send({
    error: 'Internal server error',
    message
  });
}
