/**
 * CreateRentalUseCase
 * Use case for initiating a new rental
 */
class CreateRentalUseCase {
  constructor(
    transactionService,
    paymentGateway,
    eventPublisher,
    logger,
    metricsCollector
  ) {
    this.transactionService = transactionService;
    this.paymentGateway = paymentGateway;
    this.eventPublisher = eventPublisher;
    this.logger = logger;
    this.metricsCollector = metricsCollector;
  }

  async execute(data) {
    const startTime = Date.now();

    try {
      const { vehicleId, userId, startAt, endAt, paymentAmount } = data;

      // Initiate rental
      const rental = await this.transactionService.initiateRental(
        vehicleId,
        userId,
        new Date(startAt),
        new Date(endAt)
      );

      // Create payment charge
      let paymentRef = null;
      try {
        const payment = await this.paymentGateway.createCharge(
          paymentAmount,
          rental.id
        );
        paymentRef = payment.id;
        this.metricsCollector.incrementPaymentAttempt('success');

        // Activate rental after successful payment
        await this.transactionService.activateRental(rental.id, paymentRef);
        rental.status = 'active';
        rental.paymentRef = paymentRef;
      } catch (paymentError) {
        this.logger.error('Payment failed', { 
          rentalId: rental.id, 
          error: paymentError.message 
        });
        this.metricsCollector.incrementPaymentAttempt('failed');
        // Rental remains in pending status
      }

      // Publish event
      await this.eventPublisher.publish('rental.started', {
        rentalId: rental.id,
        vehicleId: rental.vehicleId,
        userId: rental.userId,
        status: rental.status,
        startAt: rental.startAt,
        endAt: rental.endAt
      });

      this.metricsCollector.incrementEventPublished('rental.started');
      this.metricsCollector.incrementRentalStarted(rental.status);
      this.metricsCollector.observeRentalOperation(
        'create',
        Date.now() - startTime
      );

      return rental;
    } catch (error) {
      this.logger.error('Failed to create rental', { error: error.message });
      this.metricsCollector.incrementRentalStarted('failed');
      throw error;
    }
  }
}

module.exports = CreateRentalUseCase;
