const { v4: uuidv4 } = require('uuid');

/**
 * Request Logger Middleware
 * Adds correlation/trace IDs and logs requests
 */
function createRequestLoggerMiddleware (logger, metricsCollector) {
  return (req, res, next) => {
    const startTime = Date.now();
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    const traceId = req.headers['x-trace-id'] || uuidv4();

    req.correlationId = correlationId;
    req.traceId = traceId;

    res.setHeader('X-Correlation-Id', correlationId);
    res.setHeader('X-Trace-Id', traceId);

    logger.info('Incoming request', {
      method: req.method,
      path: req.path,
      correlationId,
      traceId
    });

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      logger.info('Request completed', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration,
        correlationId,
        traceId
      });

      metricsCollector.incrementHttpRequest(req.method, req.path, res.statusCode);
      metricsCollector.observeHttpRequest(req.method, req.path, duration);
    });

    next();
  };
}

module.exports = createRequestLoggerMiddleware;
