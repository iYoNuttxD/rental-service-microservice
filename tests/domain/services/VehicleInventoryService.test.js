const VehicleInventoryService = require('../../../src/domain/services/VehicleInventoryService');

describe('VehicleInventoryService', () => {
  let service;
  let mockVehicleRepo;
  let mockRentalRepo;

  beforeEach(() => {
    mockVehicleRepo = {
      findById: jest.fn(),
      findAvailable: jest.fn()
    };

    mockRentalRepo = {
      findOverlappingRentals: jest.fn(),
      findActiveByVehicleId: jest.fn()
    };

    service = new VehicleInventoryService(mockVehicleRepo, mockRentalRepo);
  });

  describe('isVehicleAvailable', () => {
    it('should return available if vehicle exists and is available with no overlapping rentals', async () => {
      const vehicle = {
        id: 'v1',
        status: 'available',
        currentRentalId: null,
        isAvailable: () => true
      };

      mockVehicleRepo.findById.mockResolvedValue(vehicle);
      mockRentalRepo.findOverlappingRentals.mockResolvedValue([]);

      const result = await service.isVehicleAvailable(
        'v1',
        new Date('2024-01-01'),
        new Date('2024-01-10')
      );

      expect(result.available).toBe(true);
    });

    it('should return not available if vehicle not found', async () => {
      mockVehicleRepo.findById.mockResolvedValue(null);

      const result = await service.isVehicleAvailable(
        'v1',
        new Date('2024-01-01'),
        new Date('2024-01-10')
      );

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Vehicle not found');
    });

    it('should return not available if vehicle is not available', async () => {
      const vehicle = {
        id: 'v1',
        status: 'rented',
        isAvailable: () => false
      };

      mockVehicleRepo.findById.mockResolvedValue(vehicle);

      const result = await service.isVehicleAvailable(
        'v1',
        new Date('2024-01-01'),
        new Date('2024-01-10')
      );

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Vehicle is not available');
    });

    it('should return not available if there are overlapping rentals', async () => {
      const vehicle = {
        id: 'v1',
        status: 'available',
        currentRentalId: null,
        isAvailable: () => true
      };

      mockVehicleRepo.findById.mockResolvedValue(vehicle);
      mockRentalRepo.findOverlappingRentals.mockResolvedValue([{ id: 'r1' }]);

      const result = await service.isVehicleAvailable(
        'v1',
        new Date('2024-01-01'),
        new Date('2024-01-10')
      );

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Vehicle has overlapping rental periods');
    });
  });

  describe('queryAvailableVehicles', () => {
    it('should return vehicles without active rentals', async () => {
      const vehicles = [
        { id: 'v1', status: 'available' },
        { id: 'v2', status: 'available' }
      ];

      mockVehicleRepo.findAvailable.mockResolvedValue(vehicles);
      mockRentalRepo.findActiveByVehicleId
        .mockResolvedValueOnce(null)  // v1 has no active rental
        .mockResolvedValueOnce({ id: 'r1' }); // v2 has active rental

      const result = await service.queryAvailableVehicles();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('v1');
    });
  });
});
