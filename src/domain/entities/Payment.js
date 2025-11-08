/**
 * Payment Entity
 * Represents a payment transaction
 */
class Payment {
  constructor ({
    id,
    reference,
    amount,
    currency = 'USD',
    status,
    createdAt = new Date()
  }) {
    this.id = id;
    this.reference = reference;
    this.amount = amount;
    this.currency = currency;
    this.status = status; // 'pending', 'completed', 'failed', 'refunded'
    this.createdAt = createdAt;
  }

  isCompleted () {
    return this.status === 'completed';
  }

  isPending () {
    return this.status === 'pending';
  }

  hasFailed () {
    return this.status === 'failed';
  }
}

module.exports = Payment;
