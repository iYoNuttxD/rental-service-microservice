/**
 * RentalRepositoryPort
 * Interface for rental data persistence
 */
class RentalRepositoryPort {
  async create (rental) {
    throw new Error('Method not implemented');
  }

  async findById (id) {
    throw new Error('Method not implemented');
  }

  async update (id, rental) {
    throw new Error('Method not implemented');
  }

  async findAll (filters = {}, options = {}) {
    throw new Error('Method not implemented');
  }

  async findActiveByVehicleId (vehicleId) {
    throw new Error('Method not implemented');
  }

  async findOverlappingRentals (vehicleId, startAt, endAt) {
    throw new Error('Method not implemented');
  }
}

module.exports = RentalRepositoryPort;
