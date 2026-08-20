const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const { JWT_SECRET } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration based on environment settings
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Auth Route for Staff / Admin Login using MongoDB & bcryptjs
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // 1. Database check
    const user = await User.findOne({ username });
    if (!user) {
      // Fallback check for demo mode if database hasn't been seeded yet
      if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign(
          { id: 'staff-01', name: 'Dr. Waqas (Chief Pharmacist)', role: 'Pharmacist Admin' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        return res.json({
          token,
          user: { id: 'staff-01', name: 'Dr. Waqas (Chief Pharmacist)', role: 'Pharmacist Admin' }
        });
      }
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // 2. Bcrypt password verification
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role, email: user.email }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Authentication server error: ' + err.message });
  }
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

// Root Health Check
app.get('/', (req, res) => {
  res.json({ message: 'Waqas Medical Store MERN Backend REST API active.' });
});

// MongoDB Connection & Server Launch
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/waqas_medical_store';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Database.');
    app.listen(PORT, () => console.log(`🚀 Express REST API running on port ${PORT}`));
  })
  .catch((err) => {
    console.warn('⚠️ MongoDB connection warning (Running in offline fallback mode):', err.message);
    app.listen(PORT, () => console.log(`🚀 Express REST API active on port ${PORT}`));
  });
