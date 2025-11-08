/**
 * JwtAuthVerifierPort
 * Interface for JWT token verification
 */
class JwtAuthVerifierPort {
  async verify(token) {
    throw new Error('Method not implemented');
  }
}

module.exports = JwtAuthVerifierPort;
