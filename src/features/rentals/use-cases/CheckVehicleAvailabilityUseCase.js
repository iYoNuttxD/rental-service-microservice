/**
 * CheckVehicleAvailabilityUseCase
 * Use case for checking vehicle availability
 */
class CheckVehicleAvailabilityUseCase {
  constructor (inventoryService, logger) {
    this.inventoryService = inventoryService;
    this.logger = logger;
  }

  async execute (vehicleId, startAt, endAt, filters) {
    try {
      if (vehicleId) {
        // Check specific vehicle
        const result = await this.inventoryService.isVehicleAvailable(
          vehicleId,
          startAt ? new Date(startAt) : new Date(),
          endAt ? new Date(endAt) : new Date(Date.now() + 86400000) // +1 day
        );
        return result;
      } else {
        // Query available vehicles
        const vehicles = await this.inventoryService.queryAvailableVehicles(
          filters || {}
        );
        return {
          available: vehicles.length > 0,
          vehicles
        };
      }
    } catch (error) {
      this.logger.error('Failed to check availability', { error: error.message });
      throw error;
    }
  }
}

module.exports = CheckVehicleAvailabilityUseCase;
