/**
 * PaymentGatewayPort
 * Interface for payment gateway integration
 */
class PaymentGatewayPort {
  async createCharge (amount, rentalId, metadata = {}) {
    throw new Error('Method not implemented');
  }

  async confirmCharge (paymentId) {
    throw new Error('Method not implemented');
  }

  async getPaymentStatus (paymentId) {
    throw new Error('Method not implemented');
  }
}

module.exports = PaymentGatewayPort;
