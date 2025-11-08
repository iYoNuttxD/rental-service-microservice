const { connect, StringCodec } = require('nats');
const EventPublisherPort = require('../../domain/ports/EventPublisherPort');

/**
 * NATS Event Publisher
 */
class NatsEventPublisher extends EventPublisherPort {
  constructor(url, logger) {
    super();
    this.url = url;
    this.logger = logger;
    this.nc = null;
    this.sc = StringCodec();
  }

  async connect() {
    try {
      this.nc = await connect({ servers: this.url });
      this.logger.info('Connected to NATS', { url: this.url });
    } catch (error) {
      this.logger.error('Failed to connect to NATS', { error: error.message });
      throw error;
    }
  }

  async publish(subject, payload) {
    if (!this.nc) {
      throw new Error('NATS not connected');
    }

    try {
      const data = JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString()
      });

      this.nc.publish(subject, this.sc.encode(data));
      
      this.logger.info('Event published', { subject, payload });
    } catch (error) {
      this.logger.error('Failed to publish event', { 
        subject, 
        error: error.message 
      });
      throw error;
    }
  }

  async close() {
    if (this.nc) {
      await this.nc.drain();
      this.logger.info('NATS connection closed');
    }
  }
}

module.exports = NatsEventPublisher;
