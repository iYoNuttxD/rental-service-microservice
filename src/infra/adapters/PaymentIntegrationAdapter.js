const axios = require('axios');
const PaymentGatewayPort = require('../../domain/ports/PaymentGatewayPort');

/**
 * Payment Gateway Integration Adapter
 */
class PaymentIntegrationAdapter extends PaymentGatewayPort {
  constructor (baseUrl, apiKey, timeout, retryAttempts, logger) {
    super();
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.timeout = timeout;
    this.retryAttempts = retryAttempts;
    this.logger = logger;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createCharge (amount, rentalId, metadata = {}) {
    let lastError;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        this.logger.info('Creating payment charge', {
          rentalId,
          amount,
          attempt
        });

        const response = await this.client.post('/charges', {
          amount,
          currency: 'USD',
          reference: rentalId,
          metadata
        });

        this.logger.info('Payment charge created', {
          paymentId: response.data.id,
          rentalId
        });

        return {
          id: response.data.id,
          status: response.data.status,
          reference: rentalId
        };
      } catch (error) {
        lastError = error;
        this.logger.warn('Payment charge failed', {
          rentalId,
          attempt,
          error: error.message
        });

        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    this.logger.error('Payment charge failed after retries', {
      rentalId,
      error: lastError.message
    });
    throw new Error('Payment gateway unavailable');
  }

  async confirmCharge (paymentId) {
    try {
      this.logger.info('Confirming payment charge', { paymentId });

      const response = await this.client.post(`/charges/${paymentId}/confirm`);

      this.logger.info('Payment charge confirmed', { paymentId });

      return {
        id: response.data.id,
        status: response.data.status
      };
    } catch (error) {
      this.logger.error('Failed to confirm payment charge', {
        paymentId,
        error: error.message
      });
      throw error;
    }
  }

  async getPaymentStatus (paymentId) {
    try {
      const response = await this.client.get(`/charges/${paymentId}`);
      return {
        id: response.data.id,
        status: response.data.status
      };
    } catch (error) {
      this.logger.error('Failed to get payment status', {
        paymentId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = PaymentIntegrationAdapter;
