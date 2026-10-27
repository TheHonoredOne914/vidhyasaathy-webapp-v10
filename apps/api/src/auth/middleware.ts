import type { Me, Role } from '@vidhyasaathy/contracts';
import type { FastifyRequest } from 'fastify';
import { ApiException } from '../errors.ts';

declare module 'fastify' {
  interface FastifyRequest {
    auth: Me | null;
    sessionHash: string | null;
  }

  interface FastifyContextConfig {
    public?: boolean;
  }
}

export function requireAuth(request: FastifyRequest): Me {
  if (!request.auth) throw new ApiException(401, 'UNAUTHENTICATED', 'Sign in to continue.');
  return request.auth;
}

export function requireRole(...roles: Role[]) {
  return async (request: FastifyRequest): Promise<void> => {
    if (!roles.includes(requireAuth(request).profile.role)) {
      throw new ApiException(403, 'FORBIDDEN', 'Your role cannot access this resource.');
    }
  };
}

export function requireSchool(getSchoolId: (request: FastifyRequest) => string) {
  return async (request: FastifyRequest): Promise<void> => {
    if (requireAuth(request).school.id !== getSchoolId(request)) {
      throw new ApiException(403, 'SCHOOL_FORBIDDEN', 'You cannot access another school.');
    }
  };
}
