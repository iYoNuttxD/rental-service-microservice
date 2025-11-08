const RentalRepositoryPort = require('../../domain/ports/RentalRepositoryPort');
const Rental = require('../../domain/entities/Rental');

/**
 * MongoDB implementation of RentalRepositoryPort
 */
class MongoRentalRepository extends RentalRepositoryPort {
  constructor (mongoConnection, logger) {
    super();
    this.mongoConnection = mongoConnection;
    this.logger = logger;
  }

  _getCollection () {
    return this.mongoConnection.getCollection('rentals');
  }

  _toEntity (doc) {
    if (!doc) return null;
    return new Rental({
      id: doc._id,
      vehicleId: doc.vehicleId,
      userId: doc.userId,
      status: doc.status,
      startAt: doc.startAt,
      endAt: doc.endAt,
      renewedCount: doc.renewedCount || 0,
      paymentRef: doc.paymentRef,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }

  _toDocument (rental) {
    return {
      _id: rental.id,
      vehicleId: rental.vehicleId,
      userId: rental.userId,
      status: rental.status,
      startAt: rental.startAt,
      endAt: rental.endAt,
      renewedCount: rental.renewedCount,
      paymentRef: rental.paymentRef,
      createdAt: rental.createdAt,
      updatedAt: rental.updatedAt
    };
  }

  async create (rental) {
    try {
      const collection = this._getCollection();
      const doc = this._toDocument(rental);
      await collection.insertOne(doc);
      this.logger.info('Rental created', { rentalId: rental.id });
      return rental;
    } catch (error) {
      this.logger.error('Failed to create rental', { error: error.message });
      throw error;
    }
  }

  async findById (id) {
    try {
      const collection = this._getCollection();
      const doc = await collection.findOne({ _id: id });
      return this._toEntity(doc);
    } catch (error) {
      this.logger.error('Failed to find rental by id', { id, error: error.message });
      throw error;
    }
  }

  async update (id, rental) {
    try {
      const collection = this._getCollection();
      const doc = this._toDocument(rental);
      await collection.updateOne(
        { _id: id },
        { $set: doc }
      );
      this.logger.info('Rental updated', { rentalId: id });
      return rental;
    } catch (error) {
      this.logger.error('Failed to update rental', { id, error: error.message });
      throw error;
    }
  }

  async findAll (filters = {}, options = {}) {
    try {
      const collection = this._getCollection();
      const query = {};

      if (filters.vehicleId) query.vehicleId = filters.vehicleId;
      if (filters.userId) query.userId = filters.userId;
      if (filters.status) query.status = filters.status;
      if (filters.startDate || filters.endDate) {
        query.startAt = {};
        if (filters.startDate) query.startAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.startAt.$lte = new Date(filters.endDate);
      }

      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;

      const docs = await collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await collection.countDocuments(query);

      return {
        data: docs.map(doc => this._toEntity(doc)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Failed to find rentals', { error: error.message });
      throw error;
    }
  }

  async findActiveByVehicleId (vehicleId) {
    try {
      const collection = this._getCollection();
      const doc = await collection.findOne({
        vehicleId,
        status: { $in: ['pending', 'active'] }
      });
      return this._toEntity(doc);
    } catch (error) {
      this.logger.error('Failed to find active rental', { vehicleId, error: error.message });
      throw error;
    }
  }

  async findOverlappingRentals (vehicleId, startAt, endAt) {
    try {
      const collection = this._getCollection();
      const docs = await collection.find({
        vehicleId,
        status: { $in: ['pending', 'active'] },
        $or: [
          { startAt: { $lte: endAt }, endAt: { $gte: startAt } }
        ]
      }).toArray();
      return docs.map(doc => this._toEntity(doc));
    } catch (error) {
      this.logger.error('Failed to find overlapping rentals', {
        vehicleId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = MongoRentalRepository;
