/**
 * Error Handler Middleware
 * Standardized error response format
 */
function createErrorHandler(logger) {
  return (err, req, res, next) => {
    logger.error('Request error', {
      error: err.message,
      stack: err.stack,
      correlationId: req.correlationId,
      traceId: req.traceId
    });

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
      error: message,
      correlationId: req.correlationId,
      traceId: req.traceId
    });
  };
}

module.exports = createErrorHandler;
