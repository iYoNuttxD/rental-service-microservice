require('dotenv').config();

// Infrastructure
const Logger = require('../infra/logger/Logger');
const MetricsCollector = require('../infra/metrics/MetricsCollector');
const MongoConnection = require('../infra/db/MongoConnection');
const ensureIndexes = require('../infra/db/ensureIndexes');
const MongoRentalRepository = require('../infra/adapters/MongoRentalRepository');
const MongoVehicleRepository = require('../infra/adapters/MongoVehicleRepository');
const PaymentIntegrationAdapter = require('../infra/adapters/PaymentIntegrationAdapter');
const NatsEventPublisher = require('../infra/adapters/NatsEventPublisher');
const AuthPolicyClient = require('../infra/adapters/AuthPolicyClient');
const JwtAuthVerifier = require('../infra/adapters/JwtAuthVerifier');

// Domain Services
const VehicleInventoryService = require('../domain/services/VehicleInventoryService');
const RentalTransactionService = require('../domain/services/RentalTransactionService');

// Use Cases
const CreateRentalUseCase = require('../features/rentals/use-cases/CreateRentalUseCase');
const RenewRentalUseCase = require('../features/rentals/use-cases/RenewRentalUseCase');
const EndRentalUseCase = require('../features/rentals/use-cases/EndRentalUseCase');
const ReturnRentalUseCase = require('../features/rentals/use-cases/ReturnRentalUseCase');
const ListRentalsUseCase = require('../features/rentals/use-cases/ListRentalsUseCase');
const GetRentalUseCase = require('../features/rentals/use-cases/GetRentalUseCase');
const CheckVehicleAvailabilityUseCase = require('../features/rentals/use-cases/CheckVehicleAvailabilityUseCase');

// Handlers
const RentalHandlers = require('../features/rentals/handlers/RentalHandlers');

/**
 * Composition Root - Dependency Injection Container
 */
class Container {
  constructor () {
    this.instances = {};
  }

  async initialize () {
    // Logger
    const logger = new Logger(process.env.LOG_LEVEL || 'info');
    this.instances.logger = logger;

    // Metrics
    const metricsCollector = new MetricsCollector();
    this.instances.metricsCollector = metricsCollector;

    // MongoDB
    const mongoUri = process.env.RENTALS_MONGO_URI || process.env.MONGODB_URI;
    const dbName = process.env.RENTALS_MONGO_DB_NAME || 'rentals_db';
    const mongoConnection = new MongoConnection(mongoUri, dbName, logger);
    await mongoConnection.connect();
    this.instances.mongoConnection = mongoConnection;

    // Ensure indexes
    const retentionDays = parseInt(process.env.RETENTION_DAYS) || 90;
    const eventInboxTtlDays = parseInt(process.env.EVENT_INBOX_TTL_DAYS) || 30;
    await ensureIndexes(mongoConnection.getDb(), logger, retentionDays, eventInboxTtlDays);

    // Repositories
    const rentalRepository = new MongoRentalRepository(mongoConnection, logger);
    const vehicleRepository = new MongoVehicleRepository(mongoConnection, logger);
    this.instances.rentalRepository = rentalRepository;
    this.instances.vehicleRepository = vehicleRepository;

    // External Services
    const paymentGateway = new PaymentIntegrationAdapter(
      process.env.PAYMENT_GATEWAY_BASE_URL,
      process.env.PAYMENT_GATEWAY_API_KEY,
      parseInt(process.env.PAYMENT_TIMEOUT_MS) || 5000,
      parseInt(process.env.PAYMENT_RETRY_ATTEMPTS) || 2,
      logger
    );
    this.instances.paymentGateway = paymentGateway;

    const eventPublisher = new NatsEventPublisher(
      process.env.NATS_URL || 'nats://localhost:4222',
      logger
    );
    try {
      await eventPublisher.connect();
    } catch (error) {
      logger.warn('NATS connection failed, continuing without event publishing', {
        error: error.message
      });
    }
    this.instances.eventPublisher = eventPublisher;

    const authPolicyClient = new AuthPolicyClient(
      process.env.OPA_URL || 'http://localhost:8181',
      process.env.OPA_POLICY_PATH || '/v1/data/rentals/allow',
      parseInt(process.env.OPA_TIMEOUT_MS) || 3000,
      process.env.OPA_FAIL_OPEN === 'true',
      logger
    );
    this.instances.authPolicyClient = authPolicyClient;

    const jwtAuthVerifier = new JwtAuthVerifier(
      {
        jwksUri: process.env.AUTH_JWKS_URI,
        secret: process.env.AUTH_JWT_SECRET,
        issuer: process.env.AUTH_JWT_ISSUER,
        audience: process.env.AUTH_JWT_AUDIENCE
      },
      logger
    );
    this.instances.jwtAuthVerifier = jwtAuthVerifier;

    // Domain Services
    const inventoryService = new VehicleInventoryService(
      vehicleRepository,
      rentalRepository
    );
    const transactionService = new RentalTransactionService(
      rentalRepository,
      vehicleRepository,
      inventoryService
    );
    this.instances.inventoryService = inventoryService;
    this.instances.transactionService = transactionService;

    // Use Cases
    const createRentalUseCase = new CreateRentalUseCase(
      transactionService,
      paymentGateway,
      eventPublisher,
      logger,
      metricsCollector
    );
    const renewRentalUseCase = new RenewRentalUseCase(
      transactionService,
      eventPublisher,
      logger,
      metricsCollector
    );
    const endRentalUseCase = new EndRentalUseCase(
      transactionService,
      eventPublisher,
      logger,
      metricsCollector
    );
    const returnRentalUseCase = new ReturnRentalUseCase(
      transactionService,
      eventPublisher,
      logger,
      metricsCollector
    );
    const listRentalsUseCase = new ListRentalsUseCase(rentalRepository, logger);
    const getRentalUseCase = new GetRentalUseCase(rentalRepository, logger);
    const checkAvailabilityUseCase = new CheckVehicleAvailabilityUseCase(
      inventoryService,
      logger
    );

    this.instances.useCases = {
      createRental: createRentalUseCase,
      renewRental: renewRentalUseCase,
      endRental: endRentalUseCase,
      returnRental: returnRentalUseCase,
      listRentals: listRentalsUseCase,
      getRental: getRentalUseCase,
      checkAvailability: checkAvailabilityUseCase
    };

    // Handlers
    const rentalHandlers = new RentalHandlers(this.instances.useCases, logger);
    this.instances.rentalHandlers = rentalHandlers;

    logger.info('Container initialized successfully');
  }

  get (name) {
    return this.instances[name];
  }

  async cleanup () {
    const logger = this.instances.logger;

    if (this.instances.eventPublisher) {
      await this.instances.eventPublisher.close();
    }

    if (this.instances.mongoConnection) {
      await this.instances.mongoConnection.disconnect();
    }

    logger.info('Container cleanup completed');
  }
}

module.exports = Container;
