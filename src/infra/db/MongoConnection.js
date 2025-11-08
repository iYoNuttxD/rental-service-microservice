const { MongoClient } = require('mongodb');

/**
 * MongoDB Connection Manager
 */
class MongoConnection {
  constructor(uri, dbName, logger) {
    this.uri = uri;
    this.dbName = dbName;
    this.logger = logger;
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      this.client = new MongoClient(this.uri);
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.logger.info('Connected to MongoDB', { dbName: this.dbName });
    } catch (error) {
      this.logger.error('Failed to connect to MongoDB', { error: error.message });
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.logger.info('Disconnected from MongoDB');
    }
  }

  getDb() {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  getCollection(name) {
    return this.getDb().collection(name);
  }
}

module.exports = MongoConnection;
