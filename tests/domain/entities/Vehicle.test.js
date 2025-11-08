const Vehicle = require('../../../src/domain/entities/Vehicle');

describe('Vehicle Entity', () => {
  describe('constructor', () => {
    it('should create a vehicle with all properties', () => {
      const vehicle = new Vehicle({
        id: 'v1',
        plate: 'ABC-1234',
        model: 'Toyota Corolla',
        status: 'available'
      });

      expect(vehicle.id).toBe('v1');
      expect(vehicle.plate).toBe('ABC-1234');
      expect(vehicle.model).toBe('Toyota Corolla');
      expect(vehicle.status).toBe('available');
      expect(vehicle.currentRentalId).toBeNull();
    });
  });

  describe('isAvailable', () => {
    it('should return true for available vehicle without rental', () => {
      const vehicle = new Vehicle({
        id: 'v1',
        plate: 'ABC-1234',
        model: 'Toyota Corolla',
        status: 'available',
        currentRentalId: null
      });

      expect(vehicle.isAvailable()).toBe(true);
    });

    it('should return false for rented vehicle', () => {
      const vehicle = new Vehicle({
        id: 'v1',
        plate: 'ABC-1234',
        model: 'Toyota Corolla',
        status: 'rented',
        currentRentalId: 'r1'
      });

      expect(vehicle.isAvailable()).toBe(false);
    });

    it('should return false for available vehicle with currentRentalId', () => {
      const vehicle = new Vehicle({
        id: 'v1',
        plate: 'ABC-1234',
        model: 'Toyota Corolla',
        status: 'available',
        currentRentalId: 'r1'
      });

      expect(vehicle.isAvailable()).toBe(false);
    });
  });

  describe('markAsRented', () => {
    it('should mark vehicle as rented', () => {
      const vehicle = new Vehicle({
        id: 'v1',
        plate: 'ABC-1234',
        model: 'Toyota Corolla',
        status: 'available'
      });

      vehicle.markAsRented('r1');

      expect(vehicle.status).toBe('rented');
      expect(vehicle.currentRentalId).toBe('r1');
    });
  });

  describe('markAsAvailable', () => {
    it('should mark vehicle as available', () => {
      const vehicle = new Vehicle({
        id: 'v1',
        plate: 'ABC-1234',
        model: 'Toyota Corolla',
        status: 'rented',
        currentRentalId: 'r1'
      });

      vehicle.markAsAvailable();

      expect(vehicle.status).toBe('available');
      expect(vehicle.currentRentalId).toBeNull();
    });
  });
});
