/**
 * ListRentalsUseCase
 * Use case for listing rentals with filters
 */
class ListRentalsUseCase {
  constructor(rentalRepository, logger) {
    this.rentalRepository = rentalRepository;
    this.logger = logger;
  }

  async execute(filters, options) {
    try {
      const result = await this.rentalRepository.findAll(filters, options);
      return result;
    } catch (error) {
      this.logger.error('Failed to list rentals', { error: error.message });
      throw error;
    }
  }
}

module.exports = ListRentalsUseCase;
