/**
 * VehicleInventoryService
 * Domain service for checking vehicle availability
 */
class VehicleInventoryService {
  constructor (vehicleRepository, rentalRepository) {
    this.vehicleRepository = vehicleRepository;
    this.rentalRepository = rentalRepository;
  }

  /**
   * Check if a vehicle is available for rental in the specified period
   */
  async isVehicleAvailable (vehicleId, startAt, endAt) {
    const vehicle = await this.vehicleRepository.findById(vehicleId);

    if (!vehicle) {
      return { available: false, reason: 'Vehicle not found' };
    }

    if (!vehicle.isAvailable()) {
      return { available: false, reason: 'Vehicle is not available' };
    }

    // Check for overlapping rentals (active or pending)
    const overlappingRentals = await this.rentalRepository.findOverlappingRentals(
      vehicleId,
      startAt,
      endAt
    );

    if (overlappingRentals.length > 0) {
      return {
        available: false,
        reason: 'Vehicle has overlapping rental periods'
      };
    }

    return { available: true };
  }

  /**
   * Query available vehicles based on filters
   */
  async queryAvailableVehicles (filters = {}) {
    const availableVehicles = await this.vehicleRepository.findAvailable(filters);

    // Filter out vehicles with active/pending rentals
    const result = [];
    for (const vehicle of availableVehicles) {
      const activeRental = await this.rentalRepository.findActiveByVehicleId(vehicle.id);
      if (!activeRental) {
        result.push(vehicle);
      }
    }

    return result;
  }
}

module.exports = VehicleInventoryService;
