/**
 * VehicleRepositoryPort
 * Interface for vehicle data persistence
 */
class VehicleRepositoryPort {
  async create(vehicle) {
    throw new Error('Method not implemented');
  }

  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByPlate(plate) {
    throw new Error('Method not implemented');
  }

  async update(id, vehicle) {
    throw new Error('Method not implemented');
  }

  async findAvailable(filters = {}) {
    throw new Error('Method not implemented');
  }
}

module.exports = VehicleRepositoryPort;
