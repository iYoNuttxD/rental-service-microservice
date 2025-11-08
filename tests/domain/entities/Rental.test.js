const Rental = require('../../../src/domain/entities/Rental');

describe('Rental Entity', () => {
  describe('constructor', () => {
    it('should create a rental with all properties', () => {
      const rental = new Rental({
        id: '123',
        vehicleId: 'v1',
        userId: 'u1',
        status: 'pending',
        startAt: new Date('2024-01-01'),
        endAt: new Date('2024-01-10'),
        renewedCount: 0
      });

      expect(rental.id).toBe('123');
      expect(rental.vehicleId).toBe('v1');
      expect(rental.userId).toBe('u1');
      expect(rental.status).toBe('pending');
      expect(rental.renewedCount).toBe(0);
    });
  });

  describe('isPending', () => {
    it('should return true for pending status', () => {
      const rental = new Rental({
        id: '123',
        vehicleId: 'v1',
        userId: 'u1',
        status: 'pending',
        startAt: new Date(),
        endAt: new Date()
      });

      expect(rental.isPending()).toBe(true);
    });

    it('should return false for active status', () => {
      const rental = new Rental({
        id: '123',
        vehicleId: 'v1',
        userId: 'u1',
        status: 'active',
        startAt: new Date(),
        endAt: new Date()
      });

      expect(rental.isPending()).toBe(false);
    });
  });

  describe('activate', () => {
    it('should activate a pending rental', () => {
      const rental = new Rental({
        id: '123',
        vehicleId: 'v1',
        userId: 'u1',
        status: 'pending',
        startAt: new Date(),
        endAt: new Date()
      });

      rental.activate();

      expect(rental.status).toBe('active');
    });

    it('should throw error if rental is not pending', () => {
      const rental = new Rental({
        id: '123',
        vehicleId: 'v1',
        userId: 'u1',
        status: 'active',
        startAt: new Date(),
        endAt: new Date()
      });

      expect(() => rental.activate()).toThrow('Only pending rentals can be activated');
    });
  });

  describe('renew', () => {
    it('should renew an active rental', () => {
      const rental = new Rental({
        id: '123',
        vehicleId: 'v1',
        userId: 'u1',
        status: 'active',
        startAt: new Date('2024-01-01'),
        endAt: new Date('2024-01-10'),
        renewedCount: 0
      });

      const newEndAt = new Date('2024-01-15');
      rental.renew(newEndAt);

      expect(rental.endAt).toEqual(newEndAt);
      expect(rental.renewedCount).toBe(1);
    });

    it('should throw error if rental is not active', () => {
      const rental = new Rental({
        id: '123',
        vehicleId: 'v1',
        userId: 'u1',
        status: 'pending',
        startAt: new Date(),
        endAt: new Date()
      });

      expect(() => rental.renew(new Date())).toThrow('Only active rentals can be renewed');
    });
  });

  describe('end', () => {
    it('should end an active rental', () => {
      const rental = new Rental({
        id: '123',
        vehicleId: 'v1',
        userId: 'u1',
        status: 'active',
        startAt: new Date(),
        endAt: new Date()
      });

      rental.end();

      expect(rental.status).toBe('ended');
    });

    it('should end a pending rental', () => {
      const rental = new Rental({
        id: '123',
        vehicleId: 'v1',
        userId: 'u1',
        status: 'pending',
        startAt: new Date(),
        endAt: new Date()
      });

      rental.end();

      expect(rental.status).toBe('ended');
    });
  });

  describe('markAsReturned', () => {
    it('should mark an ended rental as returned', () => {
      const rental = new Rental({
        id: '123',
        vehicleId: 'v1',
        userId: 'u1',
        status: 'ended',
        startAt: new Date(),
        endAt: new Date()
      });

      rental.markAsReturned();

      expect(rental.status).toBe('returned');
    });

    it('should mark an active rental as returned', () => {
      const rental = new Rental({
        id: '123',
        vehicleId: 'v1',
        userId: 'u1',
        status: 'active',
        startAt: new Date(),
        endAt: new Date()
      });

      rental.markAsReturned();

      expect(rental.status).toBe('returned');
    });
  });
});
