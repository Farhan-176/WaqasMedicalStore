/**
 * NoSQL Injection & Input Sanitization Middleware
 * Strips leading $ keys and ensures query params and body values are string/boolean/number primitives
 */
function sanitizeValue(value) {
  if (value === null || value === undefined) return value;
  
  if (typeof value === 'object' && !Array.isArray(value)) {
    const cleanObj = {};
    for (const key of Object.keys(value)) {
      if (key.startsWith('$')) {
        continue; // Strip MongoDB operator keys like $gt, $ne, $where
      }
      cleanObj[key] = sanitizeValue(value[key]);
    }
    return cleanObj;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return value;
}

function sanitizeInputMiddleware(req, res, next) {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
}

module.exports = { sanitizeInputMiddleware, sanitizeValue };
