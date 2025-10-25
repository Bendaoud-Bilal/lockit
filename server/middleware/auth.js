// Simplified auth middleware for development
export default function requireAuth(req, res, next) {
  // Get userId from header or use default for testing
  const userId = req.headers['x-user-id'] || '1';
  req.userId = parseInt(userId);
  next();
}