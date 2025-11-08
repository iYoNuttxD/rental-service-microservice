/**
 * EndRentalUseCase
 * Use case for ending a rental
 */
class EndRentalUseCase {
  constructor(
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

  async execute(rentalId) {
    const startTime = Date.now();

    try {
      const rental = await this.transactionService.endRental(rentalId);

      // Publish event
      await this.eventPublisher.publish('rental.ended', {
        rentalId: rental.id,
        vehicleId: rental.vehicleId,
        userId: rental.userId,
        status: rental.status
      });

      this.metricsCollector.incrementEventPublished('rental.ended');
      this.metricsCollector.incrementRentalEnded();
      this.metricsCollector.observeRentalOperation(
        'end',
        Date.now() - startTime
      );

      return rental;
    } catch (error) {
      this.logger.error('Failed to end rental', { 
        rentalId, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = EndRentalUseCase;
