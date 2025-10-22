import bcrypt from 'bcryptjs';
import { FastifyRequest } from 'fastify';
import { CONSTANTS } from '@seamless/config';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, CONSTANTS.BCRYPT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; email: string; role: string };
    user: AuthUser;
  }
}

export async function authenticate(request: FastifyRequest): Promise<void> {
  try {
    await request.jwtVerify();
  } catch (err) {
    throw new Error('Authentication required');
  }
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest): Promise<void> => {
    await authenticate(request);
    const user = request.user as AuthUser;
    if (!user || !roles.includes(user.role)) {
      throw new Error('Insufficient permissions');
    }
  };
}
