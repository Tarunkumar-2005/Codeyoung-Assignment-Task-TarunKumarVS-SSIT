import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sanitizeNoSql } from './middleware/sanitize.js';
import { requestLogger } from './middleware/logger.js';
import healthRoutes from './routes/healthRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import slotRoutes from './routes/slotRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';

export const createApp = () => {
  const app = express();

  // 1. Security Headers via Helmet
  app.use(helmet());

  // 2. HTTP Request Logger
  app.use(requestLogger);

  // 3. Global Rate Limiter
  app.use(globalLimiter);

  // 4. Strict CORS Configuration
  const allowedOrigins = [
    config.clientOrigin,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS Error: Origin '${origin}' is not allowed by Access-Control-Allow-Origin.`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      maxAge: 86400, // 24 hours preflight cache
    })
  );

  // 5. Body Parsing with payload size limit (prevents denial of service)
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // 6. NoSQL Operator Injection Sanitization
  app.use(sanitizeNoSql);

  // 7. Base API Route Registrations
  app.use('/api', healthRoutes);
  app.use('/api', bookingRoutes);
  app.use('/api', slotRoutes);
  app.use('/api', mentorRoutes);

  // 8. Fallback 404 Route Handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`,
      },
    });
  });

  // 9. Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;
