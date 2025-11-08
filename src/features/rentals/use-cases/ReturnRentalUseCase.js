/**
 * ReturnRentalUseCase
 * Use case for returning a rental
 */
class ReturnRentalUseCase {
  constructor (
    transactionService,
    eventPublisher,
    logger,
    metricsCollector
  ) {
    this.transactionService = transactionService;
    this.eventPublisher = eventPublisher;
    this.logger = logger;
    this.metricsCollector = metricsCollector;
  }

  async execute (rentalId) {
    const startTime = Date.now();

    try {
      const rental = await this.transactionService.returnRental(rentalId);

      // Publish event
      await this.eventPublisher.publish('rental.returned', {
        rentalId: rental.id,
        vehicleId: rental.vehicleId,
        userId: rental.userId,
        status: rental.status,
        processedAt: new Date()
      });

      this.metricsCollector.incrementEventPublished('rental.returned');
      this.metricsCollector.incrementRentalReturned();
      this.metricsCollector.observeRentalOperation(
        'return',
        Date.now() - startTime
      );

      return rental;
    } catch (error) {
      this.logger.error('Failed to return rental', {
        rentalId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = ReturnRentalUseCase;
