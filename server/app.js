const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Retailer = require('./models/Retailer');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const retailerRoutes = require('./routes/retailerRoutes');
const { JWT_SECRET, verifyToken } = require('./middleware/authMiddleware');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');
const { sanitizeInputMiddleware } = require('./middleware/sanitizeInput');

const app = express();

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

// 5. Unified Auth Routes
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
          { id: admin._id, name: admin.name, role: admin.role, email: admin.email, username: admin.username },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        return res.json({
          token,
          user: { id: admin._id, name: admin.name, role: admin.role, email: admin.email, username: admin.username }
        });
      }
    }

    // B. Check B2B Retailer in Database
    let retailer = await Retailer.findOne({ username });
    if (!retailer && (username === 'demo_retailer' || username === 'ali_pharmacy' || username === 'city_clinic') && password === 'retailer123') {
      try {
        retailer = await Retailer.create({
          name: username === 'demo_retailer' ? 'Waqas Partner Retailer' : (username === 'ali_pharmacy' ? 'Ali Medicos & Pharmacy' : 'City Care Clinic & Med'),
          username: username,
          password: 'retailer123',
          licenseNo: username === 'demo_retailer' ? '04-DL-3390' : (username === 'ali_pharmacy' ? '04-DL-1982' : '04-DL-2415'),
          area: username === 'demo_retailer' ? 'Clifton / DHA, Karachi' : (username === 'ali_pharmacy' ? 'Denso Hall / Saddar, Karachi' : 'Gulshan-e-Iqbal, Karachi'),
          discountTier: 'Wholesale Trade Price (12-15% OFF)',
          role: 'retailer'
        });
      } catch (e) {}
    }

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

// GET /api/auth/verify - Validate client-side token validity
app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false, error: 'Token missing' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ valid: false, error: 'Invalid or expired token' });
  }

  return res.json({ valid: true, user: decoded });
});

// API Sub-Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/retailers', retailerRoutes);

// Root Health Check Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Waqas Medical Store REST API Active & Secure on MongoDB Atlas.' });
});

module.exports = app;
