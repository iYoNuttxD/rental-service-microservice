const express = require('express');
const { validators, validate } = require('../validators/rentalValidators');

/**
 * Setup rental routes
 */
function setupRentalRoutes(handlers, authMiddleware, authzMiddleware) {
  const router = express.Router();

  // Create rental
  router.post(
    '/',
    authMiddleware,
    validators.createRental,
    validate,
    handlers.createRental()
  );

  // Renew rental
  router.post(
    '/:id/renew',
    authMiddleware,
    validators.renewRental,
    validate,
    handlers.renewRental()
  );

  // End rental
  router.post(
    '/:id/end',
    authMiddleware,
    validators.getRental,
    validate,
    handlers.endRental()
  );

  // Return rental
  router.post(
    '/:id/return',
    authMiddleware,
    validators.getRental,
    validate,
    handlers.returnRental()
  );

  // List rentals
  router.get(
    '/',
    authMiddleware,
    validators.listRentals,
    validate,
    handlers.listRentals()
  );

  // Get rental by ID
  router.get(
    '/:id',
    authMiddleware,
    validators.getRental,
    validate,
    handlers.getRental()
  );

  return router;
}

/**
 * Setup vehicle availability routes
 */
function setupAvailabilityRoutes(handlers, authMiddleware) {
  const router = express.Router();

  router.get(
    '/availability',
    authMiddleware,
    validators.checkAvailability,
    validate,
    handlers.checkAvailability()
  );

  return router;
}

module.exports = { setupRentalRoutes, setupAvailabilityRoutes };
