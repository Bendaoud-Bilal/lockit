import crypto from "crypto";

// In-memory session store
const sessions = new Map();

export function createSession(userId) {
  const sessionId = crypto.randomBytes(32).toString("hex");

  sessions.set(sessionId, {
    userId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  });

  return sessionId;
}

export function validateSession(sessionId) {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  // Update last activity
  session.lastActivity = Date.now();

  return session.userId;
}


export function destroySession(sessionId) {
  sessions.delete(sessionId);
}

export function refreshSession(sessionId) {
  const session = sessions.get(sessionId);

  if (session) {
    session.lastActivity = Date.now();
  }
}

// Cleanup expired sessions periodically
setInterval(() => {
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  for (const [sessionId, session] of sessions.entries()) {
    if (session.lastActivity < ninetyDaysAgo) {
      sessions.delete(sessionId);
    }
  }
}, 24 * 60 * 60 * 1000); // Run daily
