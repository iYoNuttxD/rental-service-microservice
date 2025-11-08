const VehicleRepositoryPort = require('../../domain/ports/VehicleRepositoryPort');
const Vehicle = require('../../domain/entities/Vehicle');

/**
 * MongoDB implementation of VehicleRepositoryPort
 */
class MongoVehicleRepository extends VehicleRepositoryPort {
  constructor (mongoConnection, logger) {
    super();
    this.mongoConnection = mongoConnection;
    this.logger = logger;
  }

  _getCollection () {
    return this.mongoConnection.getCollection('vehicles');
  }

  _toEntity (doc) {
    if (!doc) return null;
    return new Vehicle({
      id: doc._id,
      plate: doc.plate,
      model: doc.model,
      status: doc.status,
      currentRentalId: doc.currentRentalId
    });
  }

  _toDocument (vehicle) {
    return {
      _id: vehicle.id,
      plate: vehicle.plate,
      model: vehicle.model,
      status: vehicle.status,
      currentRentalId: vehicle.currentRentalId
    };
  }

  async create (vehicle) {
    try {
      const collection = this._getCollection();
      const doc = this._toDocument(vehicle);
      await collection.insertOne(doc);
      this.logger.info('Vehicle created', { vehicleId: vehicle.id });
      return vehicle;
    } catch (error) {
      this.logger.error('Failed to create vehicle', { error: error.message });
      throw error;
    }
  }

  async findById (id) {
    try {
      const collection = this._getCollection();
      const doc = await collection.findOne({ _id: id });
      return this._toEntity(doc);
    } catch (error) {
      this.logger.error('Failed to find vehicle by id', { id, error: error.message });
      throw error;
    }
  }

  async findByPlate (plate) {
    try {
      const collection = this._getCollection();
      const doc = await collection.findOne({ plate });
      return this._toEntity(doc);
    } catch (error) {
      this.logger.error('Failed to find vehicle by plate', { plate, error: error.message });
      throw error;
    }
  }

  async update (id, vehicle) {
    try {
      const collection = this._getCollection();
      const doc = this._toDocument(vehicle);
      await collection.updateOne(
        { _id: id },
        { $set: doc }
      );
      this.logger.info('Vehicle updated', { vehicleId: id });
      return vehicle;
    } catch (error) {
      this.logger.error('Failed to update vehicle', { id, error: error.message });
      throw error;
    }
  }

  async findAvailable (filters = {}) {
    try {
      const collection = this._getCollection();
      const query = { status: 'available' };

      if (filters.model) {
        query.model = { $regex: filters.model, $options: 'i' };
      }

      const docs = await collection.find(query).toArray();
      return docs.map(doc => this._toEntity(doc));
    } catch (error) {
      this.logger.error('Failed to find available vehicles', { error: error.message });
      throw error;
    }
  }
}

module.exports = MongoVehicleRepository;
