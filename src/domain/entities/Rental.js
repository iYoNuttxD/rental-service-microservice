/**
 * Rental Entity
 * Represents a vehicle rental transaction
 */
class Rental {
  constructor ({
    id,
    vehicleId,
    userId,
    status,
    startAt,
    endAt,
    renewedCount = 0,
    paymentRef = null,
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.vehicleId = vehicleId;
    this.userId = userId;
    this.status = status; // 'pending', 'active', 'ended', 'canceled', 'returned'
    this.startAt = startAt;
    this.endAt = endAt;
    this.renewedCount = renewedCount;
    this.paymentRef = paymentRef;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isPending () {
    return this.status === 'pending';
  }

  isActive () {
    return this.status === 'active';
  }

  canBeRenewed () {
    return this.status === 'active';
  }

  canBeEnded () {
    return this.status === 'active' || this.status === 'pending';
  }

  canBeReturned () {
    return this.status === 'active' || this.status === 'ended';
  }

  activate () {
    if (!this.isPending()) {
      throw new Error('Only pending rentals can be activated');
    }
    this.status = 'active';
    this.updatedAt = new Date();
  }

  renew (newEndAt) {
    if (!this.canBeRenewed()) {
      throw new Error('Only active rentals can be renewed');
    }
    this.endAt = newEndAt;
    this.renewedCount += 1;
    this.updatedAt = new Date();
  }

  end () {
    if (!this.canBeEnded()) {
      throw new Error('Rental cannot be ended in current status');
    }
    this.status = 'ended';
    this.updatedAt = new Date();
  }

  markAsReturned () {
    if (!this.canBeReturned()) {
      throw new Error('Rental cannot be marked as returned in current status');
    }
    this.status = 'returned';
    this.updatedAt = new Date();
  }

  cancel () {
    if (this.status === 'active') {
      throw new Error('Cannot cancel an active rental');
    }
    this.status = 'canceled';
    this.updatedAt = new Date();
  }
}

module.exports = Rental;
