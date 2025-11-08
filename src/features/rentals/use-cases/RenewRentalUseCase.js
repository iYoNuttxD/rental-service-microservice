/**
 * RenewRentalUseCase
 * Use case for renewing a rental
 */
class RenewRentalUseCase {
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

  async execute(rentalId, additionalDays) {
    const startTime = Date.now();

    try {
      const rental = await this.transactionService.renewRental(
        rentalId,
        additionalDays
      );

      // Publish event
      await this.eventPublisher.publish('rental.renewed', {
        rentalId: rental.id,
        vehicleId: rental.vehicleId,
        userId: rental.userId,
        status: rental.status,
        endAt: rental.endAt,
        renewedCount: rental.renewedCount
      });

      this.metricsCollector.incrementEventPublished('rental.renewed');
      this.metricsCollector.incrementRentalRenewed();
      this.metricsCollector.observeRentalOperation(
        'renew',
        Date.now() - startTime
      );

      return rental;
    } catch (error) {
      this.logger.error('Failed to renew rental', { 
        rentalId, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = RenewRentalUseCase;
