const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const JwtAuthVerifierPort = require('../../domain/ports/JwtAuthVerifierPort');

/**
 * JWT Auth Verifier
 */
class JwtAuthVerifier extends JwtAuthVerifierPort {
  constructor(config, logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.jwksClient = null;

    if (config.jwksUri) {
      this.jwksClient = jwksClient({
        jwksUri: config.jwksUri,
        cache: true,
        cacheMaxAge: 600000 // 10 minutes
      });
    }
  }

  async _getSigningKey(header) {
    return new Promise((resolve, reject) => {
      this.jwksClient.getSigningKey(header.kid, (err, key) => {
        if (err) {
          reject(err);
        } else {
          resolve(key.getPublicKey());
        }
      });
    });
  }

  async verify(token) {
    try {
      // Remove Bearer prefix if present
      const cleanToken = token.replace(/^Bearer\s+/i, '');

      let decoded;

      if (this.jwksClient) {
        // Verify with JWKS
        decoded = await new Promise((resolve, reject) => {
          jwt.verify(
            cleanToken,
            async (header, callback) => {
              try {
                const key = await this._getSigningKey(header);
                callback(null, key);
              } catch (error) {
                callback(error);
              }
            },
            {
              issuer: this.config.issuer,
              audience: this.config.audience
            },
            (err, decoded) => {
              if (err) reject(err);
              else resolve(decoded);
            }
          );
        });
      } else if (this.config.secret) {
        // Verify with secret (dev fallback)
        decoded = jwt.verify(cleanToken, this.config.secret, {
          issuer: this.config.issuer,
          audience: this.config.audience
        });
      } else {
        throw new Error('No JWT verification method configured');
      }

      this.logger.debug('JWT verified', { userId: decoded.sub });

      return {
        valid: true,
        payload: decoded,
        userId: decoded.sub,
        roles: decoded.roles || []
      };
    } catch (error) {
      this.logger.warn('JWT verification failed', { error: error.message });
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

module.exports = JwtAuthVerifier;
