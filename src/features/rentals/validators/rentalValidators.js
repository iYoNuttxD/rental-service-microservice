const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation rules for rental operations
 */
const validators = {
  createRental: [
    body('vehicleId').notEmpty().withMessage('Vehicle ID is required'),
    body('userId').notEmpty().withMessage('User ID is required'),
    body('startAt').isISO8601().withMessage('Valid start date is required'),
    body('endAt').isISO8601().withMessage('Valid end date is required'),
    body('paymentAmount').isFloat({ min: 0 }).withMessage('Valid payment amount is required')
  ],

  renewRental: [
    param('id').notEmpty().withMessage('Rental ID is required'),
    body('additionalDays').isInt({ min: 1 }).withMessage('Additional days must be positive')
  ],

  getRental: [
    param('id').notEmpty().withMessage('Rental ID is required')
  ],

  listRentals: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
  ],

  checkAvailability: [
    query('vehicleId').optional(),
    query('startAt').optional().isISO8601().withMessage('Valid start date required'),
    query('endAt').optional().isISO8601().withMessage('Valid end date required')
  ]
};

/**
 * Middleware to check validation results
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
}

module.exports = { validators, validate };
