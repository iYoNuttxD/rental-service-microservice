const { v4: uuidv4 } = require('uuid');
const Rental = require('../entities/Rental');

/**
 * RentalTransactionService
 * Domain service for rental transaction business logic
 */
class RentalTransactionService {
  constructor (rentalRepository, vehicleRepository, inventoryService) {
    this.rentalRepository = rentalRepository;
    this.vehicleRepository = vehicleRepository;
    this.inventoryService = inventoryService;
  }

  /**
   * Initiate a new rental
   */
  async initiateRental (vehicleId, userId, startAt, endAt) {
    // Validate dates
    const now = new Date();
    if (startAt < now) {
      throw new Error('Start date must be in the future');
    }
    if (endAt <= startAt) {
      throw new Error('End date must be after start date');
    }

    // Check vehicle availability
    const availability = await this.inventoryService.isVehicleAvailable(
      vehicleId,
      startAt,
      endAt
    );

    if (!availability.available) {
      throw new Error(`Vehicle not available: ${availability.reason}`);
    }

    // Create rental with pending status
    const rental = new Rental({
      id: uuidv4(),
      vehicleId,
      userId,
      status: 'pending',
      startAt,
      endAt,
      renewedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const createdRental = await this.rentalRepository.create(rental);

    // Mark vehicle as rented
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    vehicle.markAsRented(rental.id);
    await this.vehicleRepository.update(vehicleId, vehicle);

    return createdRental;
  }

  /**
   * Activate a rental after payment confirmation
   */
  async activateRental (rentalId, paymentRef) {
    const rental = await this.rentalRepository.findById(rentalId);

    if (!rental) {
      throw new Error('Rental not found');
    }

    rental.paymentRef = paymentRef;
    rental.activate();

    return await this.rentalRepository.update(rentalId, rental);
  }

  /**
   * Renew a rental (extend end date)
   */
  async renewRental (rentalId, additionalDays) {
    const rental = await this.rentalRepository.findById(rentalId);

    if (!rental) {
      throw new Error('Rental not found');
    }

    if (!rental.canBeRenewed()) {
      throw new Error('Rental cannot be renewed in current status');
    }

    if (additionalDays <= 0) {
      throw new Error('Additional days must be positive');
    }

    // Calculate new end date
    const newEndAt = new Date(rental.endAt);
    newEndAt.setDate(newEndAt.getDate() + additionalDays);

    rental.renew(newEndAt);

    return await this.rentalRepository.update(rentalId, rental);
  }

  /**
   * End a rental
   */
  async endRental (rentalId) {
    const rental = await this.rentalRepository.findById(rentalId);

    if (!rental) {
      throw new Error('Rental not found');
    }

    if (!rental.canBeEnded()) {
      throw new Error('Rental cannot be ended in current status');
    }

    rental.end();

    return await this.rentalRepository.update(rentalId, rental);
  }

  /**
   * Mark rental as returned
   */
  async returnRental (rentalId) {
    const rental = await this.rentalRepository.findById(rentalId);

    if (!rental) {
      throw new Error('Rental not found');
    }

    if (!rental.canBeReturned()) {
      throw new Error('Rental cannot be returned in current status');
    }

    rental.markAsReturned();
    const updatedRental = await this.rentalRepository.update(rentalId, rental);

    // Mark vehicle as available again
    const vehicle = await this.vehicleRepository.findById(rental.vehicleId);
    if (vehicle) {
      vehicle.markAsAvailable();
      await this.vehicleRepository.update(rental.vehicleId, vehicle);
    }

    return updatedRental;
  }
}

module.exports = RentalTransactionService;
