/**
 * NoSQL Injection & Input Sanitization Middleware
 * Recursively strips MongoDB operator keys (starting with $ or containing .)
 * and sanitizes primitive values across body, query, and params.
 */
function sanitizeValue(value) {
  if (value === null || value === undefined) return value;
  
  if (typeof value === 'object' && !Array.isArray(value)) {
    const cleanObj = {};
    for (const key of Object.keys(value)) {
      // Strip any MongoDB operator injection keys ($gt, $ne, $where, etc.) and dot notation property traversal
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }
      cleanObj[key] = sanitizeValue(value[key]);
    }
    return cleanObj;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (typeof value === 'string') {
    // Strip null byte injections and trim whitespace
    return value.replace(/\0/g, '').trim();
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
