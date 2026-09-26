/**
 * Centralized Global Error Handler Middleware
 * Intercepts all operational domain errors, Mongoose cast/validation errors, 
 * and unhandled exceptions, sanitizing output for production security.
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected server error occurred.';
  let details = err.details || undefined;

  // 1. Handle Mongoose Malformed ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    errorCode = 'MALFORMED_ID';
    message = `Invalid ID format: '${err.value}'. Expected a valid 24-character hexadecimal ObjectId.`;
  }

  // 2. Handle Mongoose Schema Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'SCHEMA_VALIDATION_ERROR';
    const errorEntries = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    message = 'Validation failed on one or more fields.';
    details = { fields: errorEntries };
  }

  // 3. Handle JSON Body Syntax Error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    errorCode = 'MALFORMED_JSON_PAYLOAD';
    message = 'Invalid JSON payload structure in request body.';
  }

  // 4. Log server errors (avoiding sensitive data in logs)
  if (statusCode >= 500) {
    console.error(`[CRITICAL ERROR] ${req.method} ${req.originalUrl} - ${err.message}`);
    if (process.env.NODE_ENV !== 'production' && err.stack) {
      console.error(err.stack);
    }
  } else {
    console.warn(`[API WARN] ${statusCode} ${errorCode} - ${req.method} ${req.originalUrl}: ${message}`);
  }

  // 5. Secure JSON Response Envelope (never leak internal stacks to client)
  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details,
    },
  });
};

export default errorHandler;
