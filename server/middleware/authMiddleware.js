const jwt = require('jsonwebtoken');
const crypto = require('crypto');

let jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable must be set in production mode.');
  } else {
    // Generate a secure random secret per server process instance in development
    jwtSecret = crypto.randomBytes(32).toString('hex');
    console.warn('⚠️ Security Warning: JWT_SECRET is unset. A temporary strong random key was generated for this session.');
  }
}

const JWT_SECRET = jwtSecret;

const adminOnly = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. Security authentication token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'Pharmacist Admin')) {
      return res.status(403).json({ error: 'Access denied. Administrative privileges required.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authorization token.' });
  }
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

module.exports = { adminOnly, verifyToken, JWT_SECRET };
