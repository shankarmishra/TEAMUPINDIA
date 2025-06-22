const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const logger = require('../utils/logger');

let mongoServer;

// Connect to the in-memory database
const connect = async () => {
  try {
    // Close any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('Connected to MongoDB Memory Server');
  } catch (error) {
    logger.error('Error setting up test database:', error);
    throw error;
  }
};

// Drop database, close the connection and stop mongod
const closeDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
    logger.info('Test database closed');
  } catch (error) {
    logger.error('Error closing test database:', error);
    throw error;
  }
};

// Remove all data from collections
const clearDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
      }
      logger.info('Cleared all collections');
    }
  } catch (error) {
    logger.error('Error clearing database:', error);
    throw error;
  }
};

// Setup function to be used in test files
const setupTestDB = () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });
};

module.exports = {
  connect,
  closeDatabase,
  clearDatabase,
  setupTestDB
}; 