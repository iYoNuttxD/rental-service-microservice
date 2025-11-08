/**
 * Ensure MongoDB indexes for optimal performance
 */
async function ensureIndexes(db, logger, retentionDays = 90, eventInboxTtlDays = 30) {
  try {
    // Rentals collection indexes
    const rentalsCollection = db.collection('rentals');
    
    await rentalsCollection.createIndex(
      { vehicleId: 1, status: 1 },
      { name: 'idx_vehicle_status' }
    );
    
    await rentalsCollection.createIndex(
      { startAt: 1, endAt: 1 },
      { name: 'idx_rental_period' }
    );
    
    await rentalsCollection.createIndex(
      { userId: 1 },
      { name: 'idx_user' }
    );
    
    await rentalsCollection.createIndex(
      { status: 1, createdAt: -1 },
      { name: 'idx_status_created' }
    );

    // Optional TTL index for archived rentals
    if (retentionDays > 0) {
      await rentalsCollection.createIndex(
        { endAt: 1 },
        { 
          name: 'idx_retention_ttl',
          expireAfterSeconds: retentionDays * 24 * 60 * 60,
          partialFilterExpression: { status: 'returned' }
        }
      );
    }

    // Vehicles collection indexes
    const vehiclesCollection = db.collection('vehicles');
    
    await vehiclesCollection.createIndex(
      { status: 1 },
      { name: 'idx_vehicle_status' }
    );
    
    await vehiclesCollection.createIndex(
      { plate: 1 },
      { name: 'idx_plate_unique', unique: true }
    );

    // Events inbox collection indexes (for idempotency)
    const eventsInboxCollection = db.collection('events_inbox');
    
    await eventsInboxCollection.createIndex(
      { eventId: 1 },
      { name: 'idx_event_id_unique', unique: true }
    );
    
    await eventsInboxCollection.createIndex(
      { processedAt: 1 },
      { 
        name: 'idx_processed_ttl',
        expireAfterSeconds: eventInboxTtlDays * 24 * 60 * 60
      }
    );

    logger.info('MongoDB indexes created successfully');
  } catch (error) {
    logger.error('Failed to create MongoDB indexes', { error: error.message });
    throw error;
  }
}

module.exports = ensureIndexes;
