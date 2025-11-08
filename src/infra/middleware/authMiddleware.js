/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user info to request
 */
function createAuthMiddleware (jwtVerifier, authRequired, logger) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        if (authRequired) {
          return res.status(401).json({ error: 'No authorization header provided' });
        }
        return next();
      }

      const result = await jwtVerifier.verify(authHeader);

      if (!result.valid) {
        if (authRequired) {
          return res.status(401).json({ error: 'Invalid token' });
        }
        return next();
      }

      req.user = {
        id: result.userId,
        roles: result.roles,
        payload: result.payload
      };

      next();
    } catch (error) {
      logger.error('Auth middleware error', { error: error.message });
      if (authRequired) {
        return res.status(401).json({ error: 'Authentication failed' });
      }
      next();
    }
  };
}

module.exports = createAuthMiddleware;
