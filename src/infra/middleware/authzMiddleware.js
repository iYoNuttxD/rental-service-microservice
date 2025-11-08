/**
 * Authorization Middleware
 * Checks permissions via OPA
 */
function createAuthzMiddleware(authPolicyClient, logger) {
  return async (req, res, next) => {
    try {
      const input = {
        user: req.user || { id: 'anonymous', roles: [] },
        action: `${req.method.toLowerCase()}:${req.path}`,
        resource: req.path,
        rental: req.body || {}
      };

      const result = await authPolicyClient.authorize(input);

      if (!result.allowed) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      next();
    } catch (error) {
      logger.error('Authz middleware error', { error: error.message });
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

module.exports = createAuthzMiddleware;
