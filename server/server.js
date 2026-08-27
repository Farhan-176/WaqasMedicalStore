const mongoose = require('mongoose');
require('dotenv').config();

const app = require('./app');
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
      .then(() => {
        console.log('✅ Connected to MongoDB Atlas Cloud Database.');
        app.listen(PORT, () => console.log(`🚀 Express REST API running on port ${PORT}`));
      })
      .catch((err) => {
        console.warn('⚠️ MongoDB connection warning:', err.message);
        app.listen(PORT, () => console.log(`🚀 Express REST API active on port ${PORT}`));
      });
  } else {
    console.warn('⚠️ MONGO_URI environment variable is unset.');
    app.listen(PORT, () => console.log(`🚀 Express REST API active on port ${PORT}`));
  }
}

module.exports = app;
