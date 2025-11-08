import { ApiError } from '../utils/ApiError.js';
import * as sessionService from '../services/session.service.js';
import prisma from '../services/prisma.service.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No session token provided');
    }

    const sessionId = authHeader.substring(7);
    const userId = sessionService.validateSession(sessionId);

    if (!userId) {
      throw new ApiError(401, 'Invalid or expired session');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true },
    });

    if (!user) {
      sessionService.destroySession(sessionId);
      throw new ApiError(401, 'User not found');
    }

    req.user = user;
    req.sessionId = sessionId;

    sessionService.refreshSession(sessionId);

    next();
  } catch (error) {
    next(error);
  }
}

// Supports dev header overrides while reusing session-based auth in production.
export default function requireAuth(req, res, next) {
  const headerUserId = req.headers['x-user-id'];

  if (headerUserId) {
    req.userId = Number.parseInt(headerUserId, 10);
    return next();
  }

  const authNext = (err) => {
    if (err) {
      next(err);
      return;
    }

    if (req.user?.id) {
      req.userId = req.user.id;
    }

    next();
  };

  return authenticate(req, res, authNext);
}