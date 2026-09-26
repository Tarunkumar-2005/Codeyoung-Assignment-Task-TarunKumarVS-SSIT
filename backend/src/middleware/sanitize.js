/**
 * Sanitizes request body, query parameters, and route params 
 * to prevent MongoDB operator injection (e.g. { "$gt": "" }).
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const clean = {};
  for (const key of Object.keys(obj)) {
    // Strip keys that start with $ (MongoDB operator injection) or contain dot notation
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    clean[key] = typeof obj[key] === 'object' ? sanitizeObject(obj[key]) : obj[key];
  }
  return clean;
};

export const sanitizeNoSql = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

export default sanitizeNoSql;
