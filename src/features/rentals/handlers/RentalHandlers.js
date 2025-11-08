/**
 * Rental HTTP Handlers
 */
class RentalHandlers {
  constructor (useCases, logger) {
    this.useCases = useCases;
    this.logger = logger;
  }

  createRental () {
    return async (req, res, next) => {
      try {
        const rental = await this.useCases.createRental.execute(req.body);
        res.status(201).json(rental);
      } catch (error) {
        next(error);
      }
    };
  }

  renewRental () {
    return async (req, res, next) => {
      try {
        const { id } = req.params;
        const { additionalDays } = req.body;
        const rental = await this.useCases.renewRental.execute(id, additionalDays);
        res.json(rental);
      } catch (error) {
        next(error);
      }
    };
  }

  endRental () {
    return async (req, res, next) => {
      try {
        const { id } = req.params;
        const rental = await this.useCases.endRental.execute(id);
        res.json(rental);
      } catch (error) {
        next(error);
      }
    };
  }

  returnRental () {
    return async (req, res, next) => {
      try {
        const { id } = req.params;
        const rental = await this.useCases.returnRental.execute(id);
        res.json(rental);
      } catch (error) {
        next(error);
      }
    };
  }

  listRentals () {
    return async (req, res, next) => {
      try {
        const filters = {
          vehicleId: req.query.vehicleId,
          userId: req.query.userId,
          status: req.query.status,
          startDate: req.query.startDate,
          endDate: req.query.endDate
        };
        const options = {
          page: parseInt(req.query.page) || 1,
          limit: parseInt(req.query.limit) || 10
        };
        const result = await this.useCases.listRentals.execute(filters, options);
        res.json(result);
      } catch (error) {
        next(error);
      }
    };
  }

  getRental () {
    return async (req, res, next) => {
      try {
        const { id } = req.params;
        const rental = await this.useCases.getRental.execute(id);
        res.json(rental);
      } catch (error) {
        next(error);
      }
    };
  }

  checkAvailability () {
    return async (req, res, next) => {
      try {
        const { vehicleId, startAt, endAt, model } = req.query;
        const result = await this.useCases.checkAvailability.execute(
          vehicleId,
          startAt,
          endAt,
          { model }
        );
        res.json(result);
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = RentalHandlers;
