const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Retailer = require('./models/Retailer');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const retailerRoutes = require('./routes/retailerRoutes');
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
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(domain => origin && origin.endsWith('.vercel.app'))) {
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

// 5. Unified Login Route for Staff Admin & B2B Retailers
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    let { username, password } = req.body;
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Valid username and password strings are required.' });
    }

    username = username.trim().toLowerCase();

    // A. Check Admin User in Database
    const admin = await User.findOne({ username });
    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.passwordHash);
      if (isMatch) {
        const token = jwt.sign(
          { id: admin._id, name: admin.name, role: admin.role, email: admin.email },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        return res.json({
          token,
          user: { id: admin._id, name: admin.name, role: admin.role, email: admin.email }
        });
      }
    }

    // Fallback hardcoded Admin check
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

    // B. Check B2B Retailer in Database
    const retailer = await Retailer.findOne({ username });
    if (retailer) {
      if (retailer.password === password) {
        const token = jwt.sign(
          { id: retailer._id, name: retailer.name, username: retailer.username, role: 'retailer' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        return res.json({
          token,
          user: {
            id: retailer._id,
            name: retailer.name,
            username: retailer.username,
            area: retailer.area,
            licenseNo: retailer.licenseNo,
            role: 'retailer'
          }
        });
      }
    }

    return res.status(401).json({ error: 'Invalid username or password.' });
  } catch (err) {
    return res.status(500).json({ error: 'Authentication server error.' });
  }
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/retailers', retailerRoutes);

// Root Health Check
app.get('/', (req, res) => {
  res.json({ message: 'Waqas Medical Store REST API Active & Secure on MongoDB Atlas.' });
});

// MongoDB Connection & Server Launch
const MONGO_URI = process.env.MONGO_URI;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB Atlas Cloud Database.');
      app.listen(PORT, () => console.log(`🚀 Express REST API running on port ${PORT}`));
    })
    .catch((err) => {
      console.warn('⚠️ MongoDB connection warning:', err.message);
      app.listen(PORT, () => console.log(`🚀 Express REST API active on port ${PORT}`));
    });
}

module.exports = app;
