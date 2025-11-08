/**
 * Structured Logger
 * Provides JSON structured logging with correlation/trace IDs
 */
class Logger {
  constructor (level = 'info') {
    this.level = level;
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  _shouldLog (level) {
    return this.levels[level] <= this.levels[this.level];
  }

  _formatLog (level, message, meta = {}) {
    return JSON.stringify({
      level,
      timestamp: new Date().toISOString(),
      message,
      ...meta
    });
  }

  error (message, meta = {}) {
    if (this._shouldLog('error')) {
      console.error(this._formatLog('error', message, meta));
    }
  }

  warn (message, meta = {}) {
    if (this._shouldLog('warn')) {
      console.warn(this._formatLog('warn', message, meta));
    }
  }

  info (message, meta = {}) {
    if (this._shouldLog('info')) {
      console.info(this._formatLog('info', message, meta));
    }
  }

  debug (message, meta = {}) {
    if (this._shouldLog('debug')) {
      console.debug(this._formatLog('debug', message, meta));
    }
  }
}

module.exports = Logger;
