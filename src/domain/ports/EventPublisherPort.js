/**
 * EventPublisherPort
 * Interface for event publishing (NATS)
 */
class EventPublisherPort {
  async publish (subject, payload) {
    throw new Error('Method not implemented');
  }

  async close () {
    throw new Error('Method not implemented');
  }
}

module.exports = EventPublisherPort;
