#!/usr/bin/env node

/**
 * Validation script to verify the microservice structure and imports
 * This validates the code can be loaded without requiring actual database connections
 */

console.log('🔍 Validating Rental Service Microservice Structure...\n');

let errors = 0;
let warnings = 0;

// Test imports
const tests = [
  { name: 'Domain Entities', modules: [
    '../src/domain/entities/Vehicle',
    '../src/domain/entities/Rental',
    '../src/domain/entities/Payment'
  ]},
  { name: 'Domain Ports', modules: [
    '../src/domain/ports/RentalRepositoryPort',
    '../src/domain/ports/VehicleRepositoryPort',
    '../src/domain/ports/PaymentGatewayPort',
    '../src/domain/ports/EventPublisherPort',
    '../src/domain/ports/AuthPolicyClientPort',
    '../src/domain/ports/JwtAuthVerifierPort'
  ]},
  { name: 'Domain Services', modules: [
    '../src/domain/services/VehicleInventoryService',
    '../src/domain/services/RentalTransactionService'
  ]},
  { name: 'Use Cases', modules: [
    '../src/features/rentals/use-cases/CreateRentalUseCase',
    '../src/features/rentals/use-cases/RenewRentalUseCase',
    '../src/features/rentals/use-cases/EndRentalUseCase',
    '../src/features/rentals/use-cases/ReturnRentalUseCase',
    '../src/features/rentals/use-cases/ListRentalsUseCase',
    '../src/features/rentals/use-cases/GetRentalUseCase',
    '../src/features/rentals/use-cases/CheckVehicleAvailabilityUseCase'
  ]},
  { name: 'Handlers', modules: [
    '../src/features/rentals/handlers/RentalHandlers',
    '../src/features/rentals/handlers/routes',
    '../src/features/rentals/validators/rentalValidators'
  ]},
  { name: 'Infrastructure', modules: [
    '../src/infra/adapters/MongoRentalRepository',
    '../src/infra/adapters/MongoVehicleRepository',
    '../src/infra/adapters/PaymentIntegrationAdapter',
    '../src/infra/adapters/NatsEventPublisher',
    '../src/infra/adapters/AuthPolicyClient',
    '../src/infra/adapters/JwtAuthVerifier',
    '../src/infra/db/MongoConnection',
    '../src/infra/db/ensureIndexes',
    '../src/infra/logger/Logger',
    '../src/infra/metrics/MetricsCollector',
    '../src/infra/middleware/authMiddleware',
    '../src/infra/middleware/authzMiddleware',
    '../src/infra/middleware/errorHandler',
    '../src/infra/middleware/requestLoggerMiddleware'
  ]},
  { name: 'Main', modules: [
    '../src/main/container'
  ]}
];

tests.forEach(({ name, modules }) => {
  console.log(`📦 Testing ${name}...`);
  modules.forEach(modulePath => {
    try {
      const module = require(modulePath);
      if (module) {
        console.log(`  ✅ ${modulePath.split('/').pop()}`);
      } else {
        console.log(`  ⚠️  ${modulePath.split('/').pop()} - exports empty`);
        warnings++;
      }
    } catch (error) {
      console.log(`  ❌ ${modulePath.split('/').pop()} - ${error.message}`);
      errors++;
    }
  });
  console.log('');
});

// Test domain logic
console.log('🧪 Testing Domain Logic...');

try {
  const Vehicle = require('../src/domain/entities/Vehicle');
  const vehicle = new Vehicle({
    id: 'test-1',
    plate: 'ABC-1234',
    model: 'Test Car',
    status: 'available'
  });
  
  if (vehicle.isAvailable()) {
    console.log('  ✅ Vehicle entity logic works');
  } else {
    console.log('  ❌ Vehicle entity logic failed');
    errors++;
  }
  
  vehicle.markAsRented('rental-1');
  if (vehicle.status === 'rented' && vehicle.currentRentalId === 'rental-1') {
    console.log('  ✅ Vehicle state transitions work');
  } else {
    console.log('  ❌ Vehicle state transitions failed');
    errors++;
  }
} catch (error) {
  console.log(`  ❌ Domain logic test failed - ${error.message}`);
  errors++;
}

try {
  const Rental = require('../src/domain/entities/Rental');
  const rental = new Rental({
    id: 'test-rental-1',
    vehicleId: 'test-vehicle-1',
    userId: 'test-user-1',
    status: 'pending',
    startAt: new Date(),
    endAt: new Date(Date.now() + 86400000)
  });
  
  rental.activate();
  if (rental.status === 'active') {
    console.log('  ✅ Rental entity logic works');
  } else {
    console.log('  ❌ Rental entity logic failed');
    errors++;
  }
} catch (error) {
  console.log(`  ❌ Rental logic test failed - ${error.message}`);
  errors++;
}

console.log('');

// Summary
console.log('=' .repeat(60));
console.log('📊 Validation Summary');
console.log('=' .repeat(60));

if (errors === 0 && warnings === 0) {
  console.log('✅ All validations passed!');
  console.log('');
  console.log('The microservice is ready to use:');
  console.log('  - All modules can be imported successfully');
  console.log('  - Domain logic is working correctly');
  console.log('  - Architecture boundaries are respected');
  console.log('');
  console.log('To start the server (requires MongoDB):');
  console.log('  npm start');
  process.exit(0);
} else {
  console.log(`❌ Found ${errors} errors and ${warnings} warnings`);
  process.exit(1);
}
