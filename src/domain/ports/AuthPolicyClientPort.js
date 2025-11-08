/**
 * AuthPolicyClientPort
 * Interface for OPA authorization
 */
class AuthPolicyClientPort {
  async authorize (input) {
    throw new Error('Method not implemented');
  }
}

module.exports = AuthPolicyClientPort;
