import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';

const startServer = async () => {
  // Attempt DB connection
  await connectDB();

  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`🚀 Codeyoung Booking Server listening on port ${config.port}`);
    console.log(`🌐 Environment: ${config.nodeEnv}`);
    console.log(`🕒 Default Mentor Timezone: ${config.defaultMentorTimezone}`);
    console.log(`🔗 Health Check: http://localhost:${config.port}/api/health`);
    console.log(`====================================================`);
  });

  // Graceful shutdown handling
  const handleShutdown = (signal) => {
    console.log(`\n[Server] Received ${signal}. Closing HTTP server gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer();
