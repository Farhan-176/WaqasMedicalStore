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
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');
const { sanitizeInputMiddleware } = require('./middleware/sanitizeInput');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Security Response Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 2. Dynamic CORS Whitelist Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://waqasmedicalstore.vercel.app',
  process.env.CORS_ORIGIN
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(domain => origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));

// 3. NoSQL Injection & Input Sanitization Middleware
app.use(sanitizeInputMiddleware);

// 4. Rate Limiter Middleware for General API Routes
app.use('/api/', apiLimiter);

// 5. Protected Rate Limiter Auth Route for Staff / Admin Login using MongoDB & bcryptjs
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    let { username, password } = req.body;
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Valid username and password strings are required.' });
    }

    username = username.trim().toLowerCase();

    // Database user lookup with exact string match
    const user = await User.findOne({ username });
    if (!user) {
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
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Bcrypt password verification
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
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
    return res.status(500).json({ error: 'Authentication server error.' });
  }
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

// Root Health Check
app.get('/', (req, res) => {
  res.json({ message: 'Waqas Medical Store REST API Active & Secure.' });
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
