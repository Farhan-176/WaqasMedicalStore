const mongoose = require('mongoose');
const app = require('../server/app');

const MONGO_URI = process.env.MONGO_URI;

let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  if (!cachedConnection && MONGO_URI) {
    cachedConnection = mongoose.connect(MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000
    });
  }

  try {
    if (cachedConnection) {
      await cachedConnection;
    }
    return mongoose.connection;
  } catch (error) {
    cachedConnection = null;
    throw error;
  }
}

module.exports = async (req, res) => {
  try {
    await connectToDatabase();
  } catch (err) {
    console.error('MongoDB Atlas Serverless Connection Error:', err.message);
  }
  return app(req, res);
};
