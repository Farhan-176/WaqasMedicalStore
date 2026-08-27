// Rate Limiter Middleware to protect against Brute Force & Denial of Service attacks
const attemptsMap = new Map();

// Periodic cleanup of expired rate limit records to prevent memory leaks
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attemptsMap.entries()) {
    if (now > record.resetTime) {
      attemptsMap.delete(key);
    }
  }
}, 5 * 60 * 1000);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

/**
 * Creates a rate limiting middleware function
 * @param {Object} options - { windowMs: time window in ms, max: max requests per window, message: error message }
 */
function createRateLimiter(options = {}) {
  const defaultWindowMs = options.windowMs || 60 * 1000; // 1 minute default
  const defaultMax = options.max || 100;
  const message = options.message || 'Too many requests. Please try again in a moment.';

  return (req, res, next) => {
    const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '127.0.0.1';
    const isLocalhost = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1' || clientIp === 'localhost';

    // Localhost / Development: generous limits (200 requests / 1 min) to avoid blocking testing
    const windowMs = isLocalhost ? 60 * 1000 : defaultWindowMs;
    const maxRequests = isLocalhost ? 200 : defaultMax;

    const key = `${req.baseUrl || ''}${req.path}_${clientIp}`;
    const now = Date.now();

    let record = attemptsMap.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
    }

    record.count += 1;
    attemptsMap.set(key, record);

    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil(record.resetTime / 1000);
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);

    // Standard rate limit headers
    res.setHeader('RateLimit-Limit', maxRequests);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetSeconds);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ 
        error: `Too many login attempts. Please wait ${retryAfter} seconds before trying again.`, 
        retryAfterSeconds: retryAfter 
      });
    }

    next();
  };
}

// User-friendly limiter for authentication endpoint (30 attempts per 2 minutes, relaxed for localhost)
const authLimiter = createRateLimiter({
  windowMs: 2 * 60 * 1000,
  max: 30,
  message: 'Too many login attempts. Please wait 1 minute before trying again.'
});

// General API rate limiter (300 requests per 2 mins)
const apiLimiter = createRateLimiter({
  windowMs: 2 * 60 * 1000,
  max: 300,
  message: 'API rate limit exceeded. Please slow down your requests.'
});

module.exports = { createRateLimiter, authLimiter, apiLimiter };
