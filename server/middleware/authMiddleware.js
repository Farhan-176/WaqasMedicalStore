const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'waqas_medical_prod_jwt_secret_key_98234710293847';

if (!process.env.JWT_SECRET) {
  console.warn('⚠️ Security Warning: JWT_SECRET environment variable is missing. Using fallback configuration key.');
}

const adminOnly = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. Security authentication token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired authorization token.' });
  }
};

module.exports = { adminOnly, JWT_SECRET };
