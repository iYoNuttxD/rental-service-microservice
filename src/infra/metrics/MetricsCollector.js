const promClient = require('prom-client');

/**
 * MetricsCollector
 * Prometheus metrics collector
 */
class MetricsCollector {
  constructor () {
    this.register = new promClient.Registry();

    // Default metrics (memory, CPU, etc.)
    promClient.collectDefaultMetrics({ register: this.register });

    // Custom counters
    this.rentalsStartedTotal = new promClient.Counter({
      name: 'rentals_started_total',
      help: 'Total number of rentals started',
      labelNames: ['status'],
      registers: [this.register]
    });

    this.rentalsRenewedTotal = new promClient.Counter({
      name: 'rentals_renewed_total',
      help: 'Total number of rentals renewed',
      registers: [this.register]
    });

    this.rentalsEndedTotal = new promClient.Counter({
      name: 'rentals_ended_total',
      help: 'Total number of rentals ended',
      registers: [this.register]
    });

    this.rentalsReturnedTotal = new promClient.Counter({
      name: 'rentals_returned_total',
      help: 'Total number of rentals returned',
      registers: [this.register]
    });

    this.paymentAttemptsTotal = new promClient.Counter({
      name: 'payment_attempts_total',
      help: 'Total number of payment attempts',
      labelNames: ['result'],
      registers: [this.register]
    });

    this.eventsPublishedTotal = new promClient.Counter({
      name: 'events_published_total',
      help: 'Total number of events published',
      labelNames: ['type'],
      registers: [this.register]
    });

    this.httpRequestsTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.register]
    });

    // Histograms
    this.rentalOperationDuration = new promClient.Histogram({
      name: 'rental_operation_duration_ms',
      help: 'Duration of rental operations in milliseconds',
      labelNames: ['operation'],
      buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
      registers: [this.register]
    });

    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_ms',
      help: 'Duration of HTTP requests in milliseconds',
      labelNames: ['method', 'path'],
      buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
      registers: [this.register]
    });
  }

  getMetrics () {
    return this.register.metrics();
  }

  incrementRentalStarted (status = 'success') {
    this.rentalsStartedTotal.inc({ status });
  }

  incrementRentalRenewed () {
    this.rentalsRenewedTotal.inc();
  }

  incrementRentalEnded () {
    this.rentalsEndedTotal.inc();
  }

  incrementRentalReturned () {
    this.rentalsReturnedTotal.inc();
  }

  incrementPaymentAttempt (result) {
    this.paymentAttemptsTotal.inc({ result });
  }

  incrementEventPublished (type) {
    this.eventsPublishedTotal.inc({ type });
  }

  incrementHttpRequest (method, path, status) {
    this.httpRequestsTotal.inc({ method, path, status });
  }

  observeRentalOperation (operation, duration) {
    this.rentalOperationDuration.observe({ operation }, duration);
  }

  observeHttpRequest (method, path, duration) {
    this.httpRequestDuration.observe({ method, path }, duration);
  }
}

module.exports = MetricsCollector;
