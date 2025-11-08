/**
 * GetRentalUseCase
 * Use case for getting a single rental by ID
 */
class GetRentalUseCase {
  constructor(rentalRepository, logger) {
    this.rentalRepository = rentalRepository;
    this.logger = logger;
  }

  async execute(rentalId) {
    try {
      const rental = await this.rentalRepository.findById(rentalId);
      
      if (!rental) {
        const error = new Error('Rental not found');
        error.statusCode = 404;
        throw error;
      }

      return rental;
    } catch (error) {
      this.logger.error('Failed to get rental', { 
        rentalId, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = GetRentalUseCase;
