// Memory Rate Limiter Middleware to protect against Brute Force & Denial of Service attacks
const attemptsMap = new Map();

/**
 * Creates a rate limiting middleware function
 * @param {Object} options - { windowMs: time window in ms, max: max requests per window, message: error message }
 */
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // Default 15 minutes
  const maxRequests = options.max || 100; // Default 100 requests
  const message = options.message || 'Too many requests. Please try again later.';

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const key = `${req.path}_${ip}`;
    const now = Date.now();

    const record = attemptsMap.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count += 1;
    attemptsMap.set(key, record);

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      return res.status(429).json({ error: message, retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000) });
    }

    next();
  };
}

// Strict limiter for authentication endpoint (5 attempts per 15 mins)
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many failed login attempts from this IP. Please wait 15 minutes before trying again.'
});

// General API rate limiter (150 requests per 15 mins)
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: 'API rate limit exceeded. Please slow down your requests.'
});

module.exports = { authLimiter, apiLimiter };
