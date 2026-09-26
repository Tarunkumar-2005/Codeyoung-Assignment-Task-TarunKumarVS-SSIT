import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/healthRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';

export const createApp = () => {
  const app = express();

  // Security Headers & Rate Limiting
  app.use(helmet());
  app.use(globalLimiter);

  // CORS Configuration
  app.use(
    cors({
      origin: [config.clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body Parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Base API routes
  app.use('/api', healthRoutes);
  app.use('/api', bookingRoutes);

  // Fallback 404 Handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Cannot ${req.method} ${req.originalUrl}`,
      },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
