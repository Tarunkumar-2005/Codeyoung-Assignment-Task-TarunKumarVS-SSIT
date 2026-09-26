/**
 * Lightweight HTTP request logger
 * Logs method, route, status code, duration, and IP safely without logging sensitive payloads.
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;

    const logMessage = `[HTTP] ${method} ${url} ${statusCode} - ${duration}ms`;

    if (statusCode >= 500) {
      console.error(logMessage);
    } else if (statusCode >= 400) {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
  });

  next();
};

export default requestLogger;
