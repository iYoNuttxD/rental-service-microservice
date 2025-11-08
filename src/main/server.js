const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const fs = require('fs');
const path = require('path');

const Container = require('./container');
const createAuthMiddleware = require('../infra/middleware/authMiddleware');
const createAuthzMiddleware = require('../infra/middleware/authzMiddleware');
const createRequestLoggerMiddleware = require('../infra/middleware/requestLoggerMiddleware');
const createErrorHandler = require('../infra/middleware/errorHandler');
const { setupRentalRoutes, setupAvailabilityRoutes } = require('../features/rentals/handlers/routes');

async function createApp () {
  // Initialize container
  const container = new Container();
  await container.initialize();

  const logger = container.get('logger');
  const metricsCollector = container.get('metricsCollector');
  const jwtAuthVerifier = container.get('jwtAuthVerifier');
  const authPolicyClient = container.get('authPolicyClient');
  const rentalHandlers = container.get('rentalHandlers');

  // Create Express app
  const app = express();

  // Basic middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Custom middleware
  const authRequired = process.env.AUTH_JWT_REQUIRED === 'true';
  const authMiddleware = createAuthMiddleware(jwtAuthVerifier, authRequired, logger);
  const authzMiddleware = createAuthzMiddleware(authPolicyClient, logger);
  const requestLoggerMiddleware = createRequestLoggerMiddleware(logger, metricsCollector);

  app.use(requestLoggerMiddleware);

  // Health check
// Health check com status dos cores externos
  app.get('/api/v1/health', async (req, res) => {
    const result = {
      service: 'rental-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dependencies: {}
    };
  
    // MongoDB
    try {
      const mongoConnection = container.get('mongoConnection');
      const db = mongoConnection.getDb();
      await db.command({ ping: 1 });
  
      result.dependencies.mongodb = {
        status: 'up',
        dbName: db.databaseName
      };
    } catch (error) {
      result.dependencies.mongodb = {
        status: 'down',
        error: error.message
      };
      result.status = 'degraded';
    }
  
    // NATS
    try {
      const eventPublisher = container.get('eventPublisher');
      const isConnected = !!(eventPublisher && eventPublisher.nc);
  
      result.dependencies.nats = isConnected
        ? { status: 'up', url: eventPublisher.url }
        : { status: 'down', message: 'NATS not connected' };
  
      if (!isConnected) {
        result.status = 'degraded';
      }
    } catch (error) {
      result.dependencies.nats = {
        status: 'down',
        error: error.message
      };
      result.status = 'degraded';
    }
  
    // Payment Gateway
    try {
      const paymentGateway = container.get('paymentGateway');
  
      if (paymentGateway && paymentGateway.baseUrl && paymentGateway.apiKey) {
        result.dependencies.paymentGateway = {
          status: 'configured',
          baseUrl: paymentGateway.baseUrl
          // aqui é intencionalmente only-config, sem chamar o provider real pra não cobrar/pingar em produção
        };
      } else {
        result.dependencies.paymentGateway = {
          status: 'not_configured'
        };
        result.status = 'degraded';
      }
    } catch (error) {
      result.dependencies.paymentGateway = {
        status: 'down',
        error: error.message
      };
      result.status = 'degraded';
    }
  
    // OPA (Auth Policy)
    try {
      const authPolicyClient = container.get('authPolicyClient');
  
      if (authPolicyClient && authPolicyClient.opaUrl && authPolicyClient.policyPath) {
        result.dependencies.opa = {
          status: 'configured',
          url: authPolicyClient.opaUrl,
          policyPath: authPolicyClient.policyPath
        };
      } else {
        result.dependencies.opa = {
          status: 'not_configured'
        };
        // não marco como degraded obrigatório, depende da tua estratégia
      }
    } catch (error) {
      result.dependencies.opa = {
        status: 'down',
        error: error.message
      };
      result.status = 'degraded';
    }
  
    // Auth / JWT
    try {
      const jwtAuthVerifier = container.get('jwtAuthVerifier');
      const authRequired = process.env.AUTH_JWT_REQUIRED === 'true';
  
      result.dependencies.auth = {
        status: authRequired ? 'required' : 'optional',
        jwksUri: jwtAuthVerifier?.config?.jwksUri || null,
        issuer: jwtAuthVerifier?.config?.issuer || null,
        audience: jwtAuthVerifier?.config?.audience || null
      };
    } catch (error) {
      result.dependencies.auth = {
        status: 'misconfigured',
        error: error.message
      };
      result.status = 'degraded';
    }
  
    const httpStatus = result.status === 'ok' ? 200 : 503;
    return res.status(httpStatus).json(result);
  });

  // Metrics endpoint
  app.get('/api/v1/metrics', async (req, res) => {
    try {
      const metrics = await metricsCollector.getMetrics();
      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    } catch (error) {
      logger.error('Failed to get metrics', { error: error.message });
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  });

  // Swagger documentation
  try {
    const openapiPath = path.join(__dirname, '../../docs/openapi.yaml');
    if (fs.existsSync(openapiPath)) {
      const openapiContent = fs.readFileSync(openapiPath, 'utf8');
      const openapiSpec = YAML.parse(openapiContent);

      app.use('/api/v1/api-docs', swaggerUi.serve);
      app.get('/api/v1/api-docs', swaggerUi.setup(openapiSpec, {
        customCss: '.swagger-ui .topbar { display: none }'
      }));

      app.get('/api/v1/api-docs/openapi.yaml', (req, res) => {
        res.set('Content-Type', 'text/yaml');
        res.send(openapiContent);
      });

      logger.info('Swagger documentation enabled');
    } else {
      logger.warn('OpenAPI spec not found, serving fallback');
      app.get('/api/v1/api-docs', (req, res) => {
        res.json({
          message: 'OpenAPI documentation not available',
          endpoints: [
            'POST /api/v1/rentals',
            'POST /api/v1/rentals/:id/renew',
            'POST /api/v1/rentals/:id/end',
            'POST /api/v1/rentals/:id/return',
            'GET /api/v1/rentals',
            'GET /api/v1/rentals/:id',
            'GET /api/v1/vehicles/availability',
            'GET /api/v1/health',
            'GET /api/v1/metrics'
          ]
        });
      });
    }
  } catch (error) {
    logger.error('Failed to load OpenAPI spec', { error: error.message });
  }

  // API routes
  app.use('/api/v1/rentals', setupRentalRoutes(rentalHandlers, authMiddleware, authzMiddleware));
  app.use('/api/v1/vehicles', setupAvailabilityRoutes(rentalHandlers, authMiddleware));

  // Error handler (must be last)
  app.use(createErrorHandler(logger));

  return { app, container };
}

async function startServer () {
  try {
    const { app, container } = await createApp();
    const logger = container.get('logger');
    const port = process.env.PORT || 3015;

    const server = app.listen(port, () => {
      logger.info('Rental service started', {
        port,
        env: process.env.NODE_ENV || 'development'
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await container.cleanup();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(async () => {
        await container.cleanup();
        process.exit(0);
      });
    });

    return { app, server, container };
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
