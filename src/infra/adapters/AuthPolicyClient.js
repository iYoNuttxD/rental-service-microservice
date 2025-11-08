const axios = require('axios');
const AuthPolicyClientPort = require('../../domain/ports/AuthPolicyClientPort');

/**
 * OPA (Open Policy Agent) Auth Client
 */
class AuthPolicyClient extends AuthPolicyClientPort {
  constructor (opaUrl, policyPath, timeout, failOpen, logger) {
    super();
    this.opaUrl = opaUrl;
    this.policyPath = policyPath;
    this.timeout = timeout;
    this.failOpen = failOpen;
    this.logger = logger;

    this.client = axios.create({
      baseURL: this.opaUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async authorize (input) {
    try {
      this.logger.debug('OPA authorization request', { input });

      const response = await this.client.post(this.policyPath, { input });

      const allowed = response.data.result || false;

      this.logger.debug('OPA authorization response', { allowed });

      return { allowed };
    } catch (error) {
      this.logger.error('OPA authorization failed', { error: error.message });

      if (this.failOpen) {
        this.logger.warn('OPA fail-open: allowing request');
        return { allowed: true };
      }

      return { allowed: false };
    }
  }
}

module.exports = AuthPolicyClient;
